import sqlite3
import os

print("=" * 60)
print("🚀 Adding Payroll Tables to Database")
print("=" * 60)

# Current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
print(f"📁 Current directory: {current_dir}")

# Look for database files in the current directory
db_files = []
for file in os.listdir(current_dir):
    if file.endswith('.db') or file.endswith('.sqlite') or file.endswith('.sqlite3'):
        db_files.append(file)

if db_files:
    print(f"\n📊 Found database files:")
    for i, file in enumerate(db_files):
        print(f"   {i+1}. {file}")
    
    # Use the first database file found
    db_path = os.path.join(current_dir, db_files[0])
    print(f"\n✅ Using: {db_path}")
else:
    # If no database found, check parent directories
    parent_dir = os.path.dirname(current_dir)
    print(f"\n🔍 No database found in current directory.")
    print(f"🔍 Checking parent directory: {parent_dir}")
    
    for file in os.listdir(parent_dir):
        if file.endswith('.db') or file.endswith('.sqlite') or file.endswith('.sqlite3'):
            db_files.append(file)
            db_path = os.path.join(parent_dir, file)
            print(f"✅ Found: {db_path}")
            break
    
    if not db_files:
        print("\n❌ No database file found anywhere!")
        print("\nPlease specify the database path manually.")
        db_path = input("Enter the full path to your database file: ").strip()
        if not os.path.exists(db_path):
            print(f"❌ Database not found at: {db_path}")
            exit(1)

# Check if database exists
if not os.path.exists(db_path):
    print(f"❌ Database not found at: {db_path}")
    exit(1)

print(f"\n📁 Using database: {db_path}")

