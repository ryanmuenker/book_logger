# Vocabulary Compendium / Book Logger

A comprehensive book tracking and vocabulary learning application built with Flask + SQLite backend and React frontend (Vite + Tailwind + shadcn/ui). Features a full vocabulary flashcard system with spaced repetition, Goodreads import, and automatic definition fetching.

## Features

### 📚 Book Management
- **Books CRUD**: Create, edit, delete, and organize your book collection
- **Search Integration**: OpenLibrary search with automatic cover fetching
- **My Library**: Personal book collection with covers (ISBN or OpenLibrary cover_id)
- **Export Options**: Export your library as JSON or CSV
- **Book Covers**: Automatic cover fetching and display

### 📖 Vocabulary System
- **Vocabulary Compendium**: Per-book vocabulary with definitions and quotes
- **Automatic Definitions**: Auto-fetch definitions when adding new words
- **CRUD Operations**: Add, edit, and delete vocabulary entries
- **Quote Integration**: Link vocabulary to specific book quotes

### 🧠 Flashcard System (Spaced Repetition)
- **Leitner Algorithm**: Advanced spaced repetition for effective learning
- **Review Queue**: Smart scheduling based on difficulty and performance
- **Difficulty Levels**: Again, Good, Easy responses for personalized learning
- **Anki-style Deck Browser**: View all cards with filtering by book
- **Progress Tracking**: Visual progress indicators and statistics
- **Book Filtering**: Review vocabulary by specific books

### 📥 Import & Integration
- **Goodreads Import**: Import your Goodreads library via CSV
- **ISBN Editing**: Add or edit ISBNs during import for better covers
- **Duplicate Detection**: Smart handling of existing books during import
- **Preview Interface**: Review and modify books before importing

### 🔐 Authentication
- **User Registration & Login**: Secure authentication system
- **Session Management**: Flask session cookies with React integration
- **Personal Libraries**: Each user has their own books and vocabulary

### 🎨 Modern UI
- **React SPA**: Single Page Application with React Router
- **shadcn/ui Components**: Beautiful, accessible UI components
- **Tailwind CSS**: Modern, responsive design
- **Error Handling**: Comprehensive error boundaries and user feedback

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup (Flask)
1. **Create virtual environment and install dependencies**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Run the Flask server**
   ```bash
   python app.py
   ```
   - Server runs on: `http://127.0.0.1:5000`
   - Health check: `http://127.0.0.1:5000/health`

### Frontend Setup (React)
1. **Navigate to frontend directory and install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```
   - Frontend runs on: `http://localhost:5173` (or next available port)
   - The Vite dev server automatically proxies API requests to Flask

### First Run
- Database tables are automatically created on first run
- Lightweight migrations ensure all required columns exist
- Register a new account to start using the application

### Development Notes
- The Vite dev server proxies API requests to Flask (see `frontend/vite.config.ts`)
- Hot reloading is enabled for both frontend and backend
- API endpoints are documented below

## API Endpoints

### 📚 Books
- `GET /export.json` - Export all books as JSON (includes `cover_id`)
- `GET /export.csv` - Export all books as CSV
- `POST /api/add_to_library` - Add book to library `{ isbn?, title, author, cover_id? }`
- `POST /api/backfill_covers` - Fill missing cover IDs using title+author (logged-in)
- `GET /api/my.json` - Get user's personal library (logged-in)

### 🔍 Search
- `GET /api/search?q=...` - Search OpenLibrary for books
  - Returns: `{ title, author, isbn, cover_id }`

### 📖 Vocabulary
- `GET /vocab/book/<book_id>?format=json` - Get vocabulary for specific book
- `POST /vocab/api` - Create new vocabulary entry
  - Body: `{ book_id, word, definition, quote }`
- `PATCH /vocab/api/<id>` - Update vocabulary entry
- `DELETE /vocab/api/<id>` - Delete vocabulary entry
- `GET /vocab/review/queue?format=json` - Get review queue (logged-in)
- `GET /vocab/review/books` - Get books with vocabulary for review
- `POST /vocab/review/<entry_id>/answer` - Submit flashcard answer
  - Body: `{ difficulty: "again" | "good" | "easy" }`

### 📥 Import
- `POST /api/import/goodreads` - Import Goodreads CSV
  - Body: CSV file upload
  - Returns: Preview of books to import with ISBN editing options

### 🔐 Authentication
- `GET /auth/me` - Get current user info
- `POST /auth/login` - Login `{ email, password }`
- `POST /auth/register` - Register `{ email, password }`
- `POST /auth/logout` - Logout

## Frontend Routes

### 📚 Book Management
- `/` - Books list with search, tag filtering, covers, edit/delete
- `/books/new` - Create new book
- `/books/:id` - Book detail with vocabulary compendium
- `/books/:id/edit` - Edit book information
- `/search` - OpenLibrary search with add to library
- `/my` - Personal library with covers

### 📖 Vocabulary & Learning
- `/review` - Flashcard review system with book filtering
- `/compendium/:bookId` - Vocabulary management for specific book

### 📥 Import & Export
- `/import/goodreads` - Import Goodreads CSV with ISBN editing

### 🔐 Authentication
- `/login` - User login
- `/register` - User registration

## Technology Stack

### Backend
- **Flask 3.0.3** - Web framework
- **SQLAlchemy 3.1.1** - ORM and database management
- **Flask-Login 0.6.3** - User authentication
- **SQLite** - Database
- **Requests** - HTTP client for external APIs

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable UI components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Axios** - HTTP client

### External APIs
- **OpenLibrary API** - Book search and cover images
- **Free Dictionary API** - Automatic definition fetching

## Database Schema (SQLAlchemy)

### Core Models
- **`Book`**: `id`, `title`, `author`, `isbn`, `cover_id`, `start_date`, `finish_date`, `rating`, `tags`, `notes`
- **`User`**: `id`, `email`, `password_hash`
- **`UserBook`**: `user_id`, `book_id`, `status`, `rating`, `dates`, `tags`, `notes`
- **`VocabEntry`**: `user_id`, `book_id`, `word`, `definition`, `quote`, `srs_box`, `next_review_at`

### Spaced Repetition System
- **`srs_box`**: Leitner system box (1-5, higher = mastered)
- **`next_review_at`**: Timestamp for next review
- **Review intervals**: 1 day → 3 days → 1 week → 2 weeks → 1 month

## Testing
- Placeholder tests in `tests/` directory
- Expand with unit tests for:
  - CRUD operations
  - Spaced repetition logic
  - API endpoints
  - Frontend components

## Deployment

### Backend
- Use production WSGI server (e.g., gunicorn)
- Set up environment variables for production
- Configure database for production use

### Frontend
- Build for production: `npm run build`
- Serve static files via your platform of choice
- Configure proxy for API requests

## Tips & Troubleshooting

### Book Covers
- If covers aren't showing for older books, run `POST /api/backfill_covers` while logged in
- Refresh `/my` page after running backfill

### Development
- Use `npm run dev` for hot reloading in frontend
- Flask debug mode is enabled by default
- Check browser console for frontend errors
- Check Flask logs for backend errors

### Performance
- Vocabulary review queue is optimized for large datasets
- Book filtering uses client-side filtering for better UX
- API responses are paginated where appropriate
