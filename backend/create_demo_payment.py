import sqlite3
import datetime
import uuid
from database_config import get_connection

def create_demo_payment():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get a random customer
    cursor.execute("SELECT id FROM customers LIMIT 1")
    customer = cursor.fetchone()
    
    if not customer:
        print("❌ No customers found. Cannot create demo payment.")
        return
        
    customer_id = customer['id']
    amount = 5000.00
    date = datetime.date.today().strftime('%Y-%m-%d')
    mode = 'Cash'
    receipt_no = f"REC-DEMO-{uuid.uuid4().hex[:6].upper()}"
    reference = f"REF-{uuid.uuid4().hex[:6].upper()}"
    notes = "Demo payment created for verification"
    
    # Insert payment
    cursor.execute('''
        INSERT INTO customer_payments 
        (receipt_no, customer_id, payment_date, amount, payment_mode, reference_no, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (receipt_no, customer_id, date, amount, mode, reference, notes))
    
    # Update customer balance
    cursor.execute('''
        UPDATE customers 
        SET current_balance = current_balance - ? 
        WHERE id = ?
    ''', (amount, customer_id))
    
    conn.commit()
    conn.close()
    
    print(f"✅ Successfully created Demo Payment of ₹{amount} for Customer ID {customer_id}")
    print(f"✅ Receipt No: {receipt_no}")

if __name__ == "__main__":
    create_demo_payment()