# Read SQL file
sql_file = os.path.join(current_dir, 'add_payroll_tables.sql')
if not os.path.exists(sql_file):
    print(f"❌ SQL file not found at: {sql_file}")
    print("Creating SQL file...")
    
    # Create the SQL file if it doesn't exist
    sql_content = """-- =====================================================
-- FOUR® PLASTIC - Add Payroll Tables to SQLite Database
-- =====================================================

-- EMPLOYEES MASTER TABLE
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    marital_status TEXT,
    blood_group TEXT,
    department TEXT,
    designation TEXT,
    join_date DATE NOT NULL,
    confirmation_date DATE,
    exit_date DATE,
    status TEXT DEFAULT 'active',
    basic_salary REAL NOT NULL,
    hra REAL DEFAULT 0,
    conveyance REAL DEFAULT 0,
    medical REAL DEFAULT 0,
    special_allowance REAL DEFAULT 0,
    pf_number TEXT,
    esi_number TEXT,
    pan_number TEXT,
    aadhar_number TEXT,
    uan_number TEXT,
    bank_name TEXT,
    bank_account TEXT,
    ifsc_code TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    hours REAL,
    status TEXT NOT NULL,
    overtime_hours REAL DEFAULT 0,
    notes TEXT,
    marked_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
);

-- ADVANCES TABLE
CREATE TABLE IF NOT EXISTS advances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    advance_no TEXT UNIQUE NOT NULL,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    amount REAL NOT NULL,
    purpose TEXT,
    repayment_mode TEXT DEFAULT 'monthly',
    repayment_installments INTEGER DEFAULT 1,
    installment_amount REAL,
    repaid_amount REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ADVANCE REPAYMENTS TABLE
CREATE TABLE IF NOT EXISTS advance_repayments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    advance_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    repayment_date DATE NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT DEFAULT 'salary_deduction',
    reference_no TEXT,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (advance_id) REFERENCES advances(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payout_no TEXT UNIQUE NOT NULL,
    employee_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    payout_date DATE,
    basic_salary REAL NOT NULL,
    hra REAL DEFAULT 0,
    conveyance REAL DEFAULT 0,
    medical REAL DEFAULT 0,
    special_allowance REAL DEFAULT 0,
    overtime_amount REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    other_earnings REAL DEFAULT 0,
    total_earnings REAL DEFAULT 0,
    pf_deduction REAL DEFAULT 0,
    pt_deduction REAL DEFAULT 0,
    tax_deduction REAL DEFAULT 0,
    advance_deduction REAL DEFAULT 0,
    attendance_deduction REAL DEFAULT 0,
    other_deductions REAL DEFAULT 0,
    total_deductions REAL DEFAULT 0,
    net_salary REAL DEFAULT 0,
    payment_mode TEXT DEFAULT 'bank',
    bank_id INTEGER,
    transaction_ref TEXT,
    status TEXT DEFAULT 'pending',
    payment_date DATE,
    processed_by INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE(employee_id, month)
);

-- PAYSLIPS TABLE
CREATE TABLE IF NOT EXISTS payslips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payslip_no TEXT UNIQUE NOT NULL,
    payout_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    generated_date DATE NOT NULL,
    basic_salary REAL NOT NULL,
    hra REAL DEFAULT 0,
    conveyance REAL DEFAULT 0,
    medical REAL DEFAULT 0,
    special_allowance REAL DEFAULT 0,
    overtime_amount REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    other_earnings REAL DEFAULT 0,
    total_earnings REAL DEFAULT 0,
    pf_deduction REAL DEFAULT 0,
    pt_deduction REAL DEFAULT 0,
    tax_deduction REAL DEFAULT 0,
    advance_deduction REAL DEFAULT 0,
    attendance_deduction REAL DEFAULT 0,
    other_deductions REAL DEFAULT 0,
    total_deductions REAL DEFAULT 0,
    net_salary REAL DEFAULT 0,
    status TEXT DEFAULT 'generated',
    email_sent_date DATE,
    print_date DATE,
    pdf_path TEXT,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payout_id) REFERENCES payouts(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_advances_employee ON advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_advances_date ON advances(date);
CREATE INDEX IF NOT EXISTS idx_advances_status ON advances(status);
CREATE INDEX IF NOT EXISTS idx_payouts_employee_month ON payouts(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_payouts_month ON payouts(month);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_month ON payslips(employee_id, month);

SELECT '✅ Payroll tables created successfully!' as message;
"""
    
    with open(sql_file, 'w') as f:
        f.write(sql_content)
    print("✅ SQL file created successfully!")

print(f"\n📁 Reading SQL file: {sql_file}")

with open(sql_file, 'r') as f:
    sql_script = f.read()

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # Split the script into individual statements
    statements = sql_script.split(';')
    success_count = 0
    error_count = 0
    
    for i, statement in enumerate(statements):
        if statement.strip():
            try:
                cursor.execute(statement)
                success_count += 1
                print(f"✅ Executed statement {i+1}")
            except sqlite3.Error as e:
                error_count += 1
                print(f"⚠️  Statement {i+1} error: {e}")
    
    conn.commit()
    
    print("\n" + "=" * 60)
    print(f"📊 Summary:")
    print(f"   ✅ Successful: {success_count}")
    print(f"   ⚠️  Errors: {error_count}")
    print("=" * 60)
    
    # Verify tables were created
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN 
        ('employees', 'attendance', 'advances', 'advance_repayments', 'payouts', 'payslips')
    """)
    
    tables = cursor.fetchall()
    table_names = [table[0] for table in tables]
    
    print("\n📊 Created/Verified tables:")
    expected_tables = ['employees', 'attendance', 'advances', 'advance_repayments', 'payouts', 'payslips']
    
    for table in expected_tables:
        if table in table_names:
            print(f"   ✅ {table}")
        else:
            print(f"   ❌ {table}")
    
    if len(tables) == 6:
        print("\n✅ All payroll tables created successfully!")
    else:
        print(f"\n⚠️  Only {len(tables)} of 6 tables were created")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    conn.rollback()
finally:
    conn.close()
    print(f"\n📁 Database connection closed")