# backend/check_invoice.py
import sqlite3
import os
from config.database import get_db, dict_from_row

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_invoice():
    conn = get_db()
    cursor = conn.cursor()
    
    print("="*60)
    print("📋 LATEST INVOICE")
    print("="*60)
    
    # Get latest invoice
    cursor.execute('''
        SELECT si.*, c.name as customer_name 
        FROM sales_invoice si
        JOIN customers c ON si.customer_id = c.id
        ORDER BY si.id DESC LIMIT 1
    ''')
    invoice = dict_from_row(cursor.fetchone())
    
    if invoice:
        print(f"\n📄 Invoice No: {invoice['invoice_no']}")
        print(f"📅 Date: {invoice['invoice_date']}")
        print(f"👤 Customer: {invoice['customer_name']}")
        print(f"💰 Subtotal: ₹{invoice['subtotal']}")
        print(f"🧾 IGST: ₹{invoice['igst_total']}")
        print(f"💵 Grand Total: ₹{invoice['grand_total']}")
        
        # Get items
        cursor.execute('''
            SELECT si.*, 
                   CASE 
                       WHEN si.item_type = 'finished_good' THEN fg.name 
                       ELSE rm.name 
                   END as item_name
            FROM sales_invoice_items si
            LEFT JOIN finished_goods fg ON si.item_type = 'finished_good' AND si.item_id = fg.id
            LEFT JOIN raw_materials rm ON si.item_type = 'raw_material' AND si.item_id = rm.id
            WHERE si.invoice_id = ?
        ''', (invoice['id'],))
        
        items = cursor.fetchall()
        print("\n📦 Items:")
        for item in items:
            print(f"   - {item['item_name']}: {item['quantity']} × ₹{item['rate']} = ₹{item['total']}")
    
    conn.close()

if __name__ == "__main__":
    check_invoice()