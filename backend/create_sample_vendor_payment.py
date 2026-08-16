"""
Create a sample vendor payment
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def create_sample():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if vendor ID 1 exists
    cursor.execute("SELECT id, name FROM vendors WHERE id = 1")
    vendor = cursor.fetchone()
    
    if not vendor:
        print("❌ Vendor ID 1 not found!")
        conn.close()
        return
    
    # Check if bank ID 2 exists
    cursor.execute("SELECT id, name FROM banks WHERE id = 2")
    bank = cursor.fetchone()
    
    # Generate unique payment number
    payment_no = f"PAY{datetime.now().strftime('%y%m%d%H%M%S')}"
    
    try:
        cursor.execute('''
            INSERT INTO vendor_payments (
                payment_no, vendor_id, payment_date, amount,
                payment_mode, reference_no, bank_id, notes, status,
                created_by
            ) VALUES (?, ?, date('now'), ?, ?, ?, ?, ?, ?, ?)
        ''', (
            payment_no,
            1,  # vendor_id
            30000,  # amount
            'bank',
            'TRN789012',
            2,  # bank_id
            'Payment for purchase PUR2403001',
            'completed',
            1  # created_by
        ))
        
        payment_id = cursor.lastrowid
        conn.commit()
        print(f"✅ Sample vendor payment created!")
        print(f"   ID: {payment_id}")
        print(f"   Payment No: {payment_no}")
        print(f"   Amount: ₹30,000")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_sample()