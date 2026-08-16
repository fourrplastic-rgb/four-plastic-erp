import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'manufacturing.db')

tables_to_migrate = [
    'users', 'customers', 'vendors', 'banks', 'items', 'sales_invoice', 'sales_invoice_items',
    'purchase_invoice', 'purchase_invoice_items', 'delivery_challan', 'delivery_challan_items',
    'stock_transactions', 'customer_payments', 'vendor_payments', 'production_entries',
    'production_transfer', 'production_consumption', 'daily_production_summary', 'employees',
    'attendance', 'advances', 'advance_repayments', 'payouts', 'ledger_groups', 'ledgers',
    'journal_vouchers'
]

def migrate():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Create Companies Table
        print("Creating 'companies' table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            email TEXT,
            gst_no TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')

        # Backfill company data from company_settings if exists
        cursor.execute("SELECT COUNT(*) FROM companies WHERE id = 1")
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
            INSERT INTO companies (id, name, address, phone, email, gst_no)
            SELECT 1, company_name, address, phone, email, gst 
            FROM company_settings WHERE id = 1
            ''')
            print("Backfilled primary company settings to companies table.")
        
        # Add User_Companies Link Table for Roles
        print("Creating 'user_companies' relationship table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            company_id INTEGER NOT NULL,
            role TEXT DEFAULT 'operator',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
            UNIQUE(user_id, company_id)
        );
        ''')
        
        # Add all existing users to company 1
        cursor.execute('''
            INSERT OR IGNORE INTO user_companies (user_id, company_id, role)
            SELECT id, 1, role FROM users
        ''')

        # Iterate over all tables and add company_id
        for table in tables_to_migrate:
            try:
                # Check if column already exists via PRAGMA table_info
                cursor.execute(f"PRAGMA table_info({table})")
                columns = [info[1] for info in cursor.fetchall()]
                
                if 'company_id' not in columns:
                    print(f"Adding company_id to {table}...")
                    cursor.execute(f'''
                        ALTER TABLE {table} 
                        ADD COLUMN company_id INTEGER REFERENCES companies(id) DEFAULT 1
                    ''')
                else:
                    print(f"Table {table} already has company_id. Skipping.")
            except sqlite3.OperationalError as e:
                print(f"Skipped table {table}: {str(e)}")

        conn.commit()
        print("\n✅ Multi-Company Migration Completed Successfully!")
    
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration Failed: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
