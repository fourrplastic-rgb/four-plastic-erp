import sqlite3
import os

# Get database path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), 'database', 'manufacturing.db')

print(f"Checking database at: {DB_PATH}")

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check delivery_challan_items table columns
    cursor.execute("PRAGMA table_info(delivery_challan_items)")
    columns = cursor.fetchall()
    
    print("\n📊 delivery_challan_items table columns:")
    for col in columns:
        print(f"  - {col[1]}: {col[2]}")
    
    # Check if there are any records
    cursor.execute("SELECT COUNT(*) FROM delivery_challan_items")
    count = cursor.fetchone()[0]
    print(f"\nTotal records: {count}")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")