# Assignment 2: DevOps Improvements Report

## Executive Summary

This report documents the improvements made to the Book Logger application for Assignment 2, focusing on code quality, testing, CI/CD automation, containerization, database migration, and monitoring. The application now has comprehensive test coverage (85% backend), fully automated GitHub Actions CI/CD pipeline, Docker containerization, PostgreSQL database for production, and production-ready monitoring capabilities. All deployments to Azure Container Apps are automated via GitHub Actions when code is pushed to the `main` branch.

## 1. Code Quality and Refactoring

### Improvements Made

#### SOLID Principles
- **Single Responsibility**: Separated concerns into distinct modules:
  - `routes/` - Route handlers
  - `services/` - Business logic (ISBN lookup, dictionary API)
  - `models.py` - Database models
  - `app.py` - Application initialization

#### Code Smell Removal
- **Removed Duplication**: Consolidated authentication logic into reusable functions
- **Eliminated Hardcoded Values**: Moved configuration to `config.py` with environment variable support
- **Long Methods**: Refactored complex functions into smaller, focused functions
- **Magic Numbers**: Replaced with named constants (e.g., SRS box intervals)

#### Code Organization
- Clear separation between frontend and backend
- Consistent naming conventions
- Proper error handling throughout
- Type hints where applicable

## 2. Testing and Coverage

### Backend Testing

**Coverage Achieved**: 85% (exceeds 70% requirement)

#### Test Suite Structure
- **`tests/test_auth.py`**: Authentication flows (login, register, logout, JSON endpoints)
- **`tests/test_books.py`**: Complete book CRUD, search, exports, my library
- **`tests/test_vocab.py`**: Vocabulary management, review system, compendium
- **`tests/test_services.py`**: External API integrations
- **`tests/test_app.py`**: Health endpoint
- **`tests/test_import_books.py`**: Goodreads import functionality

#### Test Infrastructure
- **pytest** with pytest-cov for coverage reporting
- **Shared fixtures** in `tests/conftest.py`:
  - Flask test client
  - Database setup/teardown
  - Authenticated user sessions
- **Test templates** to avoid TemplateNotFound errors
- **Coverage reports**: Terminal and HTML output

#### Key Test Scenarios
- User registration and authentication
- Book CRUD operations with validation
- Vocabulary entry management
- Spaced repetition review logic
- External API error handling
- Health check endpoint

### Frontend Testing

**Status**: Limited due to resource constraints

- Basic test infrastructure in place (Vitest, Testing Library)
- Component tests for UI components (Button, Badge, Error, Loading)
- Service tests for dictionary API
- Performance issues encountered with full test suite execution

## 3. Continuous Integration (CI)

### GitHub Actions Pipeline

**Location**: `.github/workflows/ci.yml`

#### Pipeline Architecture

The CI/CD pipeline uses GitHub Actions to automate testing, building, and deployment to Azure Container Apps. The pipeline consists of three main jobs that run on every push to `main` and on pull requests.

#### Pipeline Stages

**1. Backend Testing Job**
- **Trigger**: Runs on all pushes and pull requests
- **Environment**: Ubuntu latest
- **Steps**:
  - Checkout repository code
  - Set up Python 3.11 with pip caching
  - Install Python dependencies from `requirements.txt`
  - Run pytest with coverage analysis
  - Enforce 70% minimum coverage threshold (fails pipeline if below)
  - Generate coverage reports (XML and terminal output)
  - Upload coverage artifacts for analysis
- **Outcome**: Pipeline fails if tests fail or coverage < 70%

**2. Frontend Build Job**
- **Trigger**: Runs after backend tests pass
- **Environment**: Ubuntu latest
- **Dependencies**: Waits for backend job to complete
- **Steps**:
  - Checkout repository code
  - Set up Node.js 18 with npm caching
  - Install npm dependencies with `npm ci`
  - Run production build with `npm run build`
  - Verifies frontend compiles successfully with no errors
