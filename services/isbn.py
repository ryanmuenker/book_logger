import requests
from typing import Dict, Optional, List


def fetch_isbn_metadata(isbn: str, timeout_seconds: float = 5.0) -> Optional[Dict[str, str]]:
    """
    Fetch minimal metadata for a book by ISBN using Open Library.

    Returns a dict with possible keys: title, author.
    """
    if not isbn:
        return None
    normalized = isbn.replace("-", "").strip()
    if not normalized:
        return None

    # Open Library API: https://openlibrary.org/isbn/{ISBN}.json
    url = f"https://openlibrary.org/isbn/{normalized}.json"
    try:
        resp = requests.get(url, timeout=timeout_seconds)
        if resp.status_code != 200:
            return None
        data = resp.json()
    except Exception:
        return None

    title = data.get("title") or None

    author = None
    # Attempt to resolve first author name via /authors/{key}.json if present
    authors = data.get("authors") or []
    if isinstance(authors, list) and authors:
        first = authors[0]
        key = first.get("key") if isinstance(first, dict) else None
        if key:
            try:
                a_resp = requests.get(f"https://openlibrary.org{key}.json", timeout=timeout_seconds)
                if a_resp.status_code == 200:
                    a_data = a_resp.json()
                    author = a_data.get("name") or None
            except Exception:
                pass

    result: Dict[str, str] = {}
    if title:
        result["title"] = title
    if author:
        result["author"] = author
    return result or None


def search_books(query: str, limit: int = 10, timeout_seconds: float = 5.0) -> List[Dict[str, str]]:
    """
    Search Open Library for books. Returns a list of dicts with
    keys: title, author, isbn (preferred ISBN13 when available).
    """
    q = (query or "").strip()
    if not q:
        return []
    try:
        resp = requests.get(
            "https://openlibrary.org/search.json",
            params={"q": q, "limit": limit},
            timeout=timeout_seconds,
        )
        if resp.status_code != 200:
            return []
        data = resp.json() or {}
        docs = data.get("docs") or []
    except Exception:
        return []

    results: List[Dict[str, str]] = []
    for d in docs:
        title = d.get("title") or d.get("title_suggest") or ""
        authors = d.get("author_name") or []
        author = authors[0] if isinstance(authors, list) and authors else ""
        isbns = d.get("isbn") or []
        isbn = ""
        if isinstance(isbns, list) and isbns:
            # Prefer 13-digit if present
            isbn13 = next((x for x in isbns if len(x.replace("-", "")) == 13), None)
            isbn = isbn13 or isbns[0]
        cover_id = d.get('cover_i')
        results.append({"title": title, "author": author, "isbn": isbn, "cover_id": cover_id})
    return results


