-- =====================================================
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