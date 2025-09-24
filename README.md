<<<<<<< HEAD
# book_logger
storing read books and their vocab
=======

# Book Logger MVP (Flask + SQLite)

A super-fast scaffold to satisfy your fallback scope: CRUD for Books with a clean Bootstrap UI.

## Quickstart

```bash
python -m venv venv
source venv/bin/activate  # on Windows: venv\Scripts\activate
pip install -r requirements.txt
export FLASK_APP=app.py  # Windows: set FLASK_APP=app.py
flask run
```

Open http://127.0.0.1:5000

## What you get
- Flask app with Jinja templates (Bootstrap 5 CDN)
- SQLite via SQLAlchemy
- Book CRUD: list/search (client-side), add, edit, delete
- Minimal tests placeholder in `tests/`

## Next Steps
- Add CSV export endpoint
- Add server-side search / filters
- Optional: add vocab routes & models reusing the same patterns
```
>>>>>>> fe4d3b5 (Initial commit: Flask book logger MVP)
