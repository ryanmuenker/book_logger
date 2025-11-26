
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, Response
import requests
from models import db, Book, UserBook
from flask_login import login_required, current_user
from services.isbn import search_books

bp = Blueprint('books', __name__)

@bp.route("/")
def home_redirect():
    return redirect(url_for('books.books_list'))

@bp.route("/books")
def books_list():
    """Books list page - shows user-specific books if logged in"""
    if current_user.is_authenticated:
        # Get user's books through UserBook relationship
        links = (
            db.session.query(UserBook, Book)
            .join(Book, UserBook.book_id == Book.id)
            .filter(UserBook.user_id == current_user.id)
            .order_by(UserBook.id.desc())
            .all()
        )
        books = [book for _, book in links]
    else:
        books = []
    all_tags = sorted({t.strip() for b in books for t in (b.tags or '').split(',') if t.strip()})
    return render_template("books_list.html", books=books, all_tags=all_tags, title="Library")


@bp.route("/api/search")
def api_search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"results": []})
    results = search_books(q, limit=10)
    return jsonify({"results": results})


@bp.route("/search")
def search_page():
    return render_template("search.html", title="Search Books")


@bp.route('/books/<int:book_id>')
def book_detail(book_id):
    b = Book.query.get_or_404(book_id)
    # If user is logged in, check if they own this book and get their specific data
    user_data = None
    if current_user.is_authenticated:
        link = UserBook.query.filter_by(user_id=current_user.id, book_id=book_id).first()
        if link:
            user_data = {
                'status': link.status,
                'rating': link.rating,
                'start_date': link.start_date,
                'finish_date': link.finish_date,
                'tags': link.tags,
                'notes': link.notes,
            }
    return render_template('book_detail.html', book=b, user_data=user_data, title=b.title)


@bp.route('/api/add_to_library', methods=['POST'])
@login_required
def add_to_library():
    data = request.get_json(silent=True) or {}
    isbn = (data.get('isbn') or '').strip()
    title = (data.get('title') or '').strip()
    author = (data.get('author') or '').strip()
    cover_id = data.get('cover_id')
    if not isbn and (not title or not author):
        return jsonify({"error": "isbn or (title and author) required"}), 400

    # Find or create Book
    book = None
    if isbn:
        book = Book.query.filter_by(isbn=isbn).first()
    if not book:
        if not title or not author:
            return jsonify({"error": "title and author required to create book"}), 400
        book = Book(title=title, author=author, isbn=isbn, cover_id=cover_id)
        db.session.add(book)
        db.session.commit()

    link = UserBook.query.filter_by(user_id=current_user.id, book_id=book.id).first()
    if not link:
        link = UserBook(user_id=current_user.id, book_id=book.id, status='wishlist')
        db.session.add(link)
        db.session.commit()

    return jsonify({"ok": True, "book_id": book.id})


@bp.route('/my')
@login_required
def my_library():
    links = (
        db.session.query(UserBook, Book)
        .join(Book, UserBook.book_id == Book.id)
        .filter(UserBook.user_id == current_user.id)
        .order_by(UserBook.id.desc())
        .all()
    )
    items = []
    for link, book in links:
        items.append({
            'book': book,
            'status': link.status,
            'rating': link.rating,
        })
    return render_template('my_library.html', items=items, title='My Library')

@bp.route("/books/new", methods=["GET", "POST"])
@login_required
def books_new():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        author = request.form.get("author", "").strip()
        if not title or not author:
            flash("Title and Author are required.")
            return render_template("book_form.html", book=None, title="Add Book")
        
        # Find or create Book
        book = Book.query.filter_by(title=title, author=author).first()
        if not book:
            book = Book(
                title=title,
                author=author,
                start_date=request.form.get("start_date") or None,
                finish_date=request.form.get("finish_date") or None,
                rating=(int(request.form.get("rating")) if request.form.get("rating") else None),
                tags=request.form.get("tags") or "",
                notes=request.form.get("notes") or ""
            )
            db.session.add(book)
            db.session.flush()  # Get book.id
        
        # Create UserBook link
        link = UserBook.query.filter_by(user_id=current_user.id, book_id=book.id).first()
        if not link:
            link = UserBook(
                user_id=current_user.id,
                book_id=book.id,
                status='reading',
                start_date=request.form.get("start_date") or None,
                finish_date=request.form.get("finish_date") or None,
                rating=(int(request.form.get("rating")) if request.form.get("rating") else None),
                tags=request.form.get("tags") or "",
                notes=request.form.get("notes") or ""
            )
            db.session.add(link)
        else:
            # Update existing link
            link.start_date = request.form.get("start_date") or None
            link.finish_date = request.form.get("finish_date") or None
            link.rating = (int(request.form.get("rating")) if request.form.get("rating") else None)
            link.tags = request.form.get("tags") or ""
            link.notes = request.form.get("notes") or ""
        
        db.session.commit()
        flash("Book added to your library.")
        return redirect(url_for("books.books_list"))
    return render_template("book_form.html", book=None, title="Add Book")

