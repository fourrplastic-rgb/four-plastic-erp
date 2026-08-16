"""
Add missing columns to delivery_challan table - FIXED VERSION
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def add_columns_fixed():
    print("="*60)
    print("📦 Adding missing columns to delivery_challan table (FIXED)")
    print("="*60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # List of columns to add (without updated_at)
    columns = [
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
    ]
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(delivery_challan)")
    existing = [col[1] for col in cursor.fetchall()]
    
    print(f"\n📋 Existing columns: {len(existing)}")
    print(f"📋 Columns to add: {len(columns)}")
    print("-" * 40)
    
    added = 0
    for col_name, col_type in columns:
        if col_name not in existing:
            try:
                cursor.execute(f"ALTER TABLE delivery_challan ADD COLUMN {col_name} {col_type}")
                print(f"✅ Added: {col_name}")
                added += 1
            except Exception as e:
                print(f"❌ Error adding {col_name}: {e}")
        else:
            print(f"⏩ Already exists: {col_name}")
    
    # Handle updated_at separately - can't add with DEFAULT CURRENT_TIMESTAMP
    if 'updated_at' not in existing:
        try:
            # Add without default first
            cursor.execute("ALTER TABLE delivery_challan ADD COLUMN updated_at TIMESTAMP")
            print("✅ Added: updated_at (without default)")
            
            # Update existing rows to have current timestamp
            cursor.execute("UPDATE delivery_challan SET updated_at = CURRENT_TIMESTAMP")
            print("✅ Set updated_at for existing rows")
        except Exception as e:
            print(f"❌ Error adding updated_at: {e}")
    else:
        print("⏩ Already exists: updated_at")
    
    # Create indexes
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_delivery_challan_lr_no ON delivery_challan(lr_no)")
        print("✅ Created index: idx_delivery_challan_lr_no")
    except Exception as e:
        print(f"⚠️ Index error (lr_no): {e}")
    
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_delivery_challan_transporter ON delivery_challan(transporter_name)")
        print("✅ Created index: idx_delivery_challan_transporter")
    except Exception as e:
        print(f"⚠️ Index error (transporter): {e}")
    
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_delivery_challan_status ON delivery_challan(status)")
        print("✅ Created index: idx_delivery_challan_status")
    except Exception as e:
        print(f"⚠️ Index error (status): {e}")
    
    conn.commit()
    
    # Verify final structure
    cursor.execute("PRAGMA table_info(delivery_challan)")
    final_columns = cursor.fetchall()
    print(f"\n📋 Final columns: {len(final_columns)}")
    
    conn.close()
    
    print("\n" + "="*60)
    print(f"✅ Migration complete! Added {added} new columns")
    print("="*60)

if __name__ == "__main__":
    add_columns_fixed()