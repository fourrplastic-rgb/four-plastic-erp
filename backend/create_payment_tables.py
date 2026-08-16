"""
Create payment tables in the database
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def create_tables():
    print("="*60)
    print("📦 CREATING PAYMENT TABLES")
    print("="*60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create customer payments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_no TEXT UNIQUE NOT NULL,
            customer_id INTEGER NOT NULL,
            payment_date DATE NOT NULL,
            amount REAL NOT NULL,
            payment_mode TEXT NOT NULL,
            reference_no TEXT,
            bank_id INTEGER,
            notes TEXT,
            status TEXT DEFAULT 'completed',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (bank_id) REFERENCES banks(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    ''')
    print("✅ customer_payments table created")
    
    # Create vendor payments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vendor_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_no TEXT UNIQUE NOT NULL,
            vendor_id INTEGER NOT NULL,
            payment_date DATE NOT NULL,
            amount REAL NOT NULL,
            payment_mode TEXT NOT NULL,
            reference_no TEXT,
            bank_id INTEGER,
            notes TEXT,
            status TEXT DEFAULT 'completed',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id),
            FOREIGN KEY (bank_id) REFERENCES banks(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    ''')
    print("✅ vendor_payments table created")
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_customer_payments_customer ON customer_payments(customer_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_customer_payments_date ON customer_payments(payment_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON vendor_payments(vendor_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vendor_payments_date ON vendor_payments(payment_date)")
    print("✅ Indexes created")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Payment tables created successfully!")

if __name__ == "__main__":
    create_tables()