from typing import Any
from unittest.mock import MagicMock

from services import isbn


def test_search_books_returns_empty_for_blank_query():
    assert isbn.search_books("") == []


def test_search_books_parses_success(monkeypatch):
    class DummyResp:
        status_code = 200

        def json(self) -> Any:
            return {
                "docs": [
                    {
                        "title": "Book Title",
                        "author_name": ["Author Name"],
                        "isbn": ["1234567890123"],
                        "cover_i": 42,
                    }
                ]
            }

    mock_get = MagicMock(return_value=DummyResp())
    monkeypatch.setattr("services.isbn.requests.get", mock_get)
    result = isbn.search_books("book")
    assert result == [
        {
            "title": "Book Title",
            "author": "Author Name",
            "isbn": "1234567890123",
            "cover_id": 42,
        }
    ]


def test_fetch_isbn_metadata_handles_network_errors(monkeypatch):
    mock_get = MagicMock(side_effect=Exception("network down"))
    monkeypatch.setattr("services.isbn.requests.get", mock_get)
    result = isbn.fetch_isbn_metadata("1234567890")
    assert result is None
    mock_get.assert_called_once()


def test_fetch_isbn_metadata_parses_response(monkeypatch):
    class DummyResp:
        status_code = 200

        def json(self) -> Any:
            return {
                "title": "Sample",
                "authors": [{"key": "/authors/OL1A"}],
            }

    class DummyAuthorResp:
        status_code = 200

        def json(self) -> Any:
            return {"name": "Author"}

    mock_get = MagicMock(side_effect=[DummyResp(), DummyAuthorResp()])
    monkeypatch.setattr("services.isbn.requests.get", mock_get)
    result = isbn.fetch_isbn_metadata("1234567890")
    assert result == {"title": "Sample", "author": "Author"}


