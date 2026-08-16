-- SQL statements to create tables in Supabase
-- Copy and paste this in Supabase SQL Editor

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    phone TEXT,
    is_active BIGINT,
    created_at TIMESTAMP,
    last_login TIMESTAMP,
    company_id BIGINT,
    auth_token TEXT
);

-- Table: company_settings
CREATE TABLE IF NOT EXISTS company_settings (
    id BIGINT PRIMARY KEY,
    company_name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    gst TEXT,
    pan TEXT,
    cin TEXT,
    state TEXT,
    state_code TEXT,
    logo_path TEXT,
    updated_at TIMESTAMP
);

-- Table: customers
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    gst TEXT,
    pan TEXT,
    contact_person TEXT,
    credit_limit REAL,
    credit_days BIGINT,
    opening_balance REAL,
    current_balance REAL,
    is_active BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    company_id BIGINT
);

-- Table: vendors
CREATE TABLE IF NOT EXISTS vendors (
    id BIGINT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    gst TEXT,
    pan TEXT,
    contact_person TEXT,
    opening_balance REAL,
    current_balance REAL,
    is_active BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    company_id BIGINT
);

-- Table: banks
CREATE TABLE IF NOT EXISTS banks (
    id BIGINT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    account_no TEXT,
    ifsc_code TEXT,
    branch TEXT,
    opening_balance REAL,
    current_balance REAL,
    is_active BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    company_id BIGINT
);

-- Table: raw_materials
CREATE TABLE IF NOT EXISTS raw_materials (
    id BIGINT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    hsn_code TEXT,
    gst_rate REAL,
    purchase_rate REAL,
    opening_stock REAL,
    current_stock REAL,
    min_stock REAL,
    max_stock REAL,
    location TEXT,
    is_active BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Table: finished_goods
CREATE TABLE IF NOT EXISTS finished_goods (
    id BIGINT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    hsn_code TEXT,
    gst_rate REAL,
    sales_rate REAL,
    mrp REAL,
    opening_stock REAL,
    current_stock REAL,
    min_stock REAL,
    max_stock REAL,
    location TEXT,
    is_active BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Table: sales_invoice
CREATE TABLE IF NOT EXISTS sales_invoice (
    id BIGINT PRIMARY KEY,
    invoice_no TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    customer_id BIGINT NOT NULL,
    subtotal REAL,
    discount REAL,
    taxable_amount REAL,
    cgst_rate REAL,
    sgst_rate REAL,
    igst_rate REAL,
    cgst_amount REAL,
    sgst_amount REAL,
    igst_amount REAL,
    gst_total REAL,
    grand_total REAL,
    paid_amount REAL,
    balance REAL,
    payment_status TEXT,
    payment_type TEXT,
    bank_id BIGINT,
    notes TEXT,
    place_of_supply TEXT,
    transport_mode TEXT,
    vehicle_no TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    cgst_total REAL,
    sgst_total REAL,
    igst_total REAL,
    bill_to_address TEXT,
    bill_to_city TEXT,
    bill_to_state TEXT,
    bill_to_pincode TEXT,
    bill_to_gst TEXT,
    ship_to_address TEXT,
    ship_to_city TEXT,
    ship_to_state TEXT,
    ship_to_pincode TEXT,
    ship_to_gst TEXT,
    challan_no TEXT,
    tax_type TEXT,
    company_id BIGINT,
    attachment_path TEXT
);

-- Table: stock_transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
    id BIGINT PRIMARY KEY,
    transaction_date TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id BIGINT NOT NULL,
    transaction_type TEXT NOT NULL,
    reference_no TEXT,
    quantity_in REAL,
    quantity_out REAL,
    balance REAL NOT NULL,
    rate REAL,
    value REAL,
    notes TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    company_id BIGINT
);

-- Table: sales_invoice_items
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id BIGINT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    item_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    discount REAL,
    taxable_value REAL NOT NULL,
    cgst_rate REAL,
    sgst_rate REAL,
    igst_rate REAL,
    cgst_amount REAL,
    sgst_amount REAL,
    igst_amount REAL,
    total REAL NOT NULL,
    gst_rate REAL,
    company_id BIGINT
);

-- Table: customer_payments
CREATE TABLE IF NOT EXISTS customer_payments (
    id BIGINT PRIMARY KEY,
    receipt_no TEXT NOT NULL,
    customer_id BIGINT NOT NULL,
    payment_date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT NOT NULL,
    reference_no TEXT,
    bank_id BIGINT,
    notes TEXT,
    status TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    company_id BIGINT,
    cheque_image_path TEXT,
    invoice_id BIGINT
);

