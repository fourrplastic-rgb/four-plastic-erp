"""
Check Database Schema - Verify all columns exist
"""
import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_schema():
    """Check the current database schema"""
    
    print("="*60)
    print("🔍 CHECKING DATABASE SCHEMA")
    print("="*60)
    print(f"📁 Database: {DB_PATH}")
    print("-"*60)
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print("❌ Database file not found!")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get list of all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    
    print(f"\n📋 Tables in database: {len(tables)}")
    for table in tables:
        print(f"   - {table[0]}")
    
    # Check sales_invoice table columns
    print("\n📋 sales_invoice table columns:")
    print("-" * 40)
    
    cursor.execute("PRAGMA table_info(sales_invoice)")
    columns = cursor.fetchall()
    
    # Check for required columns
    required_columns = [
        'cgst_total', 'sgst_total', 'igst_total', 'gst_total',
        'bill_to_address', 'bill_to_city', 'bill_to_state', 'bill_to_pincode', 'bill_to_gst',
        'ship_to_address', 'ship_to_city', 'ship_to_state', 'ship_to_pincode', 'ship_to_gst',
        'challan_no', 'place_of_supply', 'transport_mode', 'vehicle_no'
    ]
    
    existing_columns = []
    missing_columns = []
    
    for col in columns:
        col_name = col[1]
        col_type = col[2]
        existing_columns.append(col_name)
        print(f"   {col_name:<25} {col_type:<10}")
    
    # Check which required columns are missing
    for req_col in required_columns:
        if req_col not in existing_columns:
            missing_columns.append(req_col)
    
    print("-" * 40)
    print(f"\n✅ Total columns: {len(columns)}")
    
    if missing_columns:
        print(f"\n❌ Missing columns: {len(missing_columns)}")
        for col in missing_columns:
            print(f"   - {col}")
    else:
        print(f"\n✅ All required columns exist!")
    
    conn.close()
    
    return missing_columns

def create_migration_script(missing_columns):
    """Create migration script for missing columns"""
    
    if not missing_columns:
        print("\n✅ No migration needed!")
        return
    
    migration_sql = "-- Migration script to add missing columns\n\n"
    
    for col in missing_columns:
        if col in ['cgst_total', 'sgst_total', 'igst_total', 'gst_total']:
            migration_sql += f"ALTER TABLE sales_invoice ADD COLUMN {col} REAL DEFAULT 0;\n"
        elif col in ['challan_no', 'place_of_supply', 'transport_mode', 'vehicle_no']:
            migration_sql += f"ALTER TABLE sales_invoice ADD COLUMN {col} TEXT;\n"
        elif col.startswith('bill_to_') or col.startswith('ship_to_'):
            migration_sql += f"ALTER TABLE sales_invoice ADD COLUMN {col} TEXT;\n"
    
    migration_sql += "\n-- Create indexes\n"
    migration_sql += "CREATE INDEX IF NOT EXISTS idx_sales_invoice_challan ON sales_invoice(challan_no);\n"
    
    # Save migration script
    migration_file = os.path.join(os.path.dirname(__file__), "fix_missing_columns.sql")
    with open(migration_file, 'w') as f:
        f.write(migration_sql)
    
    print(f"\n📝 Migration script created: {migration_file}")
    print("\nRun it with:")
    print(f'sqlite3 "{DB_PATH}" < fix_missing_columns.sql')

if __name__ == "__main__":
    missing = check_schema()
    if missing:
        create_migration_script(missing)
        print("\n🔧 To fix the database, run the migration script above.")
    else:
        print("\n✅ Your database schema is correct!")