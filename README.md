# Vocabulary Compendium / Book Logger

A comprehensive book tracking and vocabulary learning application built with Flask + PostgreSQL backend and React frontend (Vite + Tailwind + shadcn/ui). Features a full vocabulary flashcard system with spaced repetition, Goodreads import, and automatic definition fetching. Deployed to Azure Container Apps with automated CI/CD via GitHub Actions.

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
- **PostgreSQL** - Production database (Azure Database for PostgreSQL)
- **SQLite** - Development database (fallback for local development)
- **psycopg2-binary** - PostgreSQL database driver
- **Requests** - HTTP client for external APIs
- **Gunicorn** - Production WSGI server

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

## Database

### Production: PostgreSQL
The application uses **PostgreSQL** for production deployments on Azure. The database is automatically created using SQLAlchemy's `db.create_all()` method.

**Connection**: Configured via `DATABASE_URL` environment variable in Azure Container Apps.

### Development: SQLite
For local development, the application automatically falls back to **SQLite** if `DATABASE_URL` is not set. This allows developers to work without a database server.

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

### Backend Tests
Run the test suite with coverage:
```bash
# Activate virtual environment
source venv/bin/activate

# Run tests with coverage
pytest --cov --cov-report=term --cov-report=html

# View coverage report
# Open htmlcov/index.html in your browser
```

**Coverage Target**: Minimum 70% code coverage (currently ~85%)

### Test Structure
- `tests/test_auth.py` - Authentication routes (login, register, logout)
- `tests/test_books.py` - Book CRUD, search, exports, my library
- `tests/test_vocab.py` - Vocabulary CRUD, review system, compendium
- `tests/test_services.py` - External API services
- `tests/test_app.py` - Health endpoint
- `tests/test_import_books.py` - Goodreads import functionality

## Deployment

### Docker Deployment

#### Build and Run with Docker Compose
```bash
# Build and start all services (includes Prometheus & Grafana)
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services included:**
- Backend (Flask) on port 5001
- Frontend (React/Nginx) on port 80
- Prometheus (monitoring) on port 9090
- Grafana (dashboards) on port 3000

The application will be available at:
- Frontend: `http://localhost`
- Backend API: `http://localhost:5001`
- Health check: `http://localhost:5001/health`
- Metrics: `http://localhost:5001/metrics`
- Prometheus: `http://localhost:9090` (included in docker-compose)
- Grafana: `http://localhost:3000` (included in docker-compose, admin/admin)

#### Build Individual Images
```bash
# Backend
docker build -t book-logger-backend .

# Frontend
docker build -t book-logger-frontend -f frontend/Dockerfile ./frontend
```

### Azure Deployment

#### Prerequisites
1. Azure Resource Group created
2. Azure Container Registry (ACR) created
3. Azure Container App or Web App for Containers created
4. GitHub Secrets configured (see below)

#### Required GitHub Secrets
Configure these secrets in your GitHub repository settings:

- `AZURE_ACR_LOGIN_SERVER` - ACR login server (e.g., `myregistry.azurecr.io`)
- `AZURE_ACR_USERNAME` - ACR username
- `AZURE_ACR_PASSWORD` - ACR password
- `AZURE_ACR_NAME` - ACR name
- `AZURE_CONTAINER_APP_NAME` - Container App name
- `AZURE_RESOURCE_GROUP` - Resource group name
- `AZURE_CREDENTIALS` - Azure service principal JSON (for deployment)

#### Deployment Process
1. **Automatic Deployment via GitHub Actions**: Pushes to `main` branch automatically trigger:
   - Backend tests with coverage check (must be ≥70%)
   - Frontend build verification
   - Docker image build and push to ACR
   - Deployment to Azure Container Apps (both backend and frontend)

2. **Manual Deployment**:
   ```bash
   # Login to Azure
   az login
   
   # Login to ACR
   az acr login --name <acr-name>
   
   # Build and push images
   docker build -t <acr-name>.azurecr.io/book-logger-backend:latest .
   docker push <acr-name>.azurecr.io/book-logger-backend:latest
   
   docker build -t <acr-name>.azurecr.io/book-logger-frontend:latest -f frontend/Dockerfile ./frontend
   docker push <acr-name>.azurecr.io/book-logger-frontend:latest
   ```

#### Environment Variables