-- Table: vendor_payments
CREATE TABLE IF NOT EXISTS vendor_payments (
    id BIGINT PRIMARY KEY,
    payment_no TEXT NOT NULL,
    vendor_id BIGINT NOT NULL,
    payment_date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT NOT NULL,
    reference_no TEXT,
    bank_id BIGINT,
    notes TEXT,
    status TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    company_id BIGINT,
    cheque_image_path TEXT,
    invoice_id BIGINT
);

-- Table: delivery_challan_items
CREATE TABLE IF NOT EXISTS delivery_challan_items (
    id BIGINT PRIMARY KEY,
    challan_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    item_type TEXT NOT NULL,
    item_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL,
    amount REAL,
    notes TEXT,
    company_id BIGINT
);

-- Table: employees
CREATE TABLE IF NOT EXISTS employees (
    id BIGINT PRIMARY KEY,
    employee_code TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    date_of_birth TEXT,
    gender TEXT,
    marital_status TEXT,
    blood_group TEXT,
    department TEXT,
    designation TEXT,
    join_date TEXT NOT NULL,
    confirmation_date TEXT,
    exit_date TEXT,
    status TEXT,
    basic_salary REAL NOT NULL,
    hra REAL,
    conveyance REAL,
    medical REAL,
    special_allowance REAL,
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
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    company_id BIGINT
);

-- Table: advances
CREATE TABLE IF NOT EXISTS advances (
    id BIGINT PRIMARY KEY,
    advance_no TEXT NOT NULL,
    employee_id BIGINT NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    purpose TEXT,
    repayment_mode TEXT,
    repayment_installments BIGINT,
    repaid_amount REAL,
    balance REAL,
    status TEXT,
    notes TEXT,
    created_at TEXT,
    updated_at TEXT,
    company_id BIGINT
);

-- Table: attendance
CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    hours REAL,
    status TEXT NOT NULL,
    overtime_hours REAL,
    notes TEXT,
    marked_by BIGINT,
    created_at TEXT,
    updated_at TEXT,
    company_id BIGINT
);

-- Table: advance_repayments
CREATE TABLE IF NOT EXISTS advance_repayments (
    id BIGINT PRIMARY KEY,
    advance_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    repayment_date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT,
    reference_no TEXT,
    notes TEXT,
    created_at TEXT,
    company_id BIGINT
);

-- Table: payouts
CREATE TABLE IF NOT EXISTS payouts (
    id BIGINT PRIMARY KEY,
    payout_no TEXT NOT NULL,
    employee_id BIGINT NOT NULL,
    month TEXT NOT NULL,
    basic_salary REAL NOT NULL,
    hra REAL,
    conveyance REAL,
    medical REAL,
    special_allowance REAL,
    total_earnings REAL,
    pf_deduction REAL,
    pt_deduction REAL,
    tax_deduction REAL,
    advance_deduction REAL,
    total_deductions REAL,
    net_salary REAL,
    status TEXT,
    created_at TEXT,
    updated_at TEXT,
    company_id BIGINT
);

-- Table: production_entries
CREATE TABLE IF NOT EXISTS production_entries (
    id BIGINT PRIMARY KEY,
    production_date TEXT NOT NULL,
    finished_good_id BIGINT NOT NULL,
    quantity_produced REAL NOT NULL,
    batch_number TEXT,
    notes TEXT,
    status TEXT,
    created_at TIMESTAMP,
    shift TEXT,
    good_quantity REAL,
    rejected_quantity REAL,
    rejection_reason TEXT,
    batch_no TEXT,
    machine_no TEXT,
    operator_name TEXT,
    supervisor_name TEXT,
    start_time TEXT,
    end_time TEXT,
    production_no TEXT,
    updated_at TIMESTAMP,
    company_id BIGINT,
    cost_center_id BIGINT,
    total_material_cost REAL,
    total_overhead_cost REAL,
    actual_cost REAL,
    per_unit_cost REAL,
    cost_center_name TEXT,
    overhead_hourly_rate REAL
);

-- Table: production_consumption
CREATE TABLE IF NOT EXISTS production_consumption (
    id BIGINT PRIMARY KEY,
    production_entry_id BIGINT NOT NULL,
    raw_material_id BIGINT NOT NULL,
    quantity_used REAL NOT NULL,
    notes TEXT,
    production_id BIGINT,
    batch_no TEXT,
    created_at TIMESTAMP,
    company_id BIGINT,
    rate REAL,
    total_cost REAL
);

