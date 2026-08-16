"""
Check if payment tables exist
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_tables():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*60)
    print("🔍 CHECKING PAYMENT TABLES")
    print("="*60)
    
    tables = ['customer_payments', 'vendor_payments']
    
    for table in tables:
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
        if cursor.fetchone():
            print(f"✅ Table '{table}' exists")
        else:
            print(f"❌ Table '{table}' MISSING")
    
    conn.close()

if __name__ == "__main__":
    check_tables()