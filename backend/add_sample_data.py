import sqlite3
import os
from datetime import datetime

print("=" * 60)
print("📊 Adding Sample Data to Database")
print("=" * 60)

# Database path
db_path = r"H:\NEW MFG\FOUR (R) PLASTIC\database\manufacturing.db"

# Check if database exists
if not os.path.exists(db_path):
    print(f"❌ Database not found at: {db_path}")
    exit(1)

print(f"📁 Database: {db_path}")

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("✅ Connected to database\n")

# ============================================
# CHECK EXISTING TABLES
# ============================================
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]
print(f"📋 Existing tables: {', '.join(tables)}\n")

# ============================================
# EMPLOYEES TABLE
# ============================================
print("-" * 40)
print("👥 EMPLOYEES")
print("-" * 40)

# Check if employees table exists
if 'employees' not in tables:
    print("❌ Employees table not found. Creating...")
    cursor.execute("""
        CREATE TABLE employees (
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
            uan_number TEXT,
            pan_number TEXT,
            aadhar_number TEXT,
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
        )
    """)
    print("✅ Employees table created")
else:
    print("✅ Employees table exists")

# Check existing employees
cursor.execute("SELECT COUNT(*) FROM employees")
emp_count = cursor.fetchone()[0]
print(f"📊 Found {emp_count} existing employees")

if emp_count == 0:
    print("📝 Adding sample employees...")
    
    # Insert sample employees
    cursor.execute("""
        INSERT INTO employees (
            employee_code, first_name, last_name, email, phone, 
            join_date, basic_salary, status, department, designation
        ) VALUES 
        ('EMP001', 'Rajesh', 'Kumar', 'rajesh.k@example.com', '9876543210', 
         '2024-01-15', 25000, 'active', 'Production', 'Senior Operator'),
        
        ('EMP002', 'Priya', 'Singh', 'priya.s@example.com', '9876543211', 
         '2024-02-01', 28000, 'active', 'Sales', 'Sales Executive'),
        
        ('EMP003', 'Amit', 'Sharma', 'amit.s@example.com', '9876543212', 
         '2024-01-20', 22000, 'active', 'Production', 'Operator'),
        
        ('EMP004', 'Sneha', 'Patel', 'sneha.p@example.com', '9876543213', 
         '2024-03-01', 30000, 'active', 'Accounts', 'Accountant'),
        
        ('EMP005', 'Vikram', 'Mehta', 'vikram.m@example.com', '9876543214', 
         '2024-02-15', 20000, 'active', 'Production', 'Trainee')
    """)
    
    emp_count = 5
    print(f"✅ Added {emp_count} sample employees")
else:
    print("✅ Employees already exist")

# ============================================
# ADVANCES TABLE
# ============================================
print("\n" + "-" * 40)
print("💰 ADVANCES")
print("-" * 40)

# Check if advances table exists
if 'advances' not in tables:
    print("❌ Advances table not found. Creating...")
    cursor.execute("""
        CREATE TABLE advances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            advance_no TEXT UNIQUE NOT NULL,
            employee_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            amount REAL NOT NULL,
            purpose TEXT,
            repayment_mode TEXT DEFAULT 'monthly',
            repayment_installments INTEGER DEFAULT 1,
            repaid_amount REAL DEFAULT 0,
            balance REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )
    """)
    print("✅ Advances table created")
else:
    print("✅ Advances table exists")

# Check existing advances
cursor.execute("SELECT COUNT(*) FROM advances")
adv_count = cursor.fetchone()[0]
print(f"📊 Found {adv_count} existing advances")

