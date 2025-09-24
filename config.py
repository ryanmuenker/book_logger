
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or f"sqlite:///{os.path.join(BASE_DIR, 'app.sqlite3')}"
SQLALCHEMY_TRACK_MODIFICATIONS = False
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
