import sqlite3
import os
import sys

# Get database path relative to project root
backend_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(backend_dir, '..', 'database', 'manufacturing.db')

print(f"📁 Database path: {os.path.abspath(db_path)}")

if not os.path.exists(db_path):
    print("❌ Database not found! Please make sure start.sh has run at least once.")
    sys.exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Alter customer_payments
    try:
        cursor.execute("ALTER TABLE customer_payments ADD COLUMN invoice_id INTEGER REFERENCES sales_invoice(id);")
        print("✅ Added invoice_id to customer_payments table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("ℹ️ invoice_id already exists in customer_payments table")
        else:
            raise e
            
    # 2. Alter vendor_payments
    try:
        cursor.execute("ALTER TABLE vendor_payments ADD COLUMN invoice_id INTEGER REFERENCES purchase_invoice(id);")
        print("✅ Added invoice_id to vendor_payments table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("ℹ️ invoice_id already exists in vendor_payments table")
        else:
            raise e
            
    # 3. Initialize balances for sales invoices if they are NULL/empty
    cursor.execute("UPDATE sales_invoice SET paid_amount = 0 WHERE paid_amount IS NULL;")
    cursor.execute("UPDATE sales_invoice SET balance = grand_total WHERE balance IS NULL OR balance = 0;")
    cursor.execute("UPDATE sales_invoice SET payment_status = 'pending' WHERE payment_status IS NULL;")
    
    # 4. Initialize balances for purchase invoices if they are NULL/empty
    cursor.execute("UPDATE purchase_invoice SET paid_amount = 0 WHERE paid_amount IS NULL;")
    cursor.execute("UPDATE purchase_invoice SET balance = grand_total WHERE balance IS NULL OR balance = 0;")
    cursor.execute("UPDATE purchase_invoice SET payment_status = 'pending' WHERE payment_status IS NULL;")
    
    conn.commit()
    print("✅ Database migration completed successfully!")
    
except Exception as err:
    print(f"❌ Migration failed: {err}")
    sys.exit(1)
finally:
    if 'conn' in locals() and conn:
        conn.close()
