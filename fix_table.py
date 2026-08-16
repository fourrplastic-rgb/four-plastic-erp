import sqlite3
import os

DB_PATH = '/Users/laxmansutar/Desktop/FOUR_ (R)_PLASTIC/database/manufacturing.db'

print(f"📁 Fixing database: {DB_PATH}")

try:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    cursor = conn.cursor()
    
    # Enable WAL mode
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys = OFF")
    
    # Create new table without foreign key constraint on item_id
    cursor.execute('''
        CREATE TABLE purchase_invoice_items_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            item_type TEXT NOT NULL,
            quantity REAL NOT NULL,
            rate REAL NOT NULL,
            discount REAL DEFAULT 0,
            taxable_value REAL NOT NULL,
            cgst_rate REAL DEFAULT 9,
            sgst_rate REAL DEFAULT 9,
            igst_rate REAL DEFAULT 0,
            cgst_amount REAL DEFAULT 0,
            sgst_amount REAL DEFAULT 0,
            igst_amount REAL DEFAULT 0,
            total REAL NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES purchase_invoice(id) ON DELETE CASCADE
        )
    ''')
    
    # Copy data from old table
    cursor.execute('''
        INSERT INTO purchase_invoice_items_new 
        SELECT * FROM purchase_invoice_items
    ''')
    
    # Drop old table
    cursor.execute("DROP TABLE purchase_invoice_items")
    
    # Rename new table
    cursor.execute("ALTER TABLE purchase_invoice_items_new RENAME TO purchase_invoice_items")
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_purchase_items_invoice ON purchase_invoice_items(invoice_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_purchase_items_item ON purchase_invoice_items(item_id, item_type)")
    
    conn.commit()
    
    # Verify
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("SELECT sql FROM sqlite_master WHERE name='purchase_invoice_items'")
    result = cursor.fetchone()
    print("✅ Table fixed successfully!")
    print(f"New table structure: {result[0] if result else 'Not found'}")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
