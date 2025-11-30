
from flask import Flask, render_template, request, jsonify
from flask_login import LoginManager
from prometheus_flask_exporter import PrometheusMetrics
from functools import wraps

app = Flask(__name__)
app.config.from_object('config')

# CORS headers for API endpoints
@app.after_request
def after_request(response):
    # Allow requests from frontend domain
    origin = request.headers.get('Origin', '')
    if 'book-logger-frontend' in origin or 'localhost' in origin or '127.0.0.1' in origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        response = jsonify({})
        origin = request.headers.get('Origin', '')
        if 'book-logger-frontend' in origin or 'localhost' in origin or '127.0.0.1' in origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

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
    # Create all tables - SQLAlchemy handles this for both SQLite and PostgreSQL
    db.create_all()
    # Note: For production migrations, consider using Alembic

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