if adv_count == 0 and emp_count > 0:
    print("📝 Adding sample advances...")
    
    # Get employee IDs
    cursor.execute("SELECT id FROM employees ORDER BY id")
    employees = [row[0] for row in cursor.fetchall()]
    
    if len(employees) >= 3:
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Insert sample advances
        advances_data = [
            ('ADV000001', employees[0], '2024-03-01', 10000, 'Medical emergency', 
             'monthly', 5, 2000, 8000, 'pending', 'Hospital expenses', now, now),
            
            ('ADV000002', employees[1], '2024-03-05', 15000, 'Travel advance', 
             'monthly', 3, 0, 15000, 'pending', 'Client meeting travel', now, now),
            
            ('ADV000003', employees[0], '2024-02-15', 5000, 'Personal loan', 
             'monthly', 2, 2500, 2500, 'pending', 'Family function', now, now),
            
            ('ADV000004', employees[2], '2024-03-10', 8000, 'Education fees', 
             'monthly', 4, 2000, 6000, 'pending', 'Child school fees', now, now),
            
            ('ADV000005', employees[3] if len(employees) > 3 else employees[1], 
             '2024-03-15', 12000, 'Home renovation', 
             'monthly', 6, 0, 12000, 'pending', 'Kitchen renovation', now, now)
        ]
        
        for adv in advances_data:
            cursor.execute("""
                INSERT INTO advances (
                    advance_no, employee_id, date, amount, purpose, 
                    repayment_mode, repayment_installments, repaid_amount, balance, 
                    status, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, adv)
        
        print(f"✅ Added {len(advances_data)} sample advances")
    else:
        print("❌ Not enough employees found")
else:
    print("✅ Advances already exist")

# ============================================
# ATTENDANCE TABLE (optional)
# ============================================
print("\n" + "-" * 40)
print("⏰ ATTENDANCE")
print("-" * 40)

if 'attendance' not in tables:
    print("📝 Creating attendance table...")
    cursor.execute("""
        CREATE TABLE attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            check_in TEXT,
            check_out TEXT,
            hours REAL,
            status TEXT NOT NULL,
            overtime_hours REAL DEFAULT 0,
            notes TEXT,
            marked_by INTEGER,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            UNIQUE(employee_id, date)
        )
    """)
    print("✅ Attendance table created")

# Add some sample attendance if needed
cursor.execute("SELECT COUNT(*) FROM attendance")
att_count = cursor.fetchone()[0]
print(f"📊 Found {att_count} attendance records")

if att_count == 0 and emp_count > 0:
    print("📝 Adding sample attendance for March 2024...")
    
    cursor.execute("SELECT id FROM employees ORDER BY id")
    employees = [row[0] for row in cursor.fetchall()]
    
    import random
    dates = [f"2024-03-{d:02d}" for d in range(1, 11)]  # First 10 days of March
    
    for emp_id in employees[:3]:  # First 3 employees
        for date in dates:
            status = random.choice(['present', 'present', 'present', 'late', 'absent'])
            check_in = '09:00' if status == 'present' else '09:15' if status == 'late' else None
            check_out = '18:00' if status in ['present', 'late'] else None
            hours = 9.0 if check_in and check_out else None
            
            try:
                cursor.execute("""
                    INSERT INTO attendance 
                    (employee_id, date, check_in, check_out, hours, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (emp_id, date, check_in, check_out, hours, status, 
                      datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                      datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
            except:
                pass  # Skip if duplicate
    
    print("✅ Added sample attendance records")

# ============================================
# SUMMARY
# ============================================
print("\n" + "=" * 60)
print("📊 SAMPLE DATA SUMMARY")
print("=" * 60)

# Count final records
cursor.execute("SELECT COUNT(*) FROM employees")
final_emp = cursor.fetchone()[0]
print(f"👥 Employees: {final_emp}")

cursor.execute("SELECT COUNT(*) FROM advances")
final_adv = cursor.fetchone()[0]
print(f"💰 Advances: {final_adv}")

cursor.execute("SELECT COUNT(*) FROM attendance")
final_att = cursor.fetchone()[0]
print(f"⏰ Attendance: {final_att}")

# Commit changes
conn.commit()
conn.close()

print("\n" + "=" * 60)
print("✅ Sample data added successfully!")
print("=" * 60)
print("\nYou can now view the data at:")
print("📊 http://localhost:3000/payroll/employees")
print("💰 http://localhost:3000/payroll/advances")
print("⏰ http://localhost:3000/payroll/attendance")