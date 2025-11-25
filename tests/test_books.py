from unittest.mock import MagicMock

from models import Book, UserBook, db


def create_book(app, **kwargs):
    data = {"title": "Sample", "author": "Author", **kwargs}
    with app.app_context():
        book = Book(**data)
        db.session.add(book)
        db.session.commit()
        return book.id


def test_books_list_renders_books(client, app):
    book_id = create_book(app, title="Book One")
    resp = client.get("/books")
    assert resp.status_code == 200
    assert "Book One" in resp.get_data(as_text=True)
    detail_resp = client.get(f"/books/{book_id}")
    assert detail_resp.status_code == 200
    assert "Book One" in detail_resp.get_data(as_text=True)


def test_books_create_edit_delete_flow(client, app):
    # Create
    create_resp = client.post(
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
        book = Book.query.filter_by(title="New Book").first()
        assert book is not None
        book_id = book.id

    # Edit
    edit_resp = client.post(
        f"/books/{book_id}/edit",
        data={"title": "Updated", "author": "Updated Author"},
        follow_redirects=True,
    )
    assert edit_resp.status_code == 200
    with app.app_context():
        refreshed = Book.query.get(book_id)
        assert refreshed.title == "Updated"

    # Delete
    delete_resp = client.post(f"/books/{book_id}/delete", follow_redirects=True)
    assert delete_resp.status_code == 200
    with app.app_context():
        assert Book.query.get(book_id) is None


def test_my_library_requires_login(client):
    resp = client.get("/my")
    assert resp.status_code in {302, 401}


def test_my_library_lists_entries(auth_client, app):
    auth_client.post("/api/add_to_library", json={"title": "Library Book", "author": "Someone"})
    resp = auth_client.get("/my")
    assert resp.status_code == 200
    assert "Library Book" in resp.get_data(as_text=True)


def test_export_json_and_csv(client, app):
    create_book(app, title="Export Book", author="Exporter")
    json_resp = client.get("/export.json")
    assert json_resp.status_code == 200
    assert json_resp.is_json
    csv_resp = client.get("/export.csv")
    assert csv_resp.status_code == 200
    assert "Export Book" in csv_resp.get_data(as_text=True)


def test_search_pages(client):
    assert client.get("/search").status_code == 200
    assert client.get("/").status_code == 302  # redirect to /books


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


