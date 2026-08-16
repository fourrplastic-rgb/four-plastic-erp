"""
Complete system verification
"""
import sqlite3
import os
from config.database import get_db

def verify_all():
    print("="*70)
    print("🔍 COMPLETE SYSTEM VERIFICATION")
    print("="*70)
    
    # 1. Check database connection
    print("\n📁 1. DATABASE CONNECTION")
    print("-" * 40)
    try:
        conn = get_db()
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    cursor = conn.cursor()
    
    # 2. Check foreign keys
    print("\n🔑 2. FOREIGN KEY CONSTRAINTS")
    print("-" * 40)
    cursor.execute("PRAGMA foreign_keys")
    fk_status = cursor.fetchone()[0]
    print(f"✅ Foreign Keys: {'ENABLED' if fk_status else 'DISABLED'}")
    
    # 3. Check tables exist
    print("\n📋 3. REQUIRED TABLES")
    print("-" * 40)
    tables = ['customers', 'banks', 'users', 'sales_invoice', 'raw_materials']
    for table in tables:
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
        if cursor.fetchone():
            print(f"✅ Table '{table}' exists")
        else:
            print(f"❌ Table '{table}' MISSING")
    
    # 4. Check customer ID 1
    print("\n👤 4. CUSTOMER ID 1")
    print("-" * 40)
    cursor.execute("SELECT id, name, code FROM customers WHERE id = 1")
    customer = cursor.fetchone()
    if customer:
        print(f"✅ Customer exists: {customer[1]} ({customer[2]})")
    else:
        print("❌ Customer ID 1 NOT FOUND")
    
    # 5. Check banks
    print("\n🏦 5. BANKS")
    print("-" * 40)
    cursor.execute("SELECT COUNT(*) FROM banks")
    bank_count = cursor.fetchone()[0]
    print(f"✅ Banks in database: {bank_count}")
    
    # 6. Check raw materials
    print("\n📦 6. RAW MATERIALS")
    print("-" * 40)
    cursor.execute("SELECT id, code, name FROM raw_materials WHERE id = 4")
    item = cursor.fetchone()
    if item:
        print(f"✅ Raw Material ID 4 exists: {item[1]} - {item[2]}")
    else:
        print("❌ Raw Material ID 4 NOT FOUND")
    
    # 7. Test foreign key constraint
    print("\n🧪 7. TESTING FOREIGN KEY CONSTRAINT")
    print("-" * 40)
    try:
        cursor.execute('''
            INSERT INTO sales_invoice (
                invoice_no, invoice_date, customer_id,
                subtotal, grand_total, created_by
            ) VALUES (?, date('now'), ?, ?, ?, ?)
        ''', ('TEST-FK', 99999, 1000, 1180, 1))  # customer_id 99999 doesn't exist
        conn.rollback()
        print("❌ Foreign key test FAILED - Insert succeeded when it should have failed!")
    except sqlite3.IntegrityError as e:
        print(f"✅ Foreign key test PASSED - Got expected error: {e}")
    except Exception as e:
        print(f"⚠️ Unexpected error: {e}")
    
    conn.close()
    
    print("\n" + "="*70)
    print("✅ VERIFICATION COMPLETE")
    print("="*70)

if __name__ == "__main__":
    verify_all()