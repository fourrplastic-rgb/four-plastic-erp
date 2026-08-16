"""
Check all vendor payments in database
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_all_payments():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*60)
    print("📋 ALL VENDOR PAYMENTS IN DATABASE")
    print("="*60)
    
    cursor.execute("SELECT id, payment_no, vendor_id, amount, payment_mode, reference_no FROM vendor_payments ORDER BY id")
    payments = cursor.fetchall()
    
    if payments:
        print(f"\nFound {len(payments)} payments:")
        print("-" * 80)
        for p in payments:
            print(f"ID: {p[0]}, Payment No: {p[1]}, Vendor ID: {p[2]}, Amount: ₹{p[3]:,.2f}, Mode: {p[4]}, Ref: {p[5]}")
    else:
        print("\n❌ No payments found")
    
    conn.close()

if __name__ == "__main__":
    check_all_payments()