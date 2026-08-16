import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

# Your complete schema from above
schema_sql = """
-- =====================================================
-- FOUR® PLASTIC - Complete Database Schema
-- All tables linked with foreign keys including Production Module
-- =====================================================

PRAGMA foreign_keys = ON;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'operator',
    email TEXT,
    phone TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ==================== COMPANY SETTINGS ====================
CREATE TABLE IF NOT EXISTS company_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT DEFAULT 'FOUR® PLASTIC',
    address TEXT,
    phone TEXT,
    email TEXT,
    gst TEXT,
    pan TEXT,
    cin TEXT,
    state TEXT,
    state_code TEXT,
    logo_path TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CUSTOMER MASTER ====================
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
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
    credit_limit REAL DEFAULT 0,
    credit_days INTEGER DEFAULT 30,
    opening_balance REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== VENDOR MASTER ====================
CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
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
    opening_balance REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== BANK MASTER ====================
CREATE TABLE IF NOT EXISTS banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    account_no TEXT,
    ifsc_code TEXT,
    branch TEXT,
    opening_balance REAL DEFAULT 0,
    current_balance REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== RAW MATERIALS ====================
CREATE TABLE IF NOT EXISTS raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Raw Material',
    unit TEXT,
    hsn_code TEXT,
    gst_rate REAL DEFAULT 18,
    purchase_rate REAL DEFAULT 0,
    opening_stock REAL DEFAULT 0,
    current_stock REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    max_stock REAL DEFAULT 0,
    location TEXT,
    is_active INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== FINISHED GOODS ====================
CREATE TABLE IF NOT EXISTS finished_goods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Finished Good',
    unit TEXT,
    hsn_code TEXT,
    gst_rate REAL DEFAULT 18,
    sales_rate REAL DEFAULT 0,
    mrp REAL DEFAULT 0,
    opening_stock REAL DEFAULT 0,
    current_stock REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    max_stock REAL DEFAULT 0,
    location TEXT,
    is_active INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== DELIVERY CHALLAN ====================
CREATE TABLE IF NOT EXISTS delivery_challan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challan_no TEXT UNIQUE NOT NULL,
    challan_date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    
    -- Bill To Address (Your Company)
    bill_to_address TEXT,
    bill_to_city TEXT,
    bill_to_state TEXT,
    bill_to_pincode TEXT,
    bill_to_gst TEXT,
    
    -- Ship To Address (Customer)
    ship_to_address TEXT,
    ship_to_city TEXT,
    ship_to_state TEXT,
    ship_to_pincode TEXT,
    ship_to_gst TEXT,
    
    -- Transporter Details
    transporter_name TEXT,
    transporter_phone TEXT,
    lr_no TEXT,
    lr_date DATE,
    
    -- Package Details
    no_of_packages INTEGER DEFAULT 0,
    weight REAL DEFAULT 0,
    freight_charges REAL DEFAULT 0,
    payment_terms TEXT,
    
    -- Transport Details
    reference_no TEXT,
    vehicle_no TEXT,
    transport_mode TEXT,
    place_of_delivery TEXT,
    date_of_shipment DATE,
    
    -- Other
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== DELIVERY CHALLAN ITEMS ====================
CREATE TABLE IF NOT EXISTS delivery_challan_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challan_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL,
    notes TEXT,
    FOREIGN KEY (challan_id) REFERENCES delivery_challan(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES finished_goods(id)
);

-- ==================== SALES INVOICE (GST Format) ====================
CREATE TABLE IF NOT EXISTS sales_invoice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    challan_no TEXT,
    
    -- Bill To Address
    bill_to_address TEXT,
    bill_to_city TEXT,
    bill_to_state TEXT,
    bill_to_pincode TEXT,
    bill_to_gst TEXT,
    
    -- Ship To Address
    ship_to_address TEXT,
    ship_to_city TEXT,
    ship_to_state TEXT,
    ship_to_pincode TEXT,
    ship_to_gst TEXT,
    
    -- Invoice Details
    subtotal REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    taxable_amount REAL DEFAULT 0,
    
    -- GST Details
    cgst_total REAL DEFAULT 0,
    sgst_total REAL DEFAULT 0,
    igst_total REAL DEFAULT 0,
    gst_total REAL DEFAULT 0,
    
    -- Total
    grand_total REAL DEFAULT 0,
    
    -- Payment
    paid_amount REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    payment_type TEXT DEFAULT 'cash',
    bank_id INTEGER,
    
    -- Transport Details
    place_of_supply TEXT,
    transport_mode TEXT,
    vehicle_no TEXT,
    
    -- Other
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== SALES INVOICE ITEMS ====================
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    discount REAL DEFAULT 0,
    taxable_value REAL NOT NULL,
    
    -- GST per item
    cgst_rate REAL DEFAULT 9,
    sgst_rate REAL DEFAULT 9,
    igst_rate REAL DEFAULT 0,
    cgst_amount REAL DEFAULT 0,
    sgst_amount REAL DEFAULT 0,
    igst_amount REAL DEFAULT 0,
    
    total REAL NOT NULL,
    
    FOREIGN KEY (invoice_id) REFERENCES sales_invoice(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES finished_goods(id)
);

-- ==================== PURCHASE INVOICE (GST Format) ====================
CREATE TABLE IF NOT EXISTS purchase_invoice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    vendor_id INTEGER NOT NULL,
    
    -- Bill To
    bill_to_address TEXT,
    bill_to_city TEXT,
    bill_to_state TEXT,
    bill_to_pincode TEXT,
    bill_to_gst TEXT,
    
    -- Ship To
    ship_to_address TEXT,
    ship_to_city TEXT,
    ship_to_state TEXT,
    ship_to_pincode TEXT,
    ship_to_gst TEXT,
    
    -- Invoice Details
    subtotal REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    taxable_amount REAL DEFAULT 0,
    
    -- GST Details
    cgst_total REAL DEFAULT 0,
    sgst_total REAL DEFAULT 0,
    igst_total REAL DEFAULT 0,
    gst_total REAL DEFAULT 0,
    
    -- Total
    grand_total REAL DEFAULT 0,
    
    -- Payment
    paid_amount REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    payment_type TEXT DEFAULT 'cash',
    bank_id INTEGER,
    
    -- Other
    notes TEXT,
    place_of_supply TEXT,
    transport_mode TEXT,
    vehicle_no TEXT,
    
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== PURCHASE INVOICE ITEMS ====================
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    discount REAL DEFAULT 0,
    taxable_value REAL NOT NULL,
    
    -- GST per item
    cgst_rate REAL DEFAULT 9,
    sgst_rate REAL DEFAULT 9,
    igst_rate REAL DEFAULT 0,
    cgst_amount REAL DEFAULT 0,
    sgst_amount REAL DEFAULT 0,
    igst_amount REAL DEFAULT 0,
    
    total REAL NOT NULL,
    
    FOREIGN KEY (invoice_id) REFERENCES purchase_invoice(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES raw_materials(id)
);

-- ==================== CUSTOMER PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS customer_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT NOT NULL,
    reference_no TEXT,
    bank_id INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== VENDOR PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS vendor_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_no TEXT UNIQUE NOT NULL,
    vendor_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT NOT NULL,
    reference_no TEXT,
    bank_id INTEGER,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== STOCK TRANSACTIONS ====================
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_date DATE NOT NULL,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    reference_no TEXT,
    quantity_in REAL DEFAULT 0,
    quantity_out REAL DEFAULT 0,
    balance REAL NOT NULL,
    rate REAL,
    value REAL,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PRODUCTION MODULE ====================

-- PRODUCTION ENTRIES (Day-wise production)
CREATE TABLE IF NOT EXISTS production_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_no TEXT UNIQUE NOT NULL,
    production_date DATE NOT NULL,
    shift TEXT,
    finished_good_id INTEGER NOT NULL,
    quantity_produced REAL NOT NULL,
    batch_no TEXT,
    machine_no TEXT,
    operator_id INTEGER,
    supervisor_id INTEGER,
    good_quantity REAL,
    rejected_quantity REAL DEFAULT 0,
    rejection_reason TEXT,
    start_time TIME,
    end_time TIME,
    total_hours REAL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (finished_good_id) REFERENCES finished_goods(id),
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- PRODUCTION RAW MATERIAL CONSUMPTION
CREATE TABLE IF NOT EXISTS production_consumption (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_entry_id INTEGER NOT NULL,
    raw_material_id INTEGER NOT NULL,
    quantity_used REAL NOT NULL,
    uom TEXT,
    batch_no TEXT,
    rate REAL,
    total_cost REAL,
    notes TEXT,
    FOREIGN KEY (production_entry_id) REFERENCES production_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);

-- DAILY PRODUCTION SUMMARY
CREATE TABLE IF NOT EXISTS daily_production_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_date DATE UNIQUE NOT NULL,
    total_entries INTEGER DEFAULT 0,
    total_items_produced INTEGER DEFAULT 0,
    total_rejected INTEGER DEFAULT 0,
    total_raw_material_used REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTION TRANSFER TO STOCK
CREATE TABLE IF NOT EXISTS production_transfer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_entry_id INTEGER NOT NULL,
    transfer_date DATE NOT NULL,
    finished_good_id INTEGER NOT NULL,
    quantity_transferred REAL NOT NULL,
    batch_no TEXT,
    location TEXT,
    reference_no TEXT,
    status TEXT DEFAULT 'pending',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (production_entry_id) REFERENCES production_entries(id),
    FOREIGN KEY (finished_good_id) REFERENCES finished_goods(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_vendors_code ON vendors(code);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON raw_materials(code);
CREATE INDEX IF NOT EXISTS idx_finished_goods_code ON finished_goods(code);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_no ON sales_invoice(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_date ON sales_invoice(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_customer ON sales_invoice(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_no ON purchase_invoice(invoice_no);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_date ON purchase_invoice(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_vendor ON purchase_invoice(vendor_id);
CREATE INDEX IF NOT EXISTS idx_delivery_challan_no ON delivery_challan(challan_no);
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_date ON customer_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_date ON vendor_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_delivery_challan_lr_no ON delivery_challan(lr_no);
CREATE INDEX IF NOT EXISTS idx_delivery_challan_status ON delivery_challan(status);
CREATE INDEX IF NOT EXISTS idx_production_entries_date ON production_entries(production_date);
CREATE INDEX IF NOT EXISTS idx_production_entries_fg ON production_entries(finished_good_id);
CREATE INDEX IF NOT EXISTS idx_production_entries_status ON production_entries(status);
CREATE INDEX IF NOT EXISTS idx_production_consumption_entry ON production_consumption(production_entry_id);
CREATE INDEX IF NOT EXISTS idx_production_consumption_rm ON production_consumption(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_production_summary(production_date);
CREATE INDEX IF NOT EXISTS idx_production_transfer_entry ON production_transfer(production_entry_id);
CREATE INDEX IF NOT EXISTS idx_production_transfer_fg ON production_transfer(finished_good_id);

-- ==================== DEFAULT DATA ====================

-- Users
INSERT OR IGNORE INTO users (id, username, password, full_name, role) 
VALUES (1, 'admin', 'admin123', 'Administrator', 'admin');

-- Company Settings
INSERT OR IGNORE INTO company_settings (id, company_name, address, gst, pan, state, state_code) 
VALUES (1, 'FOUR® PLASTIC', '90 FEET ROAD, WIRE GALI, KHADI NO.3, ANISH COMPOUND, SAKINAKA', 
        '27ABTPV9432F1ZX', 'AAAAA0000A', 'Maharashtra', '27');

-- Customers
INSERT OR IGNORE INTO customers (id, code, name, phone, city, state, gst, credit_limit, credit_days, opening_balance, current_balance) VALUES 
(1, 'CUST0001', 'ABC Enterprises', '9876543210', 'Mumbai', 'Maharashtra', '27ABCDE1234F1Z5', 50000, 30, 0, 0),
(2, 'CUST0002', 'XYZ Industries', '9876543211', 'Delhi', 'Delhi', '07ABCDE1234F1Z5', 75000, 30, 0, 0),
(3, 'CUST0003', 'PQR Traders', '9876543212', 'Pune', 'Maharashtra', '27ABCDE1234F1Z6', 30000, 30, 0, 0),
(4, 'CUST0004', 'Smith Industries', '9876543213', 'Bangalore', 'Karnataka', '29ABCDE1234F1Z7', 45000, 30, 0, 0);

-- Vendors
INSERT OR IGNORE INTO vendors (id, code, name, phone, city, state, gst, opening_balance, current_balance) VALUES 
(1, 'VEN0001', 'Raw Materials Ltd', '9876543220', 'Mumbai', 'Maharashtra', '27ABCDE1234F1Z5', 0, 0),
(2, 'VEN0002', 'Packaging Solutions', '9876543221', 'Delhi', 'Delhi', '07ABCDE1234F1Z5', 0, 0),
(3, 'VEN0003', 'Chemical Suppliers', '9876543222', 'Pune', 'Maharashtra', '27ABCDE1234F1Z6', 0, 0);

-- Banks
INSERT OR IGNORE INTO banks (id, code, name, account_no, ifsc_code, branch, opening_balance, current_balance) VALUES 
(1, 'BNK0001', 'HDFC Bank', '1234567890', 'HDFC0001234', 'Mumbai Main', 100000, 100000),
(2, 'BNK0002', 'SBI Bank', '0987654321', 'SBIN0001234', 'Delhi Main', 250000, 250000),
(3, 'BNK0003', 'ICICI Bank', '1122334455', 'ICIC0001234', 'Pune Main', 150000, 150000),
(4, 'BNK0004', 'Axis Bank', '5566778899', 'UTIB0001234', 'Bangalore Main', 75000, 75000);

-- Raw Materials (IDs 1-10)
INSERT OR IGNORE INTO raw_materials (id, code, name, unit, hsn_code, gst_rate, purchase_rate, opening_stock, current_stock, min_stock, max_stock, location) VALUES 
(1, 'RM0001', 'Plastic Granules - HDPE', 'KG', '39269099', 18, 50, 1000, 1000, 100, 5000, 'Warehouse A'),
(2, 'RM0002', 'Color Masterbatch - Black', 'KG', '32064900', 18, 200, 500, 500, 50, 2000, 'Warehouse B'),
(3, 'RM0003', 'Packaging Bags', 'PCS', '39232100', 12, 5, 10000, 10000, 1000, 50000, 'Warehouse C'),
(4, 'RM0004', 'PP Granules - Natural', 'KG', '39269099', 18, 70, 5000, 5000, 500, 20000, 'Warehouse A'),
(5, 'RM0005', 'PP Granules - Black', 'KG', '39269099', 18, 72, 3000, 3000, 300, 15000, 'Warehouse A'),
(6, 'RM0006', 'PP Granules - White', 'KG', '39269099', 18, 71, 4000, 4000, 400, 18000, 'Warehouse A'),
(7, 'RM0007', 'ABS Plastic', 'KG', '39269099', 18, 95, 2000, 2000, 200, 10000, 'Warehouse B'),
(8, 'RM0008', 'Polypropylene', 'KG', '39269099', 18, 65, 6000, 6000, 600, 25000, 'Warehouse A'),
(9, 'RM0009', 'UV Stabilizer', 'KG', '38123090', 18, 450, 200, 200, 20, 1000, 'Warehouse D'),
(10, 'RM0010', 'Color Masterbatch - White', 'KG', '32064900', 18, 230, 300, 300, 30, 1500, 'Warehouse B');

-- Finished Goods (IDs 1-10)
INSERT OR IGNORE INTO finished_goods (id, code, name, unit, hsn_code, gst_rate, sales_rate, mrp, opening_stock, current_stock, min_stock, max_stock, location) VALUES 
(1, 'FG0001', 'Plastic Moulded Chair', 'PCS', '94017900', 18, 450, 599, 100, 100, 10, 500, 'Showroom A'),
(2, 'FG0002', 'Plastic Table', 'PCS', '94037000', 18, 800, 999, 50, 50, 5, 200, 'Showroom A'),
(3, 'FG0003', 'Plastic Container 5L', 'PCS', '39231090', 12, 120, 150, 500, 500, 50, 2000, 'Showroom B'),
(4, 'FG0004', 'Plastic Chair - Executive', 'PCS', '94017900', 18, 850, 999, 200, 200, 20, 800, 'Showroom A'),
(5, 'FG0005', 'Plastic Table - Small', 'PCS', '94037000', 18, 450, 599, 150, 150, 15, 600, 'Showroom A'),
(6, 'FG0006', 'Plastic Container 20L', 'PCS', '39231090', 12, 350, 450, 300, 300, 30, 1200, 'Showroom B'),
(7, 'FG0007', 'Plastic Mug - Set of 6', 'BOX', '39241090', 12, 180, 250, 400, 400, 40, 2000, 'Showroom C'),
(8, 'FG0008', 'Plastic Bucket 10L', 'PCS', '39249090', 12, 90, 120, 600, 600, 60, 3000, 'Showroom B'),
(9, 'FG0009', 'Plastic Stool', 'PCS', '94017900', 18, 250, 350, 200, 200, 20, 1000, 'Showroom A'),
(10, 'FG0010', 'Plastic Tray Large', 'PCS', '39241090', 12, 60, 85, 1000, 1000, 100, 5000, 'Showroom C');

-- Delivery Challans
INSERT OR IGNORE INTO delivery_challan (id, challan_no, challan_date, customer_id, vehicle_no, transport_mode, status) VALUES 
(1, 'DC2403001', '2024-03-01', 1, 'MH01AB1234', 'Road', 'delivered'),
(2, 'DC2403002', '2024-03-02', 2, 'MH02CD5678', 'Road', 'in_transit'),
(3, 'DC2403003', '2024-03-03', 1, 'MH03EF9012', 'Road', 'pending'),
(4, 'DC2403004', '2024-03-04', 3, 'MH04GH3456', 'Road', 'pending');

-- Delivery Challan Items
INSERT OR IGNORE INTO delivery_challan_items (id, challan_id, item_id, item_type, quantity) VALUES 
(1, 1, 1, 'finished_good', 10),
(2, 1, 2, 'finished_good', 5),
(3, 2, 3, 'finished_good', 50),
(4, 3, 4, 'finished_good', 15);

-- Sample Customer Payments
INSERT OR IGNORE INTO customer_payments (receipt_no, customer_id, payment_date, amount, payment_mode, reference_no, bank_id, notes) VALUES 
('RCPT2403001', 1, '2024-03-05', 25000, 'bank', 'TRN123456', 1, 'Payment for invoice INV2403001'),
('RCPT2403002', 2, '2024-03-06', 15000, 'cash', NULL, NULL, 'Partial payment');

-- Sample Vendor Payments
INSERT OR IGNORE INTO vendor_payments (payment_no, vendor_id, payment_date, amount, payment_mode, reference_no, bank_id, notes) VALUES 
('PAY2403001', 1, '2024-03-07', 30000, 'bank', 'TRN789012', 2, 'Payment for purchase PUR2403001');

-- Sample Production Entries
INSERT OR IGNORE INTO production_entries (production_no, production_date, shift, finished_good_id, quantity_produced, batch_no, machine_no, operator_id, good_quantity, rejected_quantity, status) VALUES 
('PROD2403001', '2024-03-01', 'Morning', 1, 50, 'B240301-01', 'MACH-01', 1, 48, 2, 'completed'),
('PROD2403002', '2024-03-01', 'Evening', 1, 45, 'B240301-02', 'MACH-01', 1, 44, 1, 'completed'),
('PROD2403003', '2024-03-02', 'Morning', 2, 25, 'B240302-01', 'MACH-02', 1, 25, 0, 'completed'),
('PROD2403004', '2024-03-02', 'Evening', 3, 200, 'B240302-02', 'MACH-03', 1, 195, 5, 'verified');

-- Sample Production Consumption
INSERT OR IGNORE INTO production_consumption (production_entry_id, raw_material_id, quantity_used, uom, batch_no) VALUES 
(1, 1, 250, 'KG', 'RM-B240301'),
(1, 2, 5, 'KG', 'CLR-B240301'),
(2, 1, 225, 'KG', 'RM-B240301'),
(2, 2, 4.5, 'KG', 'CLR-B240301'),
(3, 4, 125, 'KG', 'PP-B240302'),
(4, 8, 100, 'KG', 'PP-B240302');

-- Sample Daily Summary
INSERT OR IGNORE INTO daily_production_summary (production_date, total_entries, total_items_produced, total_rejected, total_raw_material_used) VALUES 
('2024-03-01', 2, 95, 3, 484.5),
('2024-03-02', 2, 225, 5, 225);

-- Sample Production Transfers
INSERT OR IGNORE INTO production_transfer (production_entry_id, transfer_date, finished_good_id, quantity_transferred, batch_no, location, status) VALUES 
(1, '2024-03-01', 1, 48, 'B240301-01', 'Showroom A', 'completed'),
(2, '2024-03-01', 1, 44, 'B240301-02', 'Showroom A', 'completed'),
(3, '2024-03-02', 2, 25, 'B240302-01', 'Showroom A', 'completed'),
(4, '2024-03-02', 3, 195, 'B240302-02', 'Showroom B', 'pending');
"""

def init_database():
    """Initialize the database with all tables and sample data"""
    try:
        # Check if database already exists
        db_exists = os.path.exists(DB_PATH)
        
        # Connect to database (this will create it if it doesn't exist)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Enable foreign keys
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # Execute the schema SQL
        print("Creating tables and inserting sample data...")
        cursor.executescript(schema_sql)
        
        # Commit changes
        conn.commit()
        
        # Verify vendors table was created
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='vendors'")
        if cursor.fetchone():
            print("✓ vendors table created successfully")
            
            # Count vendors
            cursor.execute("SELECT COUNT(*) FROM vendors")
            count = cursor.fetchone()[0]
            print(f"✓ {count} vendors inserted")
        else:
            print("✗ vendors table not found!")
        
        conn.close()
        
        if db_exists:
            print(f"\n✅ Database updated successfully at: {DB_PATH}")
        else:
            print(f"\n✅ New database created successfully at: {DB_PATH}")
            
    except Exception as e:
        print(f"\n❌ Error initializing database: {str(e)}")
        raise e

if __name__ == "__main__":
    print("="*60)
    print("FOUR® PLASTIC - Database Initialization")
    print("="*60)
    init_database()
    print("="*60)