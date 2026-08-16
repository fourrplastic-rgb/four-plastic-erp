import sqlite3
import os
from datetime import datetime

print("=" * 60)
print("🔧 DATABASE FIX TOOL")
print("=" * 60)

# Database path
db_path = r"H:\NEW MFG\FOUR (R) PLASTIC\database\manufacturing.db"

# Check if database exists
if not os.path.exists(db_path):
    print(f"❌ Database not found at: {db_path}")
    exit(1)

print(f"✅ Database found at: {db_path}")

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("\n📊 CHECKING TABLES...")
print("-" * 40)

# Check if payouts table exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='payouts'")
if cursor.fetchone():
    print("✅ Payouts table exists")
else:
    print("❌ Payouts table does not exist - creating it...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payout_no TEXT UNIQUE NOT NULL,
            employee_id INTEGER NOT NULL,
            month TEXT NOT NULL,
            basic_salary REAL NOT NULL,
            hra REAL DEFAULT 0,
            conveyance REAL DEFAULT 0,
            medical REAL DEFAULT 0,
            special_allowance REAL DEFAULT 0,
            total_earnings REAL DEFAULT 0,
            pf_deduction REAL DEFAULT 0,
            pt_deduction REAL DEFAULT 0,
            tax_deduction REAL DEFAULT 0,
            advance_deduction REAL DEFAULT 0,
            total_deductions REAL DEFAULT 0,
            net_salary REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
    """)
    print("✅ Payouts table created")

# Check if there are employees
cursor.execute("SELECT COUNT(*) as count FROM employees")
emp_count = cursor.fetchone()[0]
print(f"👥 Found {emp_count} employees")

if emp_count == 0:
    print("❌ No employees found! Adding sample employees...")
    cursor.execute("""
        INSERT INTO employees (
            employee_code, first_name, last_name, email, phone, 
            join_date, basic_salary, status
        ) VALUES 
        ('EMP001', 'Rajesh', 'Kumar', 'rajesh@example.com', '9876543210', 
         '2024-01-15', 25000, 'active'),
        ('EMP002', 'Priya', 'Singh', 'priya@example.com', '9876543211', 
         '2024-02-01', 28000, 'active'),
        ('EMP003', 'Amit', 'Sharma', 'amit@example.com', '9876543212', 
         '2024-01-20', 22000, 'active'),
        ('EMP004', 'Sneha', 'Patel', 'sneha@example.com', '9876543213', 
         '2024-03-01', 30000, 'active'),
        ('EMP005', 'Vikram', 'Mehta', 'vikram@example.com', '9876543214', 
         '2024-02-15', 20000, 'active')
    """)
    emp_count = 5
    print(f"✅ Added {emp_count} sample employees")

# Check if there are payouts
cursor.execute("SELECT COUNT(*) as count FROM payouts")
payout_count = cursor.fetchone()[0]
print(f"💰 Found {payout_count} payouts")

if payout_count == 0 and emp_count > 0:
    print("📝 Adding sample payouts...")
    
    # Get employee IDs
    cursor.execute("SELECT id FROM employees ORDER BY id")
    employees = [row[0] for row in cursor.fetchall()]
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Sample payouts data
    payouts_data = [
        ('POUT000001', employees[0], '2026-03', 25000, 12500, 2000, 1250, 3000,
         43750, 3000, 200, 1000, 2000, 6200, 37550, 'pending', now, now),
        
        ('POUT000002', employees[1], '2026-03', 28000, 14000, 2000, 1250, 4000,
         49250, 3360, 200, 1200, 0, 4760, 44490, 'pending', now, now),
        
        ('POUT000003', employees[2], '2026-03', 22000, 11000, 2000, 1250, 2500,
         38750, 2640, 200, 800, 1500, 5140, 33610, 'paid', now, now),
        
        ('POUT000004', employees[3] if len(employees) > 3 else employees[0], '2026-03', 
         30000, 15000, 2000, 1250, 5000, 53250, 3600, 200, 1500, 0, 5300, 47950, 'paid', now, now),
        
        ('POUT000005', employees[4] if len(employees) > 4 else employees[1], '2026-03',
         20000, 10000, 2000, 1250, 2000, 35250, 2400, 200, 600, 2500, 5700, 29550, 'pending', now, now)
    ]
    
    for payout in payouts_data:
        cursor.execute("""
            INSERT INTO payouts (
                payout_no, employee_id, month, basic_salary, hra, conveyance,
                medical, special_allowance, total_earnings, pf_deduction,
                pt_deduction, tax_deduction, advance_deduction, total_deductions,
                net_salary, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, payout)
    
    print(f"✅ Added {len(payouts_data)} sample payouts")

# Check advances and repayments
cursor.execute("SELECT COUNT(*) FROM advances")
adv_count = cursor.fetchone()[0]
print(f"📊 Found {adv_count} advances")

if adv_count > 0:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='advance_repayments'")
    if not cursor.fetchone():
        print("📝 Creating advance_repayments table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS advance_repayments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                advance_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                repayment_date TEXT NOT NULL,
                amount REAL NOT NULL,
                payment_mode TEXT DEFAULT 'cash',
                reference_no TEXT,
                notes TEXT,
                created_at TEXT,
                FOREIGN KEY (advance_id) REFERENCES advances(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            )
        """)
        print("✅ Advance repayments table created")

# Commit changes
conn.commit()

print("\n" + "=" * 60)
print("📊 FINAL COUNTS:")
print("-" * 40)

cursor.execute("SELECT COUNT(*) FROM employees")
print(f"👥 Employees: {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM payouts")
print(f"💰 Payouts: {cursor.fetchone()[0]}")

cursor.execute("SELECT COUNT(*) FROM advances")
print(f"📊 Advances: {cursor.fetchone()[0]}")

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='advance_repayments'")
if cursor.fetchone():
    cursor.execute("SELECT COUNT(*) FROM advance_repayments")
    print(f"💳 Repayments: {cursor.fetchone()[0]}")

conn.close()

print("\n" + "=" * 60)
print("✅ DATABASE FIX COMPLETE!")
print("=" * 60)
print("\nNow restart your Flask backend:")
print("cd H:\\NEW MFG\\FOUR (R) PLASTIC\\backend")
print("python app.py")
print("\nThen refresh your browser at:")
print("📊 http://localhost:3000/payroll/advances")
print("💰 http://localhost:3000/payroll/surplus")