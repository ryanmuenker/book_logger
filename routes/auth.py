from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User

bp = Blueprint('auth', __name__)


@bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = (request.form.get('email') or '').strip().lower()
        password = request.form.get('password') or ''
        if not email or not password:
            flash('Email and password are required.')
            return render_template('register.html', title='Register')
        if User.query.filter_by(email=email).first():
            flash('Email already in use.')
            return render_template('register.html', title='Register')
        u = User(email=email)
        u.set_password(password)
        db.session.add(u)
        db.session.commit()
        login_user(u)
        return redirect(url_for('books.books_list'))
    return render_template('register.html', title='Register')


@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = (request.form.get('email') or '').strip().lower()
        password = request.form.get('password') or ''
        u = User.query.filter_by(email=email).first()
        if not u or not u.check_password(password):
            flash('Invalid credentials.')
            return render_template('login.html', title='Login')
        login_user(u)
        return redirect(url_for('books.books_list'))
    return render_template('login.html', title='Login')


@bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))
@bp.route('/auth/me')
def me():
    if current_user.is_authenticated:
        return jsonify({"user": {"id": current_user.id, "email": current_user.email}})
    return jsonify({"user": None})


@bp.route('/auth/login', methods=['POST'])
def login_json():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    u = User.query.filter_by(email=email).first()
    if not u or not u.check_password(password):
        return jsonify({"error": "invalid_credentials"}), 401
    login_user(u)
    return jsonify({"ok": True, "user": {"id": u.id, "email": u.email}})


@bp.route('/auth/register', methods=['POST'])
def register_json():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not email or not password:
        return jsonify({"error": "missing_fields"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email_in_use"}), 400
    u = User(email=email)
    u.set_password(password)
    db.session.add(u)
    db.session.commit()
    login_user(u)
    return jsonify({"ok": True, "user": {"id": u.id, "email": u.email}})


@bp.route('/auth/logout', methods=['POST'])
@login_required
def logout_json():
    logout_user()
    return jsonify({"ok": True})



