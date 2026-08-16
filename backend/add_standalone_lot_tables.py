import sqlite3
import os

def create_tables():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'manufacturing.db')
    print(f"Connecting to database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Create standalone_lots table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS standalone_lots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            vendor_id INTEGER,
            vendor_name TEXT NOT NULL,
            item_name TEXT NOT NULL,
            lot_no TEXT,
            billed_qty REAL DEFAULT 0,
            received_qty REAL DEFAULT 0,
            rate REAL DEFAULT 0,
            billed_amount REAL DEFAULT 0,
            received_amount REAL DEFAULT 0,
            shortage_surplus_qty REAL DEFAULT 0,
            financial_diff REAL DEFAULT 0,
            paid_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'OPEN',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create standalone_lot_payments table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS standalone_lot_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lot_id INTEGER NOT NULL REFERENCES standalone_lots(id) ON DELETE CASCADE,
            payment_date DATE NOT NULL,
            amount REAL NOT NULL,
            reference_no TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        conn.commit()
        print("✅ Standalone lot tables created successfully!")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    create_tables()
