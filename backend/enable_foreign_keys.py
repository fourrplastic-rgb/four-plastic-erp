# backend/enable_foreign_keys.py
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def enable_foreign_keys():
    print("="*60)
    print("🔑 ENABLING FOREIGN KEY CONSTRAINTS")
    print("="*60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # Verify they're enabled
    cursor.execute("PRAGMA foreign_keys")
    status = cursor.fetchone()[0]
    print(f"\n✅ Foreign Keys are now: {'ENABLED' if status else 'DISABLED'}")
    
    # Make it permanent by setting in database
    cursor.execute("PRAGMA foreign_keys")
    
    conn.commit()
    conn.close()
    
    print("\n🔧 To make this permanent, add this to your database.py:")
    print('   conn.execute("PRAGMA foreign_keys = ON")')

if __name__ == "__main__":
    enable_foreign_keys()