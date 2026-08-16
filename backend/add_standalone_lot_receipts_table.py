import sqlite3
import os

def create_receipt_table():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'manufacturing.db')
    print(f"Connecting to database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Create standalone_lot_receipts table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS standalone_lot_receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lot_id INTEGER NOT NULL REFERENCES standalone_lots(id) ON DELETE CASCADE,
            receipt_date DATE NOT NULL,
            quantity REAL NOT NULL,
            reference_no TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        conn.commit()
        print("✅ Standalone lot receipts table created successfully!")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    create_receipt_table()
