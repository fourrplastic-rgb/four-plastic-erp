"""
Complete fix for sales invoice issues
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def fix_database():
    print("="*60)
    print("🔧 FIXING DATABASE ISSUES")
    print("="*60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # 1. Check current structure
    cursor.execute("PRAGMA foreign_key_list(sales_invoice_items)")
    fks = cursor.fetchall()
    print("\n📋 Current foreign keys in sales_invoice_items:")
    for fk in fks:
        print(f"   {fk}")
    
    # 2. Create new table without the problematic FK
    print("\n🔨 Creating new table structure...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales_invoice_items_new (
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
            FOREIGN KEY (invoice_id) REFERENCES sales_invoice(id) ON DELETE CASCADE
        )
    ''')
    
    # 3. Copy data from old table if it exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sales_invoice_items'")
    if cursor.fetchone():
        print("📋 Copying existing data...")
        cursor.execute('''
            INSERT INTO sales_invoice_items_new 
            SELECT * FROM sales_invoice_items
        ''')
        
        # 4. Drop old table
        print("🗑️ Dropping old table...")
        cursor.execute("DROP TABLE sales_invoice_items")
    
    # 5. Rename new table
    print("📝 Renaming new table...")
    cursor.execute("ALTER TABLE sales_invoice_items_new RENAME TO sales_invoice_items")
    
    # 6. Create indexes
    print("🔨 Creating indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_item ON sales_invoice_items(item_id, item_type)")
    
    # 7. Verify the fix
    cursor.execute("PRAGMA foreign_key_list(sales_invoice_items)")
    new_fks = cursor.fetchall()
    print("\n✅ New foreign keys in sales_invoice_items:")
    for fk in new_fks:
        print(f"   {fk}")
    
    conn.commit()
    conn.close()
    
    print("\n" + "="*60)
    print("✅ Database fix complete!")
    print("="*60)

if __name__ == "__main__":
    fix_database()