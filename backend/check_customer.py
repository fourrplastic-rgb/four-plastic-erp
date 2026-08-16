# backend/check_customer.py
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_customer():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*60)
    print("🔍 CHECKING CUSTOMER ID 1")
    print("="*60)
    
    cursor.execute("SELECT * FROM customers WHERE id = 1")
    customer = cursor.fetchone()
    
    if customer:
        print(f"✅ Customer found: ID={customer[0]}, Name={customer[2]}")
    else:
        print("❌ Customer ID 1 NOT FOUND!")
        
        # List all customers
        cursor.execute("SELECT id, name FROM customers")
        customers = cursor.fetchall()
        print("\n📋 Available customers:")
        for c in customers:
            print(f"   ID: {c[0]}, Name: {c[1]}")
    
    conn.close()

if __name__ == "__main__":
    check_customer()