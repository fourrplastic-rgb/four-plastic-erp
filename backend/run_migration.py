"""
Run SQL migration script - Fix missing columns
"""
import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def run_migration():
    print("="*60)
    print("🚀 Running database migration")
    print("="*60)
    print(f"📁 Database: {DB_PATH}")
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # List of columns to add
    columns_to_add = [
        ("cgst_total", "REAL DEFAULT 0"),
        ("sgst_total", "REAL DEFAULT 0"),
        ("igst_total", "REAL DEFAULT 0"),
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
        ("challan_no", "TEXT"),
    ]
    
    success_count = 0
    error_count = 0
    
    print("\n📋 Adding missing columns...")
    print("-" * 40)
    
    for column_name, column_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE sales_invoice ADD COLUMN {column_name} {column_type}")
            print(f"✅ Added: {column_name} {column_type}")
            success_count += 1
        except Exception as e:
            if "duplicate" in str(e).lower():
                print(f"⚠️ Already exists: {column_name}")
                success_count += 1
            else:
                print(f"❌ Error adding {column_name}: {e}")
                error_count += 1
    
    # Create index
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sales_invoice_challan ON sales_invoice(challan_no)")
        print("✅ Created index: idx_sales_invoice_challan")
    except Exception as e:
        print(f"⚠️ Index issue: {e}")
    
    conn.commit()
    
    # Verify the columns were added
    print("\n🔍 Verifying columns...")
    print("-" * 40)
    cursor.execute("PRAGMA table_info(sales_invoice)")
    columns = cursor.fetchall()
    
    existing_columns = [col[1] for col in columns]
    for req_col, _ in columns_to_add:
        if req_col in existing_columns:
            print(f"✅ {req_col:<20} - Present")
        else:
            print(f"❌ {req_col:<20} - MISSING")
    
    conn.close()
    
    print("-" * 40)
    print(f"✅ Successfully added: {success_count}")
    print(f"❌ Errors: {error_count}")
    print("="*60)

if __name__ == "__main__":
    run_migration()