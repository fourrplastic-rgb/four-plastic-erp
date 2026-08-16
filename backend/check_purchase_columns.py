"""
Check Purchase Invoice Table Columns
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_columns():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*60)
    print("🔍 CHECKING PURCHASE INVOICE TABLE")
    print("="*60)
    
    cursor.execute("PRAGMA table_info(purchase_invoice)")
    columns = cursor.fetchall()
    
    print("\n📋 Current columns in purchase_invoice:")
    for col in columns:
        print(f"   {col[1]:<20} {col[2]:<10}")
    
    # Check if bill_to_address exists
    has_bill_to = any(col[1] == 'bill_to_address' for col in columns)
    print(f"\n✅ bill_to_address exists: {has_bill_to}")
    
    conn.close()

if __name__ == "__main__":
    check_columns()