-- Table: gst_rates
CREATE TABLE IF NOT EXISTS gst_rates (
    id BIGINT PRIMARY KEY,
    rate TEXT NOT NULL,
    description TEXT,
    cgst_rate TEXT,
    sgst_rate TEXT,
    igst_rate TEXT,
    is_active TEXT,
    created_at TEXT
);

-- Table: purchase_invoice_tax_summary
CREATE TABLE IF NOT EXISTS purchase_invoice_tax_summary (
    id BIGINT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    gst_rate TEXT NOT NULL,
    taxable_value TEXT,
    cgst_amount TEXT,
    sgst_amount TEXT,
    igst_amount TEXT,
    total_tax TEXT
);

-- Table: sales_invoice_tax_summary
CREATE TABLE IF NOT EXISTS sales_invoice_tax_summary (
    id BIGINT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    gst_rate TEXT NOT NULL,
    taxable_value TEXT,
    cgst_amount TEXT,
    sgst_amount TEXT,
    igst_amount TEXT,
    total_tax TEXT
);

-- Table: daily_production_summary
CREATE TABLE IF NOT EXISTS daily_production_summary (
    id BIGINT PRIMARY KEY,
    production_date TEXT NOT NULL,
    total_entries BIGINT,
    total_items_produced BIGINT,
    total_rejected BIGINT,
    total_raw_material_used REAL,
    created_at TIMESTAMP,
    company_id BIGINT
);

-- Table: production_transfer
CREATE TABLE IF NOT EXISTS production_transfer (
    id BIGINT PRIMARY KEY,
    production_entry_id BIGINT NOT NULL,
    transfer_date TEXT NOT NULL,
    finished_good_id BIGINT NOT NULL,
    quantity_transferred REAL NOT NULL,
    batch_no TEXT,
    location TEXT,
    reference_no TEXT,
    status TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    company_id BIGINT
);

-- Table: purchase_invoice_items
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
    id BIGINT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    item_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    discount REAL,
    taxable_value REAL NOT NULL,
    cgst_rate REAL,
    sgst_rate REAL,
    igst_rate REAL,
    cgst_amount REAL,
    sgst_amount REAL,
    igst_amount REAL,
    total REAL NOT NULL,
    company_id BIGINT,
    lot_no TEXT,
    received_quantity REAL
);

-- Table: ledger_groups
CREATE TABLE IF NOT EXISTS ledger_groups (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    parent_id BIGINT,
    is_system BIGINT,
    created_at TIMESTAMP,
    company_id BIGINT
);

-- Table: ledgers
CREATE TABLE IF NOT EXISTS ledgers (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    group_id BIGINT NOT NULL,
    opening_balance REAL,
    balance_type TEXT,
    is_system BIGINT,
    created_at TIMESTAMP,
    company_id BIGINT
);

-- Table: journal_vouchers
CREATE TABLE IF NOT EXISTS journal_vouchers (
    id BIGINT PRIMARY KEY,
    voucher_no TEXT NOT NULL,
    voucher_date TEXT NOT NULL,
    reference_no TEXT,
    notes TEXT,
    status TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    company_id BIGINT
);

-- Table: journal_entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGINT PRIMARY KEY,
    voucher_id BIGINT NOT NULL,
    ledger_id BIGINT NOT NULL,
    debit REAL,
    credit REAL,
    notes TEXT,
    party_type TEXT,
    party_id BIGINT
);

-- Table: companies
CREATE TABLE IF NOT EXISTS companies (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    gst_no TEXT,
    is_active BIGINT,
    created_at TIMESTAMP
);

-- Table: user_companies
CREATE TABLE IF NOT EXISTS user_companies (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    role TEXT
);

-- Table: items_new
CREATE TABLE IF NOT EXISTS items_new (
    id BIGINT PRIMARY KEY,
    type TEXT,
    code TEXT,
    name TEXT,
    unit TEXT,
    hsn_code TEXT,
    gst_rate REAL,
    rate REAL,
    opening_stock REAL,
    current_stock REAL,
    location TEXT,
    is_active BIGINT
);