**Backend Container App**:
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user:password@host:5432/database?sslmode=require`)
  - **Production**: Set to Azure PostgreSQL connection string
  - **Local Development**: Omit to use SQLite
- `SECRET_KEY` - Flask secret key for session management (stored as Container App secret)

**Connection String Format**:
```
postgresql://booklogger:password@book-logger-db-ryan.postgres.database.azure.com:5432/booklogger?sslmode=require
```

#### Database Setup

**Azure PostgreSQL Flexible Server**:
- Database server: `book-logger-db-ryan.postgres.database.azure.com`
- Database name: `booklogger`
- Port: 5432
- SSL: Required (automatically handled via connection string)

**Firewall Rules**:
- Allow Azure services to access the database (configured during setup)
- Can be further restricted for security

**Local Development**:
- Uses SQLite if `DATABASE_URL` is not set
- Database file: `app.sqlite3` in project root

### CI/CD Pipeline

**Location**: `.github/workflows/ci.yml`

The GitHub Actions workflow provides fully automated CI/CD with the following stages:

#### Pipeline Overview

**Trigger**: Runs on every push and pull request to `main` branch

**Jobs**:
1. **Backend Testing** (runs on all commits)
   - Sets up Python 3.11 environment
   - Installs dependencies from `requirements.txt`
   - Runs pytest with coverage analysis
   - **Enforces 70% minimum coverage** - pipeline fails if below threshold
   - Uploads coverage reports as artifacts

2. **Frontend Build** (runs after backend tests pass)
   - Sets up Node.js 18 environment
   - Installs npm dependencies with `npm ci`
   - Runs production build to verify compilation
   - Ensures frontend is ready for deployment

3. **Build and Deploy** (only on `main` branch pushes)
   - Builds Docker images for both backend and frontend
   - Builds for `linux/amd64` platform (required for Azure)
   - Tags images with both commit SHA and `latest`
   - Pushes images to Azure Container Registry (ACR)
   - Deploys backend Container App with new image
   - Creates or updates frontend Container App
   - Configures external ingress for both apps

#### Key Pipeline Features

- ✅ **Automated Testing**: Every commit is tested before deployment
- ✅ **Coverage Enforcement**: Hard failure if coverage drops below 70%
- ✅ **Parallel Execution**: Backend and frontend jobs can run simultaneously
- ✅ **Branch Protection**: Only `main` branch triggers deployments
- ✅ **Image Tagging**: SHA-based tags enable easy rollback
- ✅ **Idempotent Deployment**: Handles both new and existing Container Apps
- ✅ **Secure Secrets**: All sensitive data stored in GitHub Secrets

#### Required GitHub Secrets

Configure these in your repository settings (Settings → Secrets and variables → Actions):

- `AZURE_ACR_LOGIN_SERVER` - Full ACR URL (e.g., `myregistry.azurecr.io`)
- `AZURE_ACR_USERNAME` - ACR admin username
- `AZURE_ACR_PASSWORD` - ACR admin password
- `AZURE_ACR_NAME` - ACR registry name (without `.azurecr.io`)
- `AZURE_CONTAINER_APP_NAME` - Backend Container App name (e.g., `book-logger-backend`)
- `AZURE_RESOURCE_GROUP` - Azure resource group name
- `AZURE_CREDENTIALS` - Azure service principal JSON (for authentication)

#### Pipeline Flow

```
┌─────────────────┐
│ Push to main    │
└────────┬────────┘
         │
         ├─→ Backend Tests (pytest, coverage ≥70%)
         │
         ├─→ Frontend Build (npm build)
         │
         └─→ Build & Deploy (main branch only)
              ├─→ Build Docker images
              ├─→ Push to ACR
              ├─→ Deploy Backend
              └─→ Deploy Frontend
```

## Monitoring

### Health Check
- **Endpoint**: `GET /health`
- **Response**: `{"status": "ok"}`
- Used by container orchestrators and load balancers

### Metrics (Prometheus)
- **Endpoint**: `GET /metrics`
- **Metrics Exposed**:
  - `http_request_duration_seconds` - Request latency
  - `http_request_total` - Request count by method and status
  - `flask_http_request_duration_seconds` - Detailed request timing
  - `flask_exceptions_total` - Error count by exception type

### Prometheus Setup

**Option 1: Using Docker Compose (Recommended for Local Development)**
Prometheus and Grafana are automatically included when running `docker-compose up`. No additional setup required.

**Option 2: Standalone Prometheus**
```bash
# Using Docker
docker run -d -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

**Access Prometheus UI**: `http://localhost:9090`

**Example Queries**:
- Request rate: `rate(http_request_total[5m])`
- Error rate: `rate(http_request_total{status=~"5.."}[5m])`
- Average latency: `rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])`

### Grafana (Optional)
**Using Docker Compose**: Grafana is automatically available at `http://localhost:3000` (admin/admin). Import Prometheus as a data source and create dashboards for:
- Request rate and latency
- Error rates
- Health check status

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
