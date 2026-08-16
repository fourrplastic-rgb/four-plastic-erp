"""
Check existing invoice numbers in the database
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_invoices():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*60)
    print("📋 EXISTING INVOICES IN DATABASE")
    print("="*60)
    
    cursor.execute("""
        SELECT id, invoice_no, customer_id, grand_total, payment_status 
        FROM sales_invoice 
        ORDER BY id DESC 
        LIMIT 20
    """)
    
    invoices = cursor.fetchall()
    
    if invoices:
        print(f"\n✅ Found {len(invoices)} recent invoices:")
        print("-" * 80)
        print(f"{'ID':<5} {'Invoice No':<20} {'Customer':<10} {'Total':<15} {'Status':<10}")
        print("-" * 80)
        for inv in invoices:
            print(f"{inv[0]:<5} {inv[1]:<20} {inv[2]:<10} ₹{inv[3]:<14,.2f} {inv[4]:<10}")
    else:
        print("\n❌ No invoices found in database")
    
    # Check total count
    cursor.execute("SELECT COUNT(*) FROM sales_invoice")
    total = cursor.fetchone()[0]
    print(f"\n📊 Total invoices in database: {total}")
    
    conn.close()

if __name__ == "__main__":
    check_invoices()