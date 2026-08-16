-- =====================================================
-- FOUR PLASTIC - Complete Database Schema with All Items
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
    company_name TEXT DEFAULT 'FOUR PLASTIC',
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

-- ==================== SALES INVOICE ====================
CREATE TABLE IF NOT EXISTS sales_invoice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    challan_no TEXT,
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
    subtotal REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    taxable_amount REAL DEFAULT 0,
    cgst_total REAL DEFAULT 0,
    sgst_total REAL DEFAULT 0,
    igst_total REAL DEFAULT 0,
    gst_total REAL DEFAULT 0,
    grand_total REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    payment_type TEXT DEFAULT 'cash',
    bank_id INTEGER,
    place_of_supply TEXT,
    transport_mode TEXT,
    vehicle_no TEXT,
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

-- ==================== DELIVERY CHALLAN ====================
CREATE TABLE IF NOT EXISTS delivery_challan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challan_no TEXT UNIQUE NOT NULL,
    challan_date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    reference_no TEXT,
    vehicle_no TEXT,
    transport_mode TEXT,
    place_of_delivery TEXT,
    date_of_shipment DATE,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

-- ==================== DEFAULT DATA ====================

-- Users
INSERT OR IGNORE INTO users (username, password, full_name, role) 
VALUES ('admin', 'admin123', 'Administrator', 'admin');

-- Company Settings
INSERT OR IGNORE INTO company_settings (id, company_name, address, gst, pan, state, state_code) 
VALUES (1, 'FOUR PLASTIC', '90 FEET ROAD, WIRE GALI, KHADI NO.3, ANISH COMPOUND, SAKINAKA', 
        '27ABTPV9432F1ZX', 'AAAAA0000A', 'Maharashtra', '27');

-- Customers
INSERT OR IGNORE INTO customers (id, code, name, phone, city, state, gst) VALUES 
(1, 'CUST0001', 'ABC Enterprises', '9876543210', 'Mumbai', 'Maharashtra', '27ABCDE1234F1Z5'),
(2, 'CUST0002', 'XYZ Industries', '9876543211', 'Delhi', 'Delhi', '07ABCDE1234F1Z5');

-- Banks
INSERT OR IGNORE INTO banks (id, code, name, account_no, ifsc_code, branch, opening_balance, current_balance) VALUES 
(1, 'BNK0001', 'HDFC Bank', '1234567890', 'HDFC0001234', 'Mumbai Main', 100000, 100000),
(2, 'BNK0002', 'SBI Bank', '0987654321', 'SBIN0001234', 'Delhi Main', 250000, 250000),
(3, 'BNK0003', 'ICICI Bank', '1122334455', 'ICIC0001234', 'Pune Main', 150000, 150000);

-- Raw Materials (with ID 4 for your invoice)
INSERT OR IGNORE INTO raw_materials (id, code, name, unit, hsn_code, gst_rate, purchase_rate, opening_stock, current_stock) VALUES 
(1, 'RM0001', 'Plastic Granules - HDPE', 'KG', '39269099', 18, 50, 1000, 1000),
(2, 'RM0002', 'Color Masterbatch - Black', 'KG', '32064900', 18, 200, 500, 500),
(3, 'RM0003', 'Packaging Bags', 'PCS', '39232100', 12, 5, 10000, 10000),
(4, 'RM0004', 'PP Granules - Natural', 'KG', '39269099', 18, 70, 5000, 5000),
(5, 'RM0005', 'PP Granules - Black', 'KG', '39269099', 18, 72, 3000, 3000);

-- Finished Goods
INSERT OR IGNORE INTO finished_goods (id, code, name, unit, hsn_code, gst_rate, sales_rate, mrp, opening_stock, current_stock) VALUES 
(1, 'FG0001', 'Plastic Moulded Chair', 'PCS', '94017900', 18, 450, 599, 100, 100),
(2, 'FG0002', 'Plastic Table', 'PCS', '94037000', 18, 800, 999, 50, 50),
(3, 'FG0003', 'Plastic Container 5L', 'PCS', '39231090', 12, 120, 150, 500, 500);

-- Delivery Challans
INSERT OR IGNORE INTO delivery_challan (challan_no, challan_date, customer_id, vehicle_no, transport_mode, status) VALUES 
('DC2403001', '2024-03-01', 1, 'MH01AB1234', 'Road', 'delivered'),
('DC2403002', '2024-03-02', 2, 'MH02CD5678', 'Road', 'in_transit'),
('DC2403003', '2024-03-03', 1, 'MH03EF9012', 'Road', 'pending');

SELECT '✅ Database schema created successfully with Raw Material ID 4!' as message;