-- Table: delivery_challan
CREATE TABLE IF NOT EXISTS delivery_challan (
    id BIGINT PRIMARY KEY,
    challan_no TEXT NOT NULL,
    challan_date TEXT NOT NULL,
    customer_id BIGINT NOT NULL,
    bill_to_address TEXT,
    bill_to_city TEXT,
    bill_to_state TEXT,
    bill_to_pincode TEXT,
    bill_to_gst TEXT,
    ship_to_address TEXT,
    ship_to_city TEXT,
    ship_to_state TEXT,
    ship_to_pincode TEXT,
    ship_to_gst TEXT,
    transporter_name TEXT,
    transporter_phone TEXT,
    lr_no TEXT,
    lr_date TEXT,
    no_of_packages BIGINT,
    weight REAL,
    freight_charges REAL,
    payment_terms TEXT,
    reference_no TEXT,
    vehicle_no TEXT,
    transport_mode TEXT,
    place_of_delivery TEXT,
    date_of_shipment TEXT,
    notes TEXT,
    status TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    challan_type TEXT
);

-- Table: financial_years
CREATE TABLE IF NOT EXISTS financial_years (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active BIGINT,
    created_at TIMESTAMP
);

-- Table: lot_payments
CREATE TABLE IF NOT EXISTS lot_payments (
    id BIGINT PRIMARY KEY,
    lot_id BIGINT NOT NULL,
    payment_date TEXT NOT NULL,
    amount REAL NOT NULL,
    reference_no TEXT,
    created_at TIMESTAMP
);

-- Table: standalone_lots
CREATE TABLE IF NOT EXISTS standalone_lots (
    id BIGINT PRIMARY KEY,
    date TEXT NOT NULL,
    vendor_id BIGINT,
    vendor_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    lot_no TEXT,
    billed_qty REAL,
    received_qty REAL,
    rate REAL,
    billed_amount REAL,
    received_amount REAL,
    shortage_surplus_qty REAL,
    financial_diff REAL,
    paid_amount REAL,
    status TEXT,
    created_at TIMESTAMP
);

-- Table: standalone_lot_payments
CREATE TABLE IF NOT EXISTS standalone_lot_payments (
    id BIGINT PRIMARY KEY,
    lot_id BIGINT NOT NULL,
    payment_date TEXT NOT NULL,
    amount REAL NOT NULL,
    reference_no TEXT,
    created_at TIMESTAMP
);

-- Table: standalone_lot_receipts
CREATE TABLE IF NOT EXISTS standalone_lot_receipts (
    id BIGINT PRIMARY KEY,
    lot_id BIGINT NOT NULL,
    receipt_date TEXT NOT NULL,
    quantity REAL NOT NULL,
    reference_no TEXT,
    created_at TIMESTAMP
);

-- Table: stock_adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id BIGINT PRIMARY KEY,
    adjustment_no TEXT NOT NULL,
    adjustment_date TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id BIGINT NOT NULL,
    adjustment_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL,
    reason TEXT,
    voucher_id BIGINT,
    created_at TIMESTAMP
);

-- Table: cost_centers
CREATE TABLE IF NOT EXISTS cost_centers (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    hourly_rate REAL,
    is_active BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Table: tax_records
CREATE TABLE IF NOT EXISTS tax_records (
    id BIGINT PRIMARY KEY,
    company_id BIGINT,
    tax_category TEXT NOT NULL,
    tax_type TEXT,
    period_start TEXT,
    period_end TEXT,
    amount REAL,
    payment_date TEXT,
    challan_no TEXT,
    bank_id BIGINT,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMP
);

-- Table: purchase_invoice
CREATE TABLE IF NOT EXISTS purchase_invoice (
    id BIGINT PRIMARY KEY,
    invoice_no TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    vendor_id BIGINT NOT NULL,
    subtotal REAL,
    discount REAL,
    taxable_amount REAL,
    cgst_rate REAL,
    sgst_rate REAL,
    igst_rate REAL,
    cgst_amount REAL,
    sgst_amount REAL,
    igst_amount REAL,
    gst_total REAL,
    grand_total REAL,
    paid_amount REAL,
    balance REAL,
    payment_status TEXT,
    payment_type TEXT,
    bank_id BIGINT,
    notes TEXT,
    place_of_supply TEXT,
    created_by BIGINT,
    created_at TIMESTAMP,
    bill_to_address TEXT,
    bill_to_city TEXT,
    bill_to_state TEXT,
    bill_to_pincode TEXT,
    bill_to_gst TEXT,
    ship_to_address TEXT,
    ship_to_city TEXT,
    ship_to_state TEXT,
    ship_to_pincode TEXT,
    ship_to_gst TEXT,
    transport_mode TEXT,
    vehicle_no TEXT,
    cgst_total REAL,
    sgst_total REAL,
    igst_total REAL,
    company_id BIGINT,
    attachment_path TEXT
);

