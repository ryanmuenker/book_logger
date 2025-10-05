from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Book, UserBook
import re

bp = Blueprint('import', __name__, url_prefix='/api/import')


@bp.route('/goodreads/preview', methods=['POST'])
@login_required
def preview_goodreads():
    """Preview Goodreads import without actually importing"""
    data = request.get_json(silent=True) or {}
    books = data.get('books', [])
    
    if not books:
        return jsonify({"error": "No books provided"}), 400
    
    duplicates = 0
    new_books = 0
    
    for book_data in books:
        title = book_data.get('title', '').strip()
        author = book_data.get('author', '').strip()
        isbn = book_data.get('isbn', '').strip()
        
        if not title or not author:
            continue
            
        # Check if book already exists
        existing = None
        if isbn:
            existing = Book.query.filter_by(isbn=isbn).first()
        if not existing:
            existing = Book.query.filter_by(title=title, author=author).first()
            
        if existing:
            # Check if user already has this book
            user_book = UserBook.query.filter_by(
                user_id=current_user.id, 
                book_id=existing.id
            ).first()
            if user_book:
                duplicates += 1
            else:
                new_books += 1
        else:
            new_books += 1
    
    return jsonify({
        "books": books,
        "duplicates": duplicates,
        "new": new_books
    })


@bp.route('/goodreads', methods=['POST'])
@login_required
def import_goodreads():
    """Import books from Goodreads CSV"""
    data = request.get_json(silent=True) or {}
    books = data.get('books', [])
    
    if not books:
        return jsonify({"error": "No books provided"}), 400
    
    imported = 0
    skipped = 0
    
    for book_data in books:
        title = book_data.get('title', '').strip()
        author = book_data.get('author', '').strip()
        isbn = book_data.get('isbn', '').strip()
        rating = book_data.get('rating', 0) or 0
        date_read = book_data.get('date_read', '').strip()
        date_added = book_data.get('date_added', '').strip()
        shelves = book_data.get('shelves', '').strip()
        review = book_data.get('review', '').strip()
        
        if not title or not author:
            skipped += 1
            continue
            
        # Find or create book
        book = None
        if isbn:
            book = Book.query.filter_by(isbn=isbn).first()
        if not book:
            book = Book.query.filter_by(title=title, author=author).first()
            
        if not book:
            # Create new book
            book = Book(
                title=title,
                author=author,
                isbn=isbn if isbn else None,
                rating=rating if rating > 0 else None,
                notes=review if review else None
            )
            db.session.add(book)
            db.session.flush()  # Get the ID
        
        # Check if user already has this book
        user_book = UserBook.query.filter_by(
            user_id=current_user.id, 
            book_id=book.id
        ).first()
        
        if user_book:
            skipped += 1
            continue
            
        # Determine status from shelves
        status = 'wishlist'  # default
        if shelves:
            shelves_lower = shelves.lower()
            if any(word in shelves_lower for word in ['read', 'currently-reading']):
                status = 'completed' if 'read' in shelves_lower else 'reading'
        
        # Create user book link
        user_book = UserBook(
            user_id=current_user.id,
            book_id=book.id,
            status=status,
            rating=rating if rating > 0 else None,
            start_date=date_added if date_added else None,
            finish_date=date_read if date_read else None,
            notes=review if review else None,
            tags=shelves if shelves else None
        )
        db.session.add(user_book)
        imported += 1
    
    try:
        db.session.commit()
        return jsonify({
            "imported": imported,
            "skipped": skipped
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to import books"}), 500
