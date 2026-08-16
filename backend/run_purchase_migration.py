"""
Run purchase invoice table migration
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def run_migration():
    print("="*60)
    print("🚀 Running purchase invoice table migration")
    print("="*60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # List of columns to add (with their types)
    columns_to_add = [
        ("bill_to_address", "TEXT"),
        ("bill_to_city", "TEXT"),
        ("bill_to_state", "TEXT"),
        ("bill_to_pincode", "TEXT"),
        ("bill_to_gst", "TEXT"),
        ("ship_to_address", "TEXT"),
        ("ship_to_city", "TEXT"),
        ("ship_to_state", "TEXT"),
        ("ship_to_pincode", "TEXT"),
        ("ship_to_gst", "TEXT"),
        ("place_of_supply", "TEXT"),
        ("transport_mode", "TEXT"),
        ("vehicle_no", "TEXT"),
        ("cgst_total", "REAL DEFAULT 0"),
        ("sgst_total", "REAL DEFAULT 0"),
        ("igst_total", "REAL DEFAULT 0"),
        ("gst_total", "REAL DEFAULT 0"),
        ("paid_amount", "REAL DEFAULT 0"),
        ("balance", "REAL DEFAULT 0"),
        ("payment_status", "TEXT DEFAULT 'pending'"),
        ("payment_type", "TEXT DEFAULT 'cash'"),
        ("bank_id", "INTEGER"),
        ("notes", "TEXT"),
    ]
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(purchase_invoice)")
    existing = [col[1] for col in cursor.fetchall()]
    
    print(f"\n📋 Existing columns: {len(existing)}")
    print(f"📋 Columns to add: {len(columns_to_add)}")
    
    # Add missing columns
    added = 0
    for col_name, col_type in columns_to_add:
        if col_name not in existing:
            try:
                cursor.execute(f"ALTER TABLE purchase_invoice ADD COLUMN {col_name} {col_type}")
                print(f"✅ Added: {col_name}")
                added += 1
            except Exception as e:
                print(f"❌ Error adding {col_name}: {e}")
        else:
            print(f"⏩ Already exists: {col_name}")
    
    conn.commit()
    
    # Verify final structure
    cursor.execute("PRAGMA table_info(purchase_invoice)")
    final_columns = cursor.fetchall()
    print(f"\n📋 Final columns: {len(final_columns)}")
    
    conn.close()
    
    print("\n" + "="*60)
    print(f"✅ Migration complete! Added {added} columns")
    print("="*60)

if __name__ == "__main__":
    run_migration()