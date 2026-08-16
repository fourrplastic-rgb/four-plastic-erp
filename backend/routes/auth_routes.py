import os
import secrets
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from database_config import get_connection

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
        
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        
        if user and check_password_hash(user['password'], password):
            # Generate a secure random token
            token = secrets.token_hex(32)
            
            # Append token to existing tokens (allowing multi-device login)
            existing_tokens_str = user['auth_token'] or ''
            existing_tokens = [t.strip() for t in existing_tokens_str.split(',') if t.strip()]
            existing_tokens.append(token)
            # Limit to last 10 tokens to prevent infinite growth
            existing_tokens = existing_tokens[-10:]
            new_tokens_str = ','.join(existing_tokens)
            
            # Save token to database
            cursor.execute("UPDATE users SET auth_token = ? WHERE id = ?", (new_tokens_str, user['id']))
            conn.commit()
            conn.close()
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'username': user['username'],
                    'full_name': user['full_name'],
                    'role': user['role']
                }
            }), 200
        else:
            conn.close()
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, auth_token FROM users WHERE auth_token LIKE ?", (f"%{token}%",))
            user = cursor.fetchone()
            if user:
                tokens = [t.strip() for t in (user['auth_token'] or '').split(',') if t.strip()]
                if token in tokens:
                    tokens.remove(token)
                    new_token_str = ','.join(tokens) if tokens else None
                    cursor.execute("UPDATE users SET auth_token = ? WHERE id = ?", (new_token_str, user['id']))
                    conn.commit()
            conn.close()
        except Exception as e:
            pass
    return jsonify({'message': 'Logged out successfully'}), 200
