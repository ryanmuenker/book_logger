import argparse
import csv
import json
import os
from typing import Dict, Iterable, List, Optional, Tuple

from app import app  # use configured Flask app
from models import db, Book
from services.isbn import fetch_isbn_metadata


def infer_format_from_path(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext in {".csv"}:
        return "csv"
    if ext in {".json"}:
        return "json"
    raise ValueError(f"Cannot infer format from extension '{ext}'. Use --format.")


def normalize_record(rec: Dict[str, str]) -> Dict[str, Optional[str]]:
    # Accept various key casings; default to empty string if missing
    def g(*keys: str) -> Optional[str]:
        for k in keys:
            if k in rec and rec[k] is not None:
                return str(rec[k]).strip()
        return None

    rating_val = g("rating", "Rating")
    try:
        rating = int(rating_val) if rating_val not in (None, "", "None") else None
    except ValueError:
        rating = None

    return {
        "title": g("title", "Title") or "",
        "author": g("author", "Author") or "",
        "start_date": g("start_date", "Start Date", "startDate"),
        "finish_date": g("finish_date", "Finish Date", "finishDate"),
        "rating": rating,
        "tags": g("tags", "Tags") or "",
        "notes": g("notes", "Notes") or "",
        "isbn": g("isbn", "ISBN", "Isbn"),
    }


def read_csv(path: str) -> Iterable[Dict[str, Optional[str]]]:
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield normalize_record(row)


def read_json(path: str) -> Iterable[Dict[str, Optional[str]]]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        # support {"books": [...]} shape
        if "books" in data and isinstance(data["books"], list):
            data = data["books"]
        else:
            raise ValueError("JSON must be a list of book objects or contain a 'books' list.")
    if not isinstance(data, list):
        raise ValueError("JSON must be a list of book objects.")
    for item in data:
        if not isinstance(item, dict):
            continue
        yield normalize_record(item)


def load_existing_keyset() -> set:
    # de-dupe by (lower(title), lower(author))
    rows = db.session.query(Book.title, Book.author).all()
    return {(t.lower(), a.lower()) for (t, a) in rows}


def upsert_lookup_map() -> Dict[Tuple[str, str], Book]:
    rows = Book.query.all()
    return {(b.title.lower(), b.author.lower()): b for b in rows}


def import_books(
    source_path: str,
    fmt: str,
    batch_size: int,
    dedupe: bool,
    update_existing: bool,
    enrich_by_isbn: bool,
) -> Tuple[int, int, int]:
    if fmt == "auto":
        fmt = infer_format_from_path(source_path)

    if fmt == "csv":
        records = read_csv(source_path)
    elif fmt == "json":
        records = read_json(source_path)
    else:
        raise ValueError("Unsupported format. Use 'csv' or 'json'.")

    created = 0
    updated = 0
    skipped = 0

    existing_keys = load_existing_keyset() if dedupe else set()
    lookup = upsert_lookup_map() if update_existing else {}

    buffer: List[Book] = []

    for rec in records:
        title = rec["title"] or ""
        author = rec["author"] or ""
        if enrich_by_isbn and (not title or not author) and rec.get("isbn"):
            meta = fetch_isbn_metadata(rec["isbn"]) or {}
            if not title:
                title = (meta.get("title") or title or "").strip()
            if not author:
                author = (meta.get("author") or author or "").strip()
        if not title or not author:
            skipped += 1
            continue

        key = (title.lower(), author.lower())

        if update_existing and key in lookup:
            b = lookup[key]
            b.start_date = rec["start_date"]
            b.finish_date = rec["finish_date"]
            b.rating = rec["rating"]
            b.tags = rec["tags"] or ""
            b.notes = rec["notes"] or ""
            updated += 1
            continue

        if dedupe and key in existing_keys:
            skipped += 1
            continue

        b = Book(
            title=title,
            author=author,
            start_date=rec["start_date"],
            finish_date=rec["finish_date"],
            rating=rec["rating"],
            tags=rec["tags"] or "",
            notes=rec["notes"] or "",
        )
        buffer.append(b)

        if len(buffer) >= batch_size:
            db.session.add_all(buffer)
            db.session.commit()
            created += len(buffer)
            buffer.clear()

    if buffer:
        db.session.add_all(buffer)
        db.session.commit()
        created += len(buffer)

    if update_existing:
        db.session.commit()

    return created, updated, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description="Bulk import books into the SQLite database.")
    parser.add_argument("input", help="Path to input file (CSV or JSON)")
    parser.add_argument(
        "--format",
        dest="fmt",
        default="auto",
        choices=["auto", "csv", "json"],
        help="Input format (default: auto from extension)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Number of rows to insert per transaction (default: 500)",
    )
    parser.add_argument(
        "--dedupe",
        action="store_true",
        help="Skip rows that already exist (title+author match)",
    )
    parser.add_argument(
        "--update-existing",
        action="store_true",
        help="Update existing rows (title+author match) instead of creating duplicates",
    )
    parser.add_argument(
        "--enrich-by-isbn",
        action="store_true",
        help="When title/author missing and ISBN present, fetch metadata from Open Library",
    )

    args = parser.parse_args()

    with app.app_context():
        created, updated, skipped = import_books(
            source_path=args.input,
            fmt=args.fmt,
            batch_size=args.batch_size,
            dedupe=args.dedupe,
            update_existing=args.update_existing,
            enrich_by_isbn=args.enrich_by_isbn,
        )

        print(
            f"Import complete. created={created}, updated={updated}, skipped={skipped}"
        )


if __name__ == "__main__":
    main()


