import sqlite3

DB_PATH = '/Users/rajeshkumarvarma/Desktop/FOUR_ (R)_PLASTIC/database/manufacturing.db'

def run_migration():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Creating tax_records table...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tax_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            tax_category TEXT NOT NULL,
            tax_type TEXT,
            period_start DATE,
            period_end DATE,
            amount REAL DEFAULT 0,
            payment_date DATE,
            challan_no TEXT,
            bank_id INTEGER REFERENCES banks(id),
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    
    conn.commit()
    conn.close()
    print("Migration successful.")

if __name__ == "__main__":
    run_migration()
