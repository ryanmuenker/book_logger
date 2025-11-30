from unittest.mock import MagicMock

from models import Book, UserBook, db


def create_book(app, **kwargs):
    data = {"title": "Sample", "author": "Author", **kwargs}
    with app.app_context():
        book = Book(**data)
        db.session.add(book)
        db.session.commit()
        return book.id


def test_books_list_renders_books(auth_client, app):
    """Test that books list shows user's books when logged in"""
    with app.app_context():
        from models import User
        # Get the user that was registered by auth_client
        user = User.query.filter_by(email="tester@example.com").first()
        assert user is not None
        # Create book and link it to the authenticated user
        book = Book(title="Book One", author="Author One")
        db.session.add(book)
        db.session.flush()
        book_id = book.id
        # Create UserBook link
        link = UserBook(user_id=user.id, book_id=book_id, status='reading')
        db.session.add(link)
        db.session.commit()
    
    resp = auth_client.get("/books")
    assert resp.status_code == 200
    assert resp.is_json
    data = resp.get_json()
    assert "books" in data
    assert any(b.get("title") == "Book One" for b in data["books"])
    
    detail_resp = auth_client.get(f"/books/{book_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.is_json
    detail_data = detail_resp.get_json()
    assert detail_data["title"] == "Book One"


def test_books_create_edit_delete_flow(auth_client, app):
    """Test book CRUD operations require authentication"""
    # Create
    create_resp = auth_client.post(
        "/books/new",
        data={
            "title": "New Book",
            "author": "New Author",
            "rating": "4",
            "tags": "tag1, tag2",
        },
        follow_redirects=True,
    )
    assert create_resp.status_code == 200

    with app.app_context():
        from models import User
        # Get the user that was registered by auth_client
        user = User.query.filter_by(email="tester@example.com").first()
        assert user is not None
        # Find book and UserBook link
        book = Book.query.filter_by(title="New Book").first()
        assert book is not None
        book_id = book.id
        # Verify UserBook link exists
        link = UserBook.query.filter_by(user_id=user.id, book_id=book_id).first()
        assert link is not None

    # Edit
    edit_resp = auth_client.post(
        f"/books/{book_id}/edit",
        data={"title": "Updated", "author": "Updated Author"},
        follow_redirects=True,
    )
    assert edit_resp.status_code == 200
    with app.app_context():
        refreshed = Book.query.get(book_id)
        assert refreshed.title == "Updated"

    # Delete (removes UserBook link, may or may not delete Book)
    delete_resp = auth_client.post(f"/books/{book_id}/delete", follow_redirects=True)
    assert delete_resp.status_code == 200
    with app.app_context():
        from models import User
        user = User.query.filter_by(email="tester@example.com").first()
        # Verify UserBook link is removed
        link = UserBook.query.filter_by(user_id=user.id, book_id=book_id).first()
        assert link is None


def test_my_library_requires_login(client):
    resp = client.get("/my")
    assert resp.status_code in {302, 401}


def test_my_library_lists_entries(auth_client, app):
    auth_client.post("/api/add_to_library", json={"title": "Library Book", "author": "Someone"})
    # /my redirects to /api/my.json, check the JSON endpoint directly
    resp = auth_client.get("/api/my.json")
    assert resp.status_code == 200
    assert resp.is_json
    data = resp.get_json()
    assert isinstance(data, list)
    # Check that the book appears in the library
    assert any(entry.get("book", {}).get("title") == "Library Book" for entry in data)


def test_export_json_and_csv(client, app):
    create_book(app, title="Export Book", author="Exporter")
    json_resp = client.get("/export.json")
    assert json_resp.status_code == 200
    assert json_resp.is_json
    csv_resp = client.get("/export.csv")
    assert csv_resp.status_code == 200
    assert "Export Book" in csv_resp.get_data(as_text=True)


def test_search_pages(client):
    # Both return JSON now (React frontend handles UI)
    resp = client.get("/search")
    assert resp.status_code == 200
    assert resp.is_json
    
    home_resp = client.get("/")
    assert home_resp.status_code == 200
    assert home_resp.is_json


def test_add_to_library_creates_book_and_link(auth_client, app):
    payload = {"title": "Deep Work", "author": "Cal Newport"}
    resp = auth_client.post("/api/add_to_library", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["ok"] is True
    book_id = data["book_id"]

    with app.app_context():
        book = Book.query.get(book_id)
        assert book.title == "Deep Work"
        link = UserBook.query.filter_by(book_id=book_id).first()
        assert link is not None
        assert link.status == "wishlist"


def test_add_to_library_requires_title_and_author(auth_client):
    resp = auth_client.post("/api/add_to_library", json={"title": "", "author": ""})
    assert resp.status_code == 400
    assert resp.get_json()["error"]


def test_api_search_uses_service(monkeypatch, client):
    fake_results = [{"title": "Book", "author": "Author", "isbn": "123"}]
    mocked = MagicMock(return_value=fake_results)
    monkeypatch.setattr("routes.books.search_books", mocked)

    resp = client.get("/api/search?q=test")
    assert resp.status_code == 200
    assert resp.get_json()["results"] == fake_results
    mocked.assert_called_once_with("test", limit=10)


