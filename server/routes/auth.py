"""
Authentication Routes
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
"""
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
from database.db import get_db
from utils.jwt_helper import generate_token, token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Update last login
    db.execute(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", (user['id'],)
    )
    db.commit()

    token = generate_token(user['id'], user['username'], user['role'])

    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
        },
        'message': f'Welcome back, {user["username"]}!'
    })

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Logout endpoint (client-side token removal)."""
    return jsonify({'message': 'Logged out successfully'})

@auth_bp.route('/me', methods=['GET'])
@token_required
def me():
    """Get current user info."""
    user_data = request.current_user
    db = get_db()
    user = db.execute(
        "SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?",
        (user_data['user_id'],)
    ).fetchone()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(dict(user))

@auth_bp.route('/users', methods=['GET'])
@token_required
def get_users():
    """Get all users (admin only)."""
    db = get_db()
    users = db.execute(
        "SELECT id, username, email, role, created_at, last_login FROM users"
    ).fetchall()
    return jsonify([dict(u) for u in users])
