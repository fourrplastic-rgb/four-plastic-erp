# backend/check_all_constraints.py
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_all_constraints():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*60)
    print("🔍 CHECKING ALL FOREIGN KEY CONSTRAINTS")
    print("="*60)
    
    # Check foreign key status
    cursor.execute("PRAGMA foreign_keys")
    fk_status = cursor.fetchone()[0]
    print(f"\n🔑 Foreign Keys: {'ENABLED' if fk_status else 'DISABLED'}")
    
    # Get all foreign keys in sales_invoice
    cursor.execute("PRAGMA foreign_key_list(sales_invoice)")
    fks = cursor.fetchall()
    
    print("\n📋 Foreign keys in sales_invoice table:")
    print("-" * 60)
    for fk in fks:
        print(f"   ID: {fk[0]}")
        print(f"   Table: {fk[2]}")
        print(f"   From: {fk[3]}")
        print(f"   To: {fk[4]}")
        print(f"   On Update: {fk[5]}")
        print(f"   On Delete: {fk[6]}")
        print(f"   Match: {fk[7]}")
        print("-" * 40)
    
    # Check if all referenced tables have the required IDs
    print("\n🔍 Checking referenced data:")
    print("-" * 60)
    
    # Check customers
    cursor.execute("SELECT COUNT(*) FROM customers WHERE id = 1")
    if cursor.fetchone()[0] > 0:
        print("✅ Customer ID 1 exists")
    else:
        print("❌ Customer ID 1 MISSING")
    
    # Check banks (even though bank_id is None, let's verify)
    cursor.execute("SELECT COUNT(*) FROM banks")
    bank_count = cursor.fetchone()[0]
    print(f"✅ Banks in database: {bank_count}")
    
    # Check if any bank_id = 1 exists (for when it's selected)
    cursor.execute("SELECT COUNT(*) FROM banks WHERE id = 1")
    if cursor.fetchone()[0] > 0:
        print("✅ Bank ID 1 exists")
    
    # Check users (created_by = 1)
    cursor.execute("SELECT COUNT(*) FROM users WHERE id = 1")
    if cursor.fetchone()[0] > 0:
        print("✅ User ID 1 exists")
    else:
        print("❌ User ID 1 MISSING - This could be the issue!")
    
    # Check items in the invoice
    print("\n📦 Checking items in your invoice data:")
    print("-" * 60)
    
    # Your invoice has item_id = 4, item_type = 'raw_material'
    cursor.execute("SELECT COUNT(*) FROM raw_materials WHERE id = 4")
    if cursor.fetchone()[0] > 0:
        print("✅ Raw Material ID 4 exists")
    else:
        print("❌ Raw Material ID 4 MISSING - This is the issue!")
        
        # List available raw materials
        cursor.execute("SELECT id, code, name FROM raw_materials")
        materials = cursor.fetchall()
        print("\n📋 Available raw materials:")
        for m in materials:
            print(f"   ID: {m[0]}, Code: {m[1]}, Name: {m[2]}")
    
    conn.close()

if __name__ == "__main__":
    check_all_constraints()