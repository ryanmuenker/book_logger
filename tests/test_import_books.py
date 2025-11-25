from models import Book, User, UserBook, db


def sample_books():
    return [
        {"title": "Ready Player One", "author": "Ernest Cline", "isbn": "123"},
        {"title": "Dune", "author": "Frank Herbert", "isbn": "456"},
    ]


def test_preview_goodreads_counts_new_and_duplicates(auth_client, app):
    # Existing book for duplicate scenario
    with app.app_context():
        book = Book(title="Ready Player One", author="Ernest Cline", isbn="123")
        db.session.add(book)
        db.session.commit()
        user = User.query.filter_by(email="tester@example.com").first()
        link = UserBook(user_id=user.id, book_id=book.id)
        db.session.add(link)
        db.session.commit()

    resp = auth_client.post(
        "/api/import/goodreads/preview",
        json={"books": sample_books()},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["duplicates"] == 1  # same book already exists
    assert data["new"] == 1


def test_import_goodreads_creates_user_books(auth_client, app):
    resp = auth_client.post(
        "/api/import/goodreads",
        json={"books": sample_books()},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["imported"] == 2
    assert data["skipped"] == 0

    with app.app_context():
        assert Book.query.count() == 2
        assert UserBook.query.count() == 2


