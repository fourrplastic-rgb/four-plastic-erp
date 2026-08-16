"""
Show all sales invoices in the database
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def show_all_invoices():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n" + "="*80)
    print("📋 ALL SALES INVOICES")
    print("="*80)
    
    cursor.execute("""
        SELECT si.id, si.invoice_no, si.invoice_date, c.name, 
               si.grand_total, si.payment_status
        FROM sales_invoice si
        JOIN customers c ON si.customer_id = c.id
        ORDER BY si.id
    """)
    
    invoices = cursor.fetchall()
    
    if invoices:
        print(f"\n{'ID':<5} {'Invoice No':<20} {'Date':<12} {'Customer':<20} {'Total':<12} {'Status':<10}")
        print("-" * 85)
        for inv in invoices:
            print(f"{inv[0]:<5} {inv[1]:<20} {inv[2]:<12} {inv[3][:18]:<20} ₹{inv[4]:<11,.2f} {inv[5]:<10}")
        print("-" * 85)
        print(f"Total: {len(invoices)} invoices")
    else:
        print("\n❌ No invoices found in database")
    
    conn.close()

if __name__ == "__main__":
    show_all_invoices()