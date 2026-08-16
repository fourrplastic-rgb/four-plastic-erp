import sqlite3
import os

# Get database path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), 'database', 'manufacturing.db')

print(f"Migrating database at: {DB_PATH}")

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if amount column exists in delivery_challan_items
    cursor.execute("PRAGMA table_info(delivery_challan_items)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Existing columns: {columns}")
    
    if 'amount' not in columns:
        print("Adding amount column to delivery_challan_items table...")
        cursor.execute('ALTER TABLE delivery_challan_items ADD COLUMN amount REAL DEFAULT 0')
        print("✅ Amount column added successfully!")
    else:
        print("✅ Amount column already exists")
    
    # Also check if total_amount column exists in delivery_challan
    cursor.execute("PRAGMA table_info(delivery_challan)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"delivery_challan columns: {columns}")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Migration completed successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")