- **Outcome**: Ensures frontend is production-ready

**3. Build and Deploy Job** (Main branch only)
- **Trigger**: Only runs on pushes to `main` branch after tests pass
- **Condition**: `github.ref == 'refs/heads/main' && github.event_name == 'push'`
- **Steps**:
  
  **Docker Image Building:**
  - Set up Docker Buildx for multi-platform builds
  - Login to Azure Container Registry (ACR)
  - Build backend Docker image for `linux/amd64` platform
  - Build frontend Docker image for `linux/amd64` platform
  - Tag images with both commit SHA and `latest` tag
  - Push all images to ACR
  
  **Azure Deployment:**
  - Authenticate to Azure using service principal credentials
  - Install Azure CLI in GitHub Actions runner
  - Configure ACR registry credentials for backend Container App
  - Update backend Container App with new image
  - Check if frontend Container App exists
  - Create or update frontend Container App with new image
  - Configure ingress for external access

#### Key Features
- **Branch Protection**: Only `main` branch triggers deployment
- **Coverage Enforcement**: Pipeline fails if coverage < 70% (hard requirement)
- **Artifact Storage**: Coverage reports saved for analysis
- **Parallel Execution**: Backend and frontend jobs run in parallel where possible
- **Image Tagging**: Both SHA-based and `latest` tags for easy rollback
- **Platform-Specific Builds**: All images built for `linux/amd64` for Azure compatibility
- **Automated Registry Setup**: Handles ACR authentication automatically
- **Idempotent Deployment**: Frontend Container App creation handles both new and existing apps

#### Pipeline Flow Diagram

```
Push to main
    ↓
┌─────────────────┐
│ Backend Tests   │ (Runs pytest, checks coverage ≥70%)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Frontend Build  │ (Verifies React app compiles)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Docker Build    │ (Builds both images for linux/amd64)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Push to ACR     │ (Tags with SHA and latest)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Deploy Backend  │ (Updates Container App)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Deploy Frontend │ (Creates or updates Container App)
└─────────────────┘
```

## 4. Deployment Automation (CD)

### Containerization

#### Backend Dockerfile
- **Base Image**: `python:3.11-slim`
- **Production Server**: Gunicorn with 2 workers
- **Optimizations**: Minimal dependencies, production-ready
- **Platform**: Built for `linux/amd64` for Azure compatibility
- **Health Check**: Built-in endpoint monitoring at `/health`

#### Frontend Dockerfile
- **Build Stage**: Node.js 18 Alpine (multi-stage build)
- **Production Stage**: Nginx Alpine for static file serving
- **Configuration**: Custom `nginx.conf` for API proxying to backend
- **Optimizations**: Minimal production image size (~50MB)
- **Platform**: Built for `linux/amd64` for Azure compatibility

#### Docker Compose (Local Development)
- **Service Orchestration**: Backend and frontend services
- **Health Checks**: Automatic container health monitoring
- **Volume Mounting**: SQLite database persistence for local dev
- **Prometheus & Grafana**: Local monitoring stack included

### Database Setup

#### Production Database: PostgreSQL
- **Azure Database for PostgreSQL Flexible Server**
- **Server**: `book-logger-db-ryan.postgres.database.azure.com`
- **Database**: `booklogger`
- **Version**: PostgreSQL 15
- **Connection**: SSL-required connection string
- **Firewall**: Configured to allow Azure Container Apps

#### Database Driver
- **psycopg2-binary**: PostgreSQL adapter for SQLAlchemy
- **Automatic Fallback**: Uses SQLite for local development if `DATABASE_URL` not set
- **Connection String Format**: `postgresql://user:password@host:5432/database?sslmode=require`

#### Migration Strategy
- **SQLAlchemy `db.create_all()`**: Creates all tables on startup
- **Note**: For production migrations, Alembic is recommended
- **Removed SQLite-specific code**: PRAGMA commands removed for PostgreSQL compatibility

