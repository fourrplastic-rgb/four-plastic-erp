import sqlite3
import os

# Get database path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), 'database', 'manufacturing.db')

print(f"Migrating database at: {DB_PATH}")

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if item_name column exists
    cursor.execute("PRAGMA table_info(delivery_challan_items)")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    if 'item_name' not in columns:
        print("Adding item_name column...")
        
        # SQLite doesn't support adding column with default value easily
        # We'll recreate the table
        cursor.execute('''
            CREATE TABLE delivery_challan_items_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                challan_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                item_type TEXT NOT NULL,
                item_name TEXT NOT NULL DEFAULT 'Unknown Item',
                quantity REAL NOT NULL,
                rate REAL,
                amount REAL DEFAULT 0,
                notes TEXT,
                FOREIGN KEY (challan_id) REFERENCES delivery_challan(id) ON DELETE CASCADE
            )
        ''')
        
        # Copy data from old table
        cursor.execute('''
            INSERT INTO delivery_challan_items_new 
            (id, challan_id, item_id, item_type, quantity, rate, amount, notes, item_name)
            SELECT id, challan_id, item_id, item_type, quantity, rate, amount, notes, 'Unknown Item'
            FROM delivery_challan_items
        ''')
        
        # Drop old table and rename new one
        cursor.execute('DROP TABLE delivery_challan_items')
        cursor.execute('ALTER TABLE delivery_challan_items_new RENAME TO delivery_challan_items')
        
        print("✅ item_name column added successfully!")
    else:
        print("✅ item_name column already exists")
    
    conn.commit()
    conn.close()
    
    print("✅ Migration completed successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")