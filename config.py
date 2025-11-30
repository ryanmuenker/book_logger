
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Support both PostgreSQL and SQLite (for local development)
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    # Use provided DATABASE_URL (PostgreSQL connection string)
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
else:
    # Fallback to SQLite for local development
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'app.sqlite3')}"
SQLALCHEMY_TRACK_MODIFICATIONS = False
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")

# Session cookie settings for proxy setup
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True  # Required for HTTPS
# Don't set a domain so cookies work through nginx proxy
SESSION_COOKIE_DOMAIN = None
