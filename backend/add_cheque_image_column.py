import os
from database_config import get_connection

def migrate():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Try adding to customer_payments
    try:
        cursor.execute("ALTER TABLE customer_payments ADD COLUMN cheque_image_path TEXT")
        print("Added cheque_image_path to customer_payments")
    except Exception as e:
        print(f"Error (or already exists) on customer_payments: {e}")
        
    # Try adding to vendor_payments
    try:
        cursor.execute("ALTER TABLE vendor_payments ADD COLUMN cheque_image_path TEXT")
        print("Added cheque_image_path to vendor_payments")
    except Exception as e:
        print(f"Error (or already exists) on vendor_payments: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