### Azure Deployment

#### Infrastructure Components
- **Azure Container Registry (ACR)**: Private Docker image repository
- **Azure Container Apps**: Serverless container orchestration
- **Azure Container App Environment**: Managed environment for apps
- **Azure Database for PostgreSQL**: Managed PostgreSQL service
- **Resource Group**: `BCSAI2025-DEVOPS-STUDENTS-B` for resource organization

#### Deployment Process

**Automated via GitHub Actions**:
1. **Image Build**: Docker images built for `linux/amd64` platform
2. **Image Push**: Images pushed to ACR with SHA and `latest` tags
3. **Registry Configuration**: ACR credentials configured in Container Apps
4. **Backend Deployment**: Container App updated with new backend image
5. **Frontend Deployment**: Frontend Container App created or updated
6. **Ingress Configuration**: External HTTPS endpoints automatically configured

**Deployment Features**:
- **Zero-Downtime**: New revisions created before old ones are stopped
- **Rollback Capability**: Previous revisions can be reactivated
- **Health Checks**: Unhealthy revisions automatically disabled
- **Automatic Scaling**: Configured with min/max replica settings
- **Environment Variables**: Database URLs and secrets managed securely

#### Secrets Management
- **GitHub Secrets**: Store ACR credentials and Azure service principal
- **Container App Secrets**: Database connection strings stored securely
- **Secret References**: Environment variables reference secrets without exposing values
- **No Hardcoded Secrets**: All sensitive data externalized

#### Security
- **Secret Isolation**: No secrets in code, logs, or environment variables
- **Service Principal**: Azure authentication via OIDC credentials
- **ACR Authentication**: Secure image push/pull with credentials
- **SSL/TLS**: All database connections use SSL
- **HTTPS Only**: All Container Apps exposed via HTTPS
- **Network Isolation**: Container Apps in managed environment

#### Architecture Overview

**Frontend (React SPA)**:
- Served by Nginx on port 80
- All routes handled client-side by React Router
- API requests proxied to backend via Nginx
- Nginx configuration (`frontend/nginx.conf`) handles:
  - Serving static React build files
  - Proxying `/api/*` requests to backend
  - Proxying `/auth/*`, `/vocab/*`, `/books/*` to backend
  - Cookie rewriting for cross-domain authentication
  - SSL termination and forwarding

**Backend (Flask API)**:
- Runs on port 5000 with Gunicorn (2 workers)
- Provides JSON API endpoints (no HTML template rendering)
- Connected to PostgreSQL database
- CORS headers configured for frontend domain
- Session cookies work across frontend/backend domains

**Communication Flow**:
```
User Browser
    ↓
Frontend Container App (Nginx)
    ↓ (proxies API requests)
Backend Container App (Flask)
    ↓ (queries)
PostgreSQL Database
```

#### Current Deployment URLs
- **Backend**: `https://book-logger-backend.greendune-dcdd87fc.westeurope.azurecontainerapps.io`
- **Frontend**: `https://book-logger-frontend.greendune-dcdd87fc.westeurope.azurecontainerapps.io`

## 5. Monitoring and Health Checks

### Health Endpoint

**Endpoint**: `GET /health`

**Response**:
```json
{"status": "ok"}
```

**Usage**:
- Container orchestrator health checks
- Load balancer health monitoring
- Automated deployment verification

### Metrics (Prometheus)

**Library**: `prometheus-flask-exporter`

**Endpoint**: `GET /metrics`

**Metrics Exposed**:
1. **Request Count**: `http_request_total`
   - Labels: method, status, endpoint
   - Tracks total HTTP requests

2. **Request Latency**: `http_request_duration_seconds`
   - Histogram of request durations
   - Tracks P50, P95, P99 percentiles

3. **Error Count**: `flask_exceptions_total`
   - Labels: exception type
   - Tracks application errors

