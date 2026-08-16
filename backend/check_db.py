# check_db.py
import os
import sqlite3

# Check current directory
print("Current directory:", os.getcwd())

# Check for database file
db_path = 'database.db'
if os.path.exists(db_path):
    print(f"✅ Database file found: {db_path}")
    print(f"File size: {os.path.getsize(db_path)} bytes")
    
    # Try to connect
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("\n📊 Tables in database:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table['name']}")
            count = cursor.fetchone()['count']
            print(f"  - {table['name']}: {count} records")
        
        conn.close()
    except Exception as e:
        print(f"❌ Error connecting: {e}")
else:
    print(f"❌ Database file not found: {db_path}")
    
    # Look for .db files
    db_files = [f for f in os.listdir('.') if f.endswith('.db')]
    if db_files:
        print(f"Found other database files: {db_files}")