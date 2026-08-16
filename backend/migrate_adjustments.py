import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'manufacturing.db')
    print(f"Connecting to database at {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Add party_type and party_id to journal_entries
        try:
            cursor.execute("ALTER TABLE journal_entries ADD COLUMN party_type TEXT DEFAULT NULL")
            cursor.execute("ALTER TABLE journal_entries ADD COLUMN party_id INTEGER DEFAULT NULL")
            print("✅ Added party_type and party_id to journal_entries")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️ Columns party_type and party_id already exist in journal_entries")
            else:
                print(f"❌ Error altering journal_entries: {e}")

        # 2. Create stock_adjustments table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS stock_adjustments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            adjustment_no TEXT UNIQUE NOT NULL,
            adjustment_date DATE NOT NULL,
            item_type TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            adjustment_type TEXT NOT NULL, -- 'ADDITION' or 'DEDUCTION'
            quantity REAL NOT NULL,
            rate REAL NOT NULL,
            amount REAL NOT NULL,
            reason TEXT,
            voucher_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (voucher_id) REFERENCES journal_vouchers(id)
        )
        ''')
        print("✅ Created stock_adjustments table")

        conn.commit()
        print("✅ Migration completed successfully!")

    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