@bp.route("/books/<int:book_id>/edit", methods=["GET", "POST"])
@login_required
def books_edit(book_id):
    # Check if user owns this book
    link = UserBook.query.filter_by(user_id=current_user.id, book_id=book_id).first()
    if not link:
        flash("You don't have permission to edit this book.")
        return redirect(url_for("books.books_list"))
    
    b = Book.query.get_or_404(book_id)
    if request.method == "POST":
        # Update UserBook (user-specific data)
        link.start_date = request.form.get("start_date") or None
        link.finish_date = request.form.get("finish_date") or None
        link.rating = (int(request.form.get("rating")) if request.form.get("rating") else None)
        link.tags = request.form.get("tags") or ""
        link.notes = request.form.get("notes") or ""
        
        # Only update Book title/author if no other users have this book
        other_links = UserBook.query.filter(UserBook.book_id == book_id, UserBook.user_id != current_user.id).count()
        if other_links == 0:
            b.title = request.form.get("title", b.title).strip()
            b.author = request.form.get("author", b.author).strip()
        
        db.session.commit()
        flash("Book updated.")
        return redirect(url_for("books.books_list"))
    
    # Create a combined book object for the form
    form_book = {
        'id': b.id,
        'title': b.title,
        'author': b.author,
        'start_date': link.start_date or b.start_date,
        'finish_date': link.finish_date or b.finish_date,
        'rating': link.rating or b.rating,
        'tags': link.tags or b.tags or "",
        'notes': link.notes or b.notes or "",
    }
    return render_template("book_form.html", book=form_book, title=f"Edit: {b.title}")

@bp.route("/books/<int:book_id>/delete", methods=["POST"])
@login_required
def books_delete(book_id):
    # Check if user owns this book
    link = UserBook.query.filter_by(user_id=current_user.id, book_id=book_id).first()
    if not link:
        flash("You don't have permission to delete this book.")
        return redirect(url_for("books.books_list"))
    
    # Remove the UserBook link (user's association with the book)
    db.session.delete(link)
    
    # Only delete the Book if no other users have it
    other_links = UserBook.query.filter(UserBook.book_id == book_id, UserBook.user_id != current_user.id).count()
    if other_links == 0:
        b = Book.query.get_or_404(book_id)
        db.session.delete(b)
    
    db.session.commit()
    flash("Book removed from your library.")
    return redirect(url_for("books.books_list"))


@bp.route('/api/books.json')
def api_books_json():
    """Returns user-specific books if logged in, empty array otherwise"""
    if not current_user.is_authenticated:
        return jsonify([])
    
    # Get user's books through UserBook relationship
    links = (
        db.session.query(UserBook, Book)
        .join(Book, UserBook.book_id == Book.id)
        .filter(UserBook.user_id == current_user.id)
        .order_by(UserBook.id.desc())
        .all()
    )
    
    payload = []
    for link, book in links:
        # Use UserBook data (rating, tags, notes) if available, fallback to Book data
        payload.append({
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'isbn': book.isbn,
            'cover_id': book.cover_id,
            'start_date': link.start_date or book.start_date,
            'finish_date': link.finish_date or book.finish_date,
            'rating': link.rating or book.rating,
            'tags': link.tags or book.tags or '',
            'notes': link.notes or book.notes or '',
            'status': link.status,
        })
    return jsonify(payload)


@bp.route('/export.json')
def export_json():
    """Legacy endpoint - returns all books (for admin/export purposes)"""
    books = Book.query.order_by(Book.id.asc()).all()
    payload = []
    for b in books:
        payload.append({
            'id': b.id,
            'title': b.title,
            'author': b.author,
            'isbn': b.isbn,
            'cover_id': b.cover_id,
            'start_date': b.start_date,
            'finish_date': b.finish_date,
            'rating': b.rating,
            'tags': b.tags,
            'notes': b.notes,
        })
    return jsonify(payload)


@bp.route('/api/my.json')
@login_required
def my_json():
    links = (
        db.session.query(UserBook, Book)
        .join(Book, UserBook.book_id == Book.id)
        .filter(UserBook.user_id == current_user.id)
        .order_by(UserBook.id.desc())
        .all()
    )
    items = []
    for link, book in links:
        items.append({
            'book': {
                'id': book.id,
                'title': book.title,
                'author': book.author,
                'isbn': book.isbn,
                'cover_id': book.cover_id,
            },
            'status': link.status,
            'rating': link.rating,
        })
    return jsonify(items)


@bp.route('/api/backfill_covers', methods=['POST'])
@login_required
def backfill_covers():
    updated = 0
    skipped = 0
    failed = 0
    books = Book.query.all()
    for b in books:
        if b.cover_id or (b.isbn and str(b.isbn).strip()):
            skipped += 1
            continue
        q = f"{b.title} {b.author}".strip()
        try:
            r = requests.get('https://openlibrary.org/search.json', params={'q': q, 'limit': 1}, timeout=5)
            if r.status_code == 200:
                docs = (r.json() or {}).get('docs') or []
                if docs:
                    cid = docs[0].get('cover_i')
                    if cid:
                        b.cover_id = int(cid)
                        updated += 1
        except Exception:
            failed += 1
    if updated:
        db.session.commit()
    return jsonify({"updated": updated, "skipped": skipped, "failed": failed})


@bp.route('/export.csv')
def export_csv():
    books = Book.query.order_by(Book.id.asc()).all()
    lines = [
        'id,title,author,isbn,start_date,finish_date,rating,tags,notes'
    ]
    def esc(value: str) -> str:
        if value is None:
            return ''
        text = str(value)
        if any(c in text for c in [',', '"', '\n']):
            return '"' + text.replace('"', '""') + '"'
        return text
    for b in books:
        lines.append(','.join([
            esc(b.id), esc(b.title), esc(b.author), esc(b.isbn), esc(b.start_date), esc(b.finish_date), esc(b.rating), esc(b.tags), esc(b.notes)
        ]))
    csv_text = '\n'.join(lines) + '\n'
    return Response(csv_text, mimetype='text/csv', headers={'Content-Disposition': 'attachment; filename=books.csv'})
