"""
Test database connection and basic insert
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def test_connection():
    print("="*60)
    print("🔍 TESTING DATABASE CONNECTION")
    print("="*60)
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        return
    
    print(f"✅ Database found at: {DB_PATH}")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Test simple query
        cursor.execute("SELECT COUNT(*) FROM sales_invoice")
        count = cursor.fetchone()[0]
        print(f"✅ Successfully queried sales_invoice table")
        print(f"📊 Total invoices: {count}")
        
        # Test foreign key status
        cursor.execute("PRAGMA foreign_keys")
        fk_status = cursor.fetchone()[0]
        print(f"🔑 Foreign Keys: {'ENABLED' if fk_status else 'DISABLED'}")
        
        conn.close()
        print("\n✅ Database connection test passed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_connection()