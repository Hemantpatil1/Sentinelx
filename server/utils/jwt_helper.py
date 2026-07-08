"""
JWT Authentication Helper
"""
import jwt
import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app

def generate_token(user_id, username, role):
    """Generate a JWT token for the given user."""
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + current_app.config['JWT_EXPIRATION']
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET'], algorithm='HS256')

def decode_token(token):
    """Decode and validate a JWT token."""
    return jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=['HS256'])

def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')

        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Authorization token is missing'}), 401

        try:
            data = decode_token(token)
            request.current_user = data
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator to restrict routes to admin users only."""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated
