
from flask import Flask, render_template
from flask_login import LoginManager
from prometheus_flask_exporter import PrometheusMetrics

app = Flask(__name__)
app.config.from_object('config')

# Initialize Prometheus metrics
metrics = PrometheusMetrics(app)
# Expose default metrics (request count, latency, errors)
metrics.info('app_info', 'Book Logger Application', version='1.0.0')

# Initialize db and models
from models import db, User, VocabEntry
from sqlalchemy import text
db.init_app(app)

with app.app_context():
    from models import Book
    try:
        db.create_all()
    except Exception as e:
        # Tables might already exist, which is fine
        if 'already exists' not in str(e).lower():
            raise
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
from routes.import_books import bp as import_bp
app.register_blueprint(books_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(vocab_bp)
app.register_blueprint(import_bp)

# Auth setup
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route("/health")
def health():
    """Health check endpoint for monitoring"""
    return {"status": "ok"}

# Metrics endpoint is automatically available at /metrics

if __name__ == "__main__":
    app.run(debug=True)
