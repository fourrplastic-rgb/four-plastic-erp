"""
Check vendor payments in database
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_vendor_payments():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*60)
    print("📋 VENDOR PAYMENTS IN DATABASE")
    print("="*60)
    
    cursor.execute("SELECT id, payment_no, vendor_id, amount FROM vendor_payments ORDER BY id")
    payments = cursor.fetchall()
    
    if payments:
        print(f"\n✅ Found {len(payments)} vendor payments:")
        print("-" * 50)
        for p in payments:
            print(f"ID: {p[0]}, Payment No: {p[1]}, Vendor ID: {p[2]}, Amount: ₹{p[3]:,.2f}")
    else:
        print("\n❌ No vendor payments found in database")
    
    conn.close()

if __name__ == "__main__":
    check_vendor_payments()