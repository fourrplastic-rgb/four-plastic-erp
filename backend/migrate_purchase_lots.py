import sqlite3
import os

DB_PATH = '../database/manufacturing.db'

def migrate_purchase_lots():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Adding lot_no and received_quantity columns to purchase_invoice_items...")
        
        # Check if lot_no already exists
        cursor.execute("PRAGMA table_info(purchase_invoice_items)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'lot_no' not in columns:
            cursor.execute("ALTER TABLE purchase_invoice_items ADD COLUMN lot_no TEXT")
            print("✓ Added lot_no column")
        else:
            print("- lot_no column already exists")
            
        if 'received_quantity' not in columns:
            cursor.execute("ALTER TABLE purchase_invoice_items ADD COLUMN received_quantity REAL")
            # Set initial value to match quantity to prevent existing records from showing shortage
            cursor.execute("UPDATE purchase_invoice_items SET received_quantity = quantity")
            print("✓ Added received_quantity column and initialized with quantity")
        else:
            print("- received_quantity column already exists")
            
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_purchase_lots()
