
from flask import Flask, render_template
from flask_login import LoginManager

app = Flask(__name__)
app.config.from_object('config')

# Initialize db and models
from models import db, User, VocabEntry
from sqlalchemy import text
db.init_app(app)

with app.app_context():
    from models import Book
    db.create_all()
    # lightweight migration: ensure 'isbn' column exists on 'book'
    try:
        result = db.session.execute(text("PRAGMA table_info(book)"))
        cols = {row[1] for row in result}
        if 'isbn' not in cols:
            db.session.execute(text("ALTER TABLE book ADD COLUMN isbn VARCHAR(20)"))
            db.session.commit()
        if 'cover_id' not in cols:
            db.session.execute(text("ALTER TABLE book ADD COLUMN cover_id INTEGER"))
            db.session.commit()
    except Exception:
        db.session.rollback()

# Register blueprints
from routes.books import bp as books_bp
from routes.auth import bp as auth_bp
from routes.vocab import bp as vocab_bp
app.register_blueprint(books_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(vocab_bp)

# Auth setup
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    app.run(debug=True)
