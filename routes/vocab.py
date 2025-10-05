from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request, render_template, redirect, url_for, flash
from flask_login import login_required, current_user

from models import db, VocabEntry, Book


bp = Blueprint('vocab', __name__, url_prefix='/vocab')


def _default_next_review(box: int) -> datetime:
    intervals = {1: 1, 2: 2, 3: 5, 4: 10, 5: 20}
    days = intervals.get(max(1, min(5, box)), 1)
    return datetime.utcnow() + timedelta(days=days)


@bp.route('/book/<int:book_id>')
@login_required
def list_for_book(book_id: int):
    book = Book.query.get_or_404(book_id)
    entries = (
        VocabEntry.query
        .filter_by(user_id=current_user.id, book_id=book_id)
        .order_by(VocabEntry.word.asc())
        .all()
    )
    if (request.args.get('format') or '').lower() == 'json':
        return jsonify({
            'book': {
                'id': book.id,
                'title': book.title,
                'author': book.author,
            },
            'entries': [
                {
                    'id': e.id,
                    'word': e.word,
                    'definition': e.definition,
                    'quote': e.quote,
                    'srs_box': e.srs_box,
                    'next_review_at': (e.next_review_at.isoformat() if e.next_review_at else None),
                }
                for e in entries
            ]
        })
    return render_template('compendium.html', book=book, entries=entries, title=f"Compendium: {book.title}")


@bp.route('/api', methods=['POST'])
@login_required
def create_entry():
    data = request.get_json(silent=True) or {}
    book_id = int(data.get('book_id') or 0)
    word = (data.get('word') or '').strip()
    if not book_id or not word:
        return jsonify({"error": "book_id and word are required"}), 400
    definition = (data.get('definition') or '').strip()
    quote = (data.get('quote') or '').strip()
    entry = VocabEntry(
        user_id=current_user.id,
        book_id=book_id,
        word=word,
        definition=definition,
        quote=quote,
        srs_box=1,
        next_review_at=None,  # New entries appear immediately in review queue
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"ok": True, "id": entry.id})


@bp.route('/api/<int:entry_id>', methods=['PATCH'])
@login_required
def update_entry(entry_id: int):
    entry = VocabEntry.query.get_or_404(entry_id)
    if entry.user_id != current_user.id:
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}
    if 'word' in data:
        entry.word = (data.get('word') or entry.word).strip()
    if 'definition' in data:
        entry.definition = (data.get('definition') or '')
    if 'quote' in data:
        entry.quote = (data.get('quote') or '')
    db.session.commit()
    return jsonify({"ok": True})


@bp.route('/api/<int:entry_id>', methods=['DELETE'])
@login_required
def delete_entry(entry_id: int):
    entry = VocabEntry.query.get_or_404(entry_id)
    if entry.user_id != current_user.id:
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"ok": True})


@bp.route('/review/queue')
@login_required
def review_queue():
    book_id = request.args.get('book_id', type=int)
    
    # Build query - show ALL vocabulary entries for review
    query = (
        VocabEntry.query
        .filter(VocabEntry.user_id == current_user.id)
    )
    
    # Filter by book if specified
    if book_id:
        query = query.filter(VocabEntry.book_id == book_id)
    
    queue = (
        query
        .order_by(VocabEntry.srs_box.asc(), VocabEntry.word.asc())
        .limit(100)  # Increased limit
        .all()
    )
    if request.args.get('format') == 'json':
        # Get book titles for context
        book_ids = {e.book_id for e in queue}
        books = {}
        if book_ids:
            from models import Book
            book_records = Book.query.filter(Book.id.in_(book_ids)).all()
            books = {b.id: {"title": b.title, "author": b.author} for b in book_records}
        
        return jsonify({
            "entries": [
                {
                    "id": e.id,
                    "word": e.word,
                    "definition": e.definition,
                    "quote": e.quote,
                    "srs_box": e.srs_box,
                    "book_id": e.book_id,
                    "book_title": books.get(e.book_id, {}).get("title", f"Book #{e.book_id}"),
                    "book_author": books.get(e.book_id, {}).get("author", ""),
                }
                for e in queue
            ]
        })
    return render_template('review.html', entries=queue, title='Flashcard Review')


@bp.route('/review/books')
@login_required
def review_books():
    """Get books that have vocabulary entries for review filtering"""
    from models import Book
    books = (
        db.session.query(Book)
        .join(VocabEntry, Book.id == VocabEntry.book_id)
        .filter(VocabEntry.user_id == current_user.id)
        .distinct()
        .order_by(Book.title)
        .all()
    )
    return jsonify({
        "books": [
            {"id": b.id, "title": b.title, "author": b.author}
            for b in books
        ]
    })


@bp.route('/review/<int:entry_id>/answer', methods=['POST'])
@login_required
def submit_answer(entry_id: int):
    correctness = (request.form.get('result') or '').strip().lower()
    entry = VocabEntry.query.get_or_404(entry_id)
    if entry.user_id != current_user.id:
        return jsonify({"error": "forbidden"}), 403
    if correctness == 'correct':
        entry.srs_box = min(5, (entry.srs_box or 1) + 1)
    else:
        entry.srs_box = 1
    entry.next_review_at = _default_next_review(entry.srs_box)
    db.session.commit()
    flash('Answer recorded.')
    return redirect(url_for('vocab.review_queue'))


