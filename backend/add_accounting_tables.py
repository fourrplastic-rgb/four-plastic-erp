import sqlite3
import os
from datetime import datetime

# Path relative to the backend folder
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "manufacturing.db")

def create_accounting_schema():
    print(f"📁 Connecting to database at {DB_PATH}...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 1. LEDGER GROUPS
        print("🔨 Creating ledger_groups table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ledger_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL, -- Asset, Liability, Equity, Income, Expense
            parent_id INTEGER,
            is_system INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES ledger_groups(id)
        );
        ''')

        # 2. LEDGERS (Chart of Accounts)
        print("🔨 Creating ledgers table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ledgers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            group_id INTEGER NOT NULL,
            opening_balance REAL DEFAULT 0,
            balance_type TEXT DEFAULT 'DR', -- DR or CR
            is_system INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES ledger_groups(id)
        );
        ''')

        # 3. JOURNAL VOUCHERS
        print("🔨 Creating journal_vouchers table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS journal_vouchers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voucher_no TEXT UNIQUE NOT NULL,
            voucher_date DATE NOT NULL,
            reference_no TEXT,
            notes TEXT,
            status TEXT DEFAULT 'posted',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')

        # 4. JOURNAL ENTRIES (Line Items)
        print("🔨 Creating journal_entries table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voucher_id INTEGER NOT NULL,
            ledger_id INTEGER NOT NULL,
            debit REAL DEFAULT 0,
            credit REAL DEFAULT 0,
            notes TEXT,
            FOREIGN KEY (voucher_id) REFERENCES journal_vouchers(id) ON DELETE CASCADE,
            FOREIGN KEY (ledger_id) REFERENCES ledgers(id)
        );
        ''')

        # --- SEED DEFAULT LEDGER GROUPS ---
        print("🌱 Seeding default ledger groups...")
        default_groups = [
            # Type: Asset
            ('Current Assets', 'Asset', 1),
            ('Bank Accounts', 'Asset', 1),
            ('Cash in Hand', 'Asset', 1),
            ('Sundry Debtors', 'Asset', 1),
            ('Fixed Assets', 'Asset', 1),
            
            # Type: Liability
            ('Current Liabilities', 'Liability', 1),
            ('Sundry Creditors', 'Liability', 1),
            ('Duties & Taxes', 'Liability', 1),
            ('Loans & Advances', 'Liability', 1),
            
            # Type: Equity
            ('Capital Account', 'Equity', 1),
            ('Retained Earnings', 'Equity', 1),
            
            # Type: Income
            ('Direct Income', 'Income', 1),
            ('Sales Accounts', 'Income', 1),
            ('Indirect Income', 'Income', 1),
            
            # Type: Expense
            ('Direct Expenses', 'Expense', 1),
            ('Purchase Accounts', 'Expense', 1),
            ('Indirect Expenses', 'Expense', 1),
            ('Salary / Payroll Expenses', 'Expense', 1)
        ]

        for name, gtype, is_sys in default_groups:
            try:
                cursor.execute('INSERT OR IGNORE INTO ledger_groups (name, type, is_system) VALUES (?, ?, ?)', (name, gtype, is_sys))
            except sqlite3.IntegrityError:
                pass

        # --- SEED DEFAULT LEDGERS ---
        print("🌱 Seeding default ledgers...")
        # Get IDs for linking
        cursor.execute("SELECT id, name FROM ledger_groups")
        groups = {name: gid for gid, name in cursor.fetchall()}

        default_ledgers = [
            ('Main Cash', groups.get('Cash in Hand'), 'DR'),
            ('Sales Account', groups.get('Sales Accounts'), 'CR'),
            ('Purchase Account', groups.get('Purchase Accounts'), 'DR'),
            ('CGST Payable', groups.get('Duties & Taxes'), 'CR'),
            ('SGST Payable', groups.get('Duties & Taxes'), 'CR'),
            ('IGST Payable', groups.get('Duties & Taxes'), 'CR'),
            ('Salary Expense', groups.get('Salary / Payroll Expenses'), 'DR'),
            ('Bank Charges', groups.get('Indirect Expenses'), 'DR'),
            ('Discount Given', groups.get('Indirect Expenses'), 'DR'),
            ('Discount Received', groups.get('Indirect Income'), 'CR'),
        ]

        for name, group_id, bal_type in default_ledgers:
            if group_id:
                try:
                    cursor.execute('INSERT OR IGNORE INTO ledgers (name, group_id, balance_type, is_system) VALUES (?, ?, ?, 1)', (name, group_id, bal_type))
                except sqlite3.IntegrityError:
                    pass

        conn.commit()
        print("✅ Accounting schema created successfully!")

    except Exception as e:
        print(f"❌ Error creating schema: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_accounting_schema()
