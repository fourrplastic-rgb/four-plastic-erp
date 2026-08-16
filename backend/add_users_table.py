import sqlite3
from werkzeug.security import generate_password_hash
from database_config import get_connection

def migrate():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Reset admin password to a proper hash using pbkdf2:sha256
    hashed_password = generate_password_hash('admin123', method='pbkdf2:sha256')
    
    # Check if admin exists
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    admin = cursor.fetchone()
    
    if admin:
        cursor.execute('''
            UPDATE users SET password = ? WHERE username = 'admin'
        ''', (hashed_password,))
        print("✅ Updated existing `admin` password to a secure hash.")
    else:
        cursor.execute('''
            INSERT INTO users (username, password, full_name, role)
            VALUES (?, ?, ?, ?)
        ''', ('admin', hashed_password, 'System Admin', 'admin'))
        print("✅ Inserted default `admin` user with secure hash.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
