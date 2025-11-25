from models import Book, VocabEntry, db


def create_book(app, title="Test Book", author="Anon"):
    with app.app_context():
        book = Book(title=title, author=author)
        db.session.add(book)
        db.session.commit()
        return book.id


def test_create_vocab_entry_and_queue(auth_client, app):
    book_id = create_book(app)
    payload = {
        "book_id": book_id,
        "word": "ephemeral",
        "definition": "lasting a short time",
        "quote": "An ephemeral moment.",
    }

    resp = auth_client.post("/vocab/api", json=payload)
    assert resp.status_code == 200
    entry_id = resp.get_json()["id"]

    with app.app_context():
        entry = VocabEntry.query.get(entry_id)
        assert entry.word == "ephemeral"
        assert entry.next_review_at is None
        assert entry.srs_box == 1

    queue_resp = auth_client.get("/vocab/review/queue?format=json")
    queue = queue_resp.get_json()["entries"]
    assert len(queue) == 1
    assert queue[0]["word"] == "ephemeral"
    assert queue[0]["book_id"] == book_id

    books_resp = auth_client.get("/vocab/review/books")
    books = books_resp.get_json()["books"]
    assert len(books) == 1
    assert books[0]["title"] == "Test Book"


def test_review_queue_filters_by_book(auth_client, app):
    first_book = create_book(app, title="Book A")
    second_book = create_book(app, title="Book B")

    auth_client.post("/vocab/api", json={"book_id": first_book, "word": "alpha"})
    auth_client.post("/vocab/api", json={"book_id": second_book, "word": "beta"})

    resp = auth_client.get(f"/vocab/review/queue?format=json&book_id={first_book}")
    entries = resp.get_json()["entries"]
    assert len(entries) == 1
    assert entries[0]["word"] == "alpha"


def test_vocab_api_requires_login(client, app):
    book_id = create_book(app)
    resp = client.post("/vocab/api", json={"book_id": book_id, "word": "solo"})
    # login_required returns redirect to login page for anonymous users
    assert resp.status_code in {302, 401}


def test_vocab_update_and_delete(auth_client, app):
    book_id = create_book(app)
    create_resp = auth_client.post("/vocab/api", json={"book_id": book_id, "word": "gamma"})
    entry_id = create_resp.get_json()["id"]

    update_resp = auth_client.patch(
        f"/vocab/api/{entry_id}",
        json={"definition": "updated definition", "quote": "updated quote"},
    )
    assert update_resp.status_code == 200
    with app.app_context():
        entry = VocabEntry.query.get(entry_id)
        assert entry.definition == "updated definition"

    delete_resp = auth_client.delete(f"/vocab/api/{entry_id}")
    assert delete_resp.status_code == 200
    with app.app_context():
        assert VocabEntry.query.get(entry_id) is None


def test_vocabulary_page_template(auth_client, app):
    book_id = create_book(app, title="Rendered Book")
    auth_client.post("/vocab/api", json={"book_id": book_id, "word": "delta"})
    resp = auth_client.get(f"/vocab/book/{book_id}")
    assert resp.status_code == 200
    assert "Rendered Book" in resp.get_data(as_text=True)


def test_submit_answer_progresses_boxes(auth_client, app):
    book_id = create_book(app)
    create_resp = auth_client.post("/vocab/api", json={"book_id": book_id, "word": "theta"})
    entry_id = create_resp.get_json()["id"]

    resp_correct = auth_client.post(
        f"/vocab/review/{entry_id}/answer",
        data={"result": "correct"},
        follow_redirects=True,
    )
    assert resp_correct.status_code == 200
    with app.app_context():
        entry = VocabEntry.query.get(entry_id)
        assert entry.srs_box == 2
        assert entry.next_review_at is not None



