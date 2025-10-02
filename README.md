# Vocabulary Compendium / Book Logger

Flask + SQLite backend with a React (Vite + Tailwind + shadcn-style) frontend. Supports Books CRUD, per-book vocabulary compendium, and a basic Leitner flashcard review queue. User auth is handled via Flask session cookies and React login/register pages.

## Features
- Books: create, edit, delete, export JSON/CSV
- Search: OpenLibrary search with covers, add to your library
- My Library: per-user list with covers (ISBN or OpenLibrary cover_id)
- Vocab Compendium: add words with definition and quote, linked to books
- Flashcards: simple Leitner queue with next-review scheduling
- Auth: register, login, logout using JSON API

## Run locally
Backend (Flask):
1. Create venv and install deps
   - `python -m venv venv`
   - `source venv/bin/activate`
   - `pip install -r requirements.txt`
2. Run the app
   - `python app.py`
   - Health: `http://127.0.0.1:5000/health`

Frontend (Vite React):
1. In `frontend/`:
   - `npm install`
   - `npm run dev`
2. Open the Vite URL (e.g., `http://localhost:5173`)

Notes:
- The Vite dev server proxies API requests to Flask (see `frontend/vite.config.ts`).
- On first run, tables are auto-created; lightweight migrations add missing columns.

## Key endpoints
- Books
  - `GET /export.json` (includes `cover_id`)
  - `GET /export.csv`
  - `POST /api/add_to_library` { isbn?, title, author, cover_id? }
  - `POST /api/backfill_covers` (logged-in) — fills `cover_id` using title+author
- Search
  - `GET /api/search?q=...` → returns title, author, isbn, cover_id
- My Library
  - `GET /api/my.json` (logged-in)
- Auth (JSON)
  - `GET /auth/me`
  - `POST /auth/login` { email, password }
  - `POST /auth/register` { email, password }
  - `POST /auth/logout`

## Frontend routes
- `/` Books list (search + tag filter, covers, edit/delete)
- `/books/new` create book (posts to Flask form endpoints)
- `/books/:id` book detail + compendium
- `/books/:id/edit` edit book
- `/search` OpenLibrary search + Add to library
- `/my` your library (covers)
- `/login`, `/register`

## Testing
- Placeholder tests in `tests/` — expand with unit tests for CRUD and SRS logic.

## Deployment
- Ensure environment variables and production server (e.g., gunicorn) for Flask.
- Build frontend with `npm run build` and serve statics via your platform of choice.

## Data model (SQLAlchemy)
- `Book`: id, title, author, isbn, cover_id, start_date, finish_date, rating, tags, notes
- `User`: id, email, password_hash
- `UserBook`: user_id, book_id, status, rating, dates, tags, notes
- `VocabEntry`: user_id, book_id, word, definition, quote, srs_box, next_review_at

## Tips
- If covers aren’t showing for older books, run `POST /api/backfill_covers` while logged in, then refresh `/my`.
