import os
import sys
from pathlib import Path

import pytest

os.environ.setdefault("DATABASE_URL", "sqlite:///test_app.sqlite3")

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import app as flask_app  # noqa: E402
from models import db  # noqa: E402

TEST_TEMPLATES = Path(__file__).parent / "templates"
if flask_app.jinja_loader and str(TEST_TEMPLATES) not in flask_app.jinja_loader.searchpath:
    flask_app.jinja_loader.searchpath.insert(0, str(TEST_TEMPLATES))


@pytest.fixture(scope="session")
def app(tmp_path_factory):
    db_path: Path = tmp_path_factory.mktemp("data") / "test_app.sqlite3"
    flask_app.config.update(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
            "WTF_CSRF_ENABLED": False,
        }
    )
    with flask_app.app_context():
        yield flask_app


@pytest.fixture(autouse=True)
def _clean_database(app):
    with app.app_context():
        db.drop_all()
        db.create_all()
        yield
        db.session.remove()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_client(client):
    client.post(
        "/auth/register",
        json={"email": "tester@example.com", "password": "secret-password"},
    )
    return client