4. **Custom Metrics**: `app_info`
   - Application version and metadata

### Prometheus Configuration

**File**: `prometheus.yml`

- Scrape interval: 15 seconds
- Target: `localhost:5000/metrics`
- Ready for production Prometheus server

### Monitoring Dashboard (Optional)

**Grafana Integration**:
- Import Prometheus as data source
- Create dashboards for:
  - Request rate trends
  - Error rate monitoring
  - Latency percentiles
  - Health check status

## 6. Documentation

### README.md Updates

**Added Sections**:
- Comprehensive testing instructions
- Docker deployment guide
- Azure deployment setup
- Monitoring and metrics documentation
- CI/CD pipeline explanation
- Environment variable configuration

### Code Documentation
- Inline comments for complex logic
- Docstrings for key functions
- Configuration file documentation

## 7. Challenges and Solutions

### Challenge 1: Frontend Testing Performance
**Issue**: Full frontend test suite caused system resource exhaustion

**Solution**: 
- Scaled back frontend testing to essential components
- Focused on backend coverage (85% achieved)
- Maintained test infrastructure for future expansion

### Challenge 2: Template Errors in Tests
**Issue**: Backend tests failed with `TemplateNotFound` errors

**Solution**: 
- Created stub templates in `tests/templates/`
- Configured Flask to use test-specific template directory

### Challenge 3: Coverage Threshold Enforcement
**Issue**: Ensuring CI pipeline fails if coverage drops below 70%

**Solution**: 
- Added `--cov-fail-under=70` to pytest command
- Implemented additional coverage check step in CI

## 8. Future Improvements

### Potential Enhancements
1. **Database Migration System**: Alembic for proper schema versioning
2. **Frontend Testing**: Optimize test suite for better performance
3. **Integration Tests**: End-to-end testing with Playwright or Cypress
4. **Performance Testing**: Load testing with Locust or k6
5. **Security Scanning**: Add Snyk or Dependabot for vulnerability scanning
6. **Multi-Environment**: Staging and production environment separation
7. **Logging**: Structured logging with ELK stack or Azure Monitor
8. **Alerting**: Prometheus Alertmanager for critical metrics

## 9. Conclusion

The Book Logger application has been successfully enhanced with modern DevOps practices:

✅ **Code Quality**: Refactored following SOLID principles, removed code smells  
✅ **Testing**: 85% backend coverage with comprehensive test suite  
✅ **CI/CD**: Fully automated GitHub Actions pipeline with coverage enforcement  
✅ **Containerization**: Docker images for both backend and frontend (linux/amd64)  
✅ **Database**: PostgreSQL for production with SQLite fallback for development  
✅ **Deployment**: Automated Azure Container Apps deployment via GitHub Actions  
✅ **Monitoring**: Health checks and Prometheus metrics integration  
✅ **Architecture**: React SPA frontend with Flask JSON API backend  
✅ **Documentation**: Comprehensive deployment and usage guides  

The application is now production-ready with automated testing, deployment, and monitoring capabilities. The CI/CD pipeline ensures code quality through automated testing and coverage enforcement, while the containerized deployment on Azure provides scalability and reliability.

---

**Total Improvements**:
- 85% backend test coverage (exceeds 70% requirement)
- Fully automated CI/CD pipeline with GitHub Actions
- Docker containerization for both services
- PostgreSQL database for production persistence
- Automated Azure deployment on every `main` branch push
- Prometheus metrics integration
- Comprehensive documentation

**Technologies Used**:
- **Testing**: pytest, pytest-cov
- **CI/CD**: GitHub Actions
- **Containerization**: Docker, Docker Compose
- **Cloud Platform**: Azure Container Registry, Container Apps, PostgreSQL
- **Monitoring**: Prometheus Flask Exporter
- **Production Servers**: Gunicorn (backend), Nginx (frontend)
- **Database**: PostgreSQL (production), SQLite (development)

