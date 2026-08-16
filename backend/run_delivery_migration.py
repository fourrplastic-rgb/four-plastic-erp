"""
Run delivery challan table migration
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def run_migration():
    print("="*60)
    print("🚀 Running delivery challan table migration")
    print("="*60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # List of columns to add
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
        ("transporter_name", "TEXT"),
        ("transporter_phone", "TEXT"),
        ("lr_no", "TEXT"),
        ("lr_date", "DATE"),
        ("no_of_packages", "INTEGER DEFAULT 0"),
        ("weight", "REAL DEFAULT 0"),
        ("freight_charges", "REAL DEFAULT 0"),
        ("payment_terms", "TEXT"),
        ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ]
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(delivery_challan)")
    existing = [col[1] for col in cursor.fetchall()]
    
    print(f"\n📋 Existing columns: {len(existing)}")
    print(f"📋 Columns to add: {len(columns_to_add)}")
    
    # Add missing columns
    added = 0
    skipped = 0
    for col_name, col_type in columns_to_add:
        if col_name not in existing:
            try:
                cursor.execute(f"ALTER TABLE delivery_challan ADD COLUMN {col_name} {col_type}")
                print(f"✅ Added: {col_name}")
                added += 1
            except Exception as e:
                print(f"❌ Error adding {col_name}: {e}")
        else:
            print(f"⏩ Already exists: {col_name}")
            skipped += 1
    
    # Create indexes
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_delivery_challan_lr_no ON delivery_challan(lr_no)")
        print("✅ Created index: idx_delivery_challan_lr_no")
    except Exception as e:
        print(f"⚠️ Index error: {e}")
    
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_delivery_challan_transporter ON delivery_challan(transporter_name)")
        print("✅ Created index: idx_delivery_challan_transporter")
    except Exception as e:
        print(f"⚠️ Index error: {e}")
    
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_delivery_challan_status ON delivery_challan(status)")
        print("✅ Created index: idx_delivery_challan_status")
    except Exception as e:
        print(f"⚠️ Index error: {e}")
    
    conn.commit()
    
    # Verify final structure
    cursor.execute("PRAGMA table_info(delivery_challan)")
    final_columns = cursor.fetchall()
    print(f"\n📋 Final columns: {len(final_columns)}")
    
    conn.close()
    
    print("\n" + "="*60)
    print(f"✅ Migration complete! Added {added} columns, skipped {skipped}")
    print("="*60)

if __name__ == "__main__":
    run_migration()