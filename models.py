from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    isbn = db.Column(db.String(20), index=True)
    cover_id = db.Column(db.Integer, index=True)
    start_date = db.Column(db.String(20))
    finish_date = db.Column(db.String(20))
    rating = db.Column(db.Integer)
    tags = db.Column(db.String(200))
    notes = db.Column(db.Text)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # Flask-Login helpers
    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class UserBook(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False, index=True)
    status = db.Column(db.String(20))  # reading, completed, wishlist
    rating = db.Column(db.Integer)
    start_date = db.Column(db.String(20))
    finish_date = db.Column(db.String(20))
    tags = db.Column(db.String(200))
    notes = db.Column(db.Text)



class VocabEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False, index=True)
    word = db.Column(db.String(200), nullable=False, index=True)
    definition = db.Column(db.Text)
    quote = db.Column(db.Text)
    srs_box = db.Column(db.Integer, default=1, nullable=False, index=True)  # Leitner box 1..5
    next_review_at = db.Column(db.DateTime, index=True)
    created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

