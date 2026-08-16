import sqlite3
import sys
from werkzeug.security import generate_password_hash
from database_config import get_connection

def change_password(new_password):
    if not new_password or len(new_password) < 6:
        print("❌ Error: Password must be at least 6 characters long.")
        return False
        
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        hashed_password = generate_password_hash(new_password, method='pbkdf2:sha256')
        
        cursor.execute("UPDATE users SET password = ? WHERE username = 'admin'", (hashed_password,))
        
        if cursor.rowcount > 0:
            print("✅ Admin password updated successfully.")
            conn.commit()
            success = True
        else:
            print("❌ Error: Admin user not found.")
            success = False
            
        conn.close()
        return success
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        new_pass = sys.argv[1]
    else:
        new_pass = input("Enter new secure password for 'admin': ")
        
    change_password(new_pass.strip())
