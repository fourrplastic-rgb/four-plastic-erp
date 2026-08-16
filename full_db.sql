

CREATE TABLE users (
    id SERIAL PRIMARY KEY ,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'operator',
    email TEXT,
    phone TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
, company_id INTEGER REFERENCES companies(id) DEFAULT 1);
INSERT INTO users VALUES(1,'admin','admin123','Administrator','admin','admin@company.com','1234567890',1,'2026-03-26 12:53:57',NULL,1);
CREATE TABLE company_settings (
    id SERIAL PRIMARY KEY CHECK (id = 1),
    company_name TEXT DEFAULT 'FOURÂ® PLASTIC',
    address TEXT,
    phone TEXT,
    email TEXT,
    gst TEXT,
    pan TEXT
    cin TEXT,
    state TEXT,
    state_code TEXT,
    logo_path TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE customers (
    id SERIAL PRIMARY KEY ,
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
    updated_at TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
INSERT INTO customers VALUES(2,'CUST1','LALIT BHAI SAFED PUL',NULL,'9820286302','','SAFEDPUL',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(3,'CUST2','IRSHAD BHAI',NULL,'9702802786','','FILTERPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(4,'CUST3','R. B. RUBBER INDUSTRIES',NULL,'9324768341','','3 NO. KHADI',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(5,'CUST4','MAURI ENTERPRISES',NULL,'9819176801','','CHANDRAKANT',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(6,'CUST5','WESTERN INDUSTRIES',NULL,'9967056526','','CHIMANPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(7,'CUST6','RAHUL PLASTIC',NULL,'8104318203','','SHIV PRABHA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(8,'CUST7','HARISH BHAI',NULL,'','','FILTERPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(9,'CUST8','SIRAJ BHAI',NULL,'','','GOVANDI',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(10,'CUST9','MATEEN',NULL,'','','FILTERPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(11,'CUST10','CRYSTAL ENGG',NULL,'','','KHERANI ROAD',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(12,'CUST11','BANISI',NULL,'','','NITIE',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(13,'CUST12','RAJU',NULL,'','','FILTERPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(14,'CUST13','PRADEEP PLASTIC',NULL,'','','NITE',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(15,'CUST14','OM PLATSTIC MOULD DILIP MISHRA',NULL,'','','SAFED PULL',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(16,'CUST15','SELF',NULL,'','','',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(17,'CUST16','BASHIR',NULL,'','','MILIND NAGAR',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(18,'CUST17','RUSHABH INDUSTRIES',NULL,'','','9 AND 10 SHEETAL INDUSTRIAL ESTATE VASAI',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(19,'CUST18','ARTI PLASTIC',NULL,'','','SAVARKAR NAGAR',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(20,'CUST19','INDO DIES',NULL,'','','RAJPRABHA VASAI',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(21,'CUST20','A J AUTO PVT LTD',NULL,'','','ANSA INDUSTRIAL ESTAT SAKINAKA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(22,'CUST21','VITHHAL BHAI',NULL,'','','THAKUR COMPOUND FILTERPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(23,'CUST22','KIRTI PLASTIC BHARAT',NULL,'','','KHERANI ROAD',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(24,'CUST23','SEHARA PLASTIC',NULL,'','','FILTERPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(25,'CUST24','SAFE PRO FIRE SERVICES PRIVATE LIMITED',NULL,'','','16 B,, KURLA INDUSTRIAL ESTATE, NARI SEVA SADAN ROAD NARAYAN NAGAR GHATKOPAR WEST',NULL,NULL,NULL,'27AAUCS8413N1ZG',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(26,'CUST25','SAIDAWR ALUMINIUM AND HARDWARE',NULL,'','','3 NO. KHADI SAKINAKA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(27,'CUST26','ABDULAH',NULL,'','','SAKINAKA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(28,'CUST27','SAHIL PLASTIC',NULL,'','','MILIN NAGAR',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(29,'CUST28','JAMIL BHAI',NULL,'','','FILTERPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(30,'CUST29','CD FOUNDRY',NULL,'','','4 APPLO CHEMBER ANDHERI ',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(31,'CUST30','SHREE METAL WORKS',NULL,'','','4 APPOLO CHEMBER ANDHERI',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(32,'CUST31','VIBHA ENGG',NULL,'','','SHIVPRABHA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(33,'CUST32','KALPESH BHAI',NULL,'','','SHIVPRABHA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(34,'CUST33','ASHOK BHAI ',NULL,'','','FILTERPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(35,'CUST34','SHAH OPTICASE',NULL,'','','GHATKOPAR',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(36,'CUST35','INDU INDUSTRIES',NULL,'','','MALAD',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(37,'CUST36','GANNI BHAI',NULL,'','','OPP. PRAVASI INDUSTRIAL ESTATE',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(38,'CUST37','OM PLASTIC MOULD VISHAL BHAI',NULL,'','','SAFEDPULL',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(39,'CUST38','s v plasto film',NULL,'','','ansa film',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(40,'CUST39','DONIAN ENTERPRISES',NULL,'','','',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(41,'CUST40','VORA ENTERPRISES',NULL,'','','',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(42,'CUST41','AMY AGENCY',NULL,'','','MIRA ROAD',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(43,'CUST42','HI PLAST (HITESH BHAI)',NULL,'','','VASAI',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
INSERT INTO customers VALUES(44,'CUST43','POLYPLAST INDIA',NULL,'','','SEKHSARIYA IND ESTATE',NULL,NULL,NULL,'',NULL,NULL,0.0,30,0.0,0.0,1,NULL,'2026-03-31 11:32:28',NULL,1);
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY ,
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
    updated_at TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
INSERT INTO vendors VALUES(2,'VEND1','A J AUTO PVT LTD',NULL,'','','ANSA INDUSTRIAL ESTATE SAKINAKA',NULL,NULL,NULL,'',NULL,NULL,0.0,0.0,0,NULL,'2026-03-31 11:32:34',NULL,1);
INSERT INTO vendors VALUES(3,'VEND2','KALPESH BHAI',NULL,'','','SHIVPRABHA',NULL,NULL,NULL,'',NULL,NULL,0.0,0.0,0,NULL,'2026-03-31 11:32:34',NULL,1);
INSERT INTO vendors VALUES(4,'VEND3','ASHOK BHAI',NULL,'','','FILTERPADA',NULL,NULL,NULL,'',NULL,NULL,0.0,0.0,0,NULL,'2026-03-31 11:32:34',NULL,1);
CREATE TABLE banks (
    id SERIAL PRIMARY KEY ,
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
    updated_at TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE raw_materials (
    id SERIAL PRIMARY KEY ,
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
INSERT INTO raw_materials VALUES(1,'RM0001','PP SCRAP','','KG','',18.0,0.0,200.0,0.0,0.0,0.0,'',0,1,'2026-03-31 10:34:01','2026-03-31 10:37:16');
CREATE TABLE finished_goods (
    id SERIAL PRIMARY KEY ,
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
INSERT INTO finished_goods VALUES(1,'FG0001','PP ORANGE WHITE BASW','','KG','3902',18.0,0.0,0.0,0.0,0.0,0.0,0.0,'',0,1,'2026-03-28 04:13:17',NULL);
INSERT INTO finished_goods VALUES(2,'FG0002','PP MARRON','','KG','3902',18.0,0.0,0.0,0.0,0.0,0.0,0.0,'',0,1,'2026-03-28 04:13:31',NULL);
INSERT INTO finished_goods VALUES(3,'FG0003','PP GRAY','','KG','3902',18.0,0.0,0.0,0.0,0.0,0.0,0.0,'',0,1,'2026-03-28 04:13:44',NULL);
INSERT INTO finished_goods VALUES(4,'FG0004','PPDN','','KG','3902',18.0,0.0,0.0,0.0,0.0,0.0,0.0,'',0,1,'2026-03-28 04:13:58',NULL);
INSERT INTO finished_goods VALUES(5,'FG0005','PP YELLOW','','KG','',18.0,0.0,0.0,500.0,500.0,0.0,0.0,'',0,1,'2026-03-31 10:33:27',NULL);
INSERT INTO finished_goods VALUES(6,'FG0006','PP BLACK','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(7,'FG0007','C080MA','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(8,'FG0008','PP RED','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(9,'FG0009','110 MA','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(10,'FG0010','PPN','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(11,'FG0011','REPROSESS','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(12,'FG0012','PP MILKY','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(13,'FG0013','PP LIGHT MILKY','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(14,'FG0014','PPCP ORANGE','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(15,'FG0015','PP ORANGE WHITE BASE','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(16,'FG0016','PP BLUE WHITE BASE','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(17,'FG0017','PP GREEN WHITE BASE','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(18,'FG0018','PPCP MILKY','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(19,'FG0019','PPCP RED','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(20,'FG0020','PP MAROON','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(21,'FG0021','LLDP 26500','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
INSERT INTO finished_goods VALUES(22,'FG0022','PP BLACK IIII','Finished Good','KG',NULL,18.0,0.0,0.0,0.0,0.0,0.0,0.0,NULL,1,NULL,'2026-03-31 12:29:28',NULL);
CREATE TABLE sales_invoice (
    id SERIAL PRIMARY KEY ,
    invoice_no TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    
    -- Invoice Details
    subtotal REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    taxable_amount REAL DEFAULT 0,
    
    -- GST Details
    cgst_rate REAL DEFAULT 9,
    sgst_rate REAL DEFAULT 9,
    igst_rate REAL DEFAULT 0,
    cgst_amount REAL DEFAULT 0,
    sgst_amount REAL DEFAULT 0,
    igst_amount REAL DEFAULT 0,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, cgst_total REAL DEFAULT 0, sgst_total REAL DEFAULT 0, igst_total REAL DEFAULT 0, bill_to_address TEXT, bill_to_city TEXT, bill_to_state TEXT, bill_to_pincode TEXT, bill_to_gst TEXT, ship_to_address TEXT, ship_to_city TEXT, ship_to_state TEXT, ship_to_pincode TEXT, ship_to_gst TEXT, challan_no TEXT, tax_type TEXT DEFAULT 'igst', company_id INTEGER REFERENCES companies(id) DEFAULT 1,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
INSERT INTO sales_invoice VALUES(1,'INV26030001','2026-03-28',1,18632.0,0.0,18632.0,9.0,9.0,0.0,0.0,0.0,0.0,17.82000000000000028,18649.81999999999971,18649.81999999999971,0.0,'pending','cash',NULL,'','MAHARASTRA','Road','',1,'2026-03-28 16:09:54',8.910000000000000142,8.910000000000000142,0.0,'9 10 SHEETAL INDUSTRIAL ESTATE VASAI','MUMBAI','MAHARASTRA','401202','','9 10 SHEETAL INDUSTRIAL ESTATE VASAI','MUMBAI','MAHARASTRA','401202','','DC26030001','igst',1);
INSERT INTO sales_invoice VALUES(2,'INV26030002','2026-03-30',1,1000.0,0.0,1000.0,9.0,9.0,0.0,0.0,0.0,0.0,180.0,1180.0,0.0,1180.0,'pending','cash',NULL,'','','Road','',1,'2026-03-29 14:52:29',90.0,90.0,0.0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'igst',1);
INSERT INTO sales_invoice VALUES(3,'INV26030003','2026-03-31',1,3400.0,0.0,3400.0,9.0,9.0,0.0,0.0,0.0,0.0,612.0,4012.0,0.0,4012.0,'pending','cash',NULL,'','MAHARASTRA','Road','',1,'2026-03-31 10:34:33',0.0,0.0,612.0,'9 10 SHEETAL INDUSTRIAL ESTATE VASAI','MUMBAI','MAHARASTRA','401202','','9 10 SHEETAL INDUSTRIAL ESTATE VASAI','MUMBAI','MAHARASTRA','401202','',NULL,'igst',1);
CREATE TABLE purchase_invoice (
    id SERIAL PRIMARY KEY ,
    invoice_no TEXT UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    vendor_id INTEGER NOT NULL,
    
    -- Invoice Details
    subtotal REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    taxable_amount REAL DEFAULT 0,
    
    -- GST Details
    cgst_rate REAL DEFAULT 9,
    sgst_rate REAL DEFAULT 9,
    igst_rate REAL DEFAULT 0,
    cgst_amount REAL DEFAULT 0,
    sgst_amount REAL DEFAULT 0,
    igst_amount REAL DEFAULT 0,
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
    
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, bill_to_address TEXT, bill_to_city TEXT, bill_to_state TEXT, bill_to_pincode TEXT, bill_to_gst TEXT, ship_to_address TEXT, ship_to_city TEXT, ship_to_state TEXT, ship_to_pincode TEXT, ship_to_gst TEXT, transport_mode TEXT, vehicle_no TEXT, cgst_total REAL DEFAULT 0, sgst_total REAL DEFAULT 0, igst_total REAL DEFAULT 0, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
    
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE stock_transactions (
    id SERIAL PRIMARY KEY ,
    transaction_date DATE NOT NULL,
    item_type TEXT NOT NULL, -- 'raw_material' or 'finished_good'
    item_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'PURCHASE', 'SALE', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'ADJUSTMENT'
    reference_no TEXT,
    quantity_in REAL DEFAULT 0,
    quantity_out REAL DEFAULT 0,
    balance REAL NOT NULL,
    rate REAL,
    value REAL,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, company_id INTEGER REFERENCES companies(id) DEFAULT 1);
CREATE TABLE IF NOT EXISTS "sales_invoice_items" (
            id SERIAL PRIMARY KEY ,
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
            total REAL NOT NULL, gst_rate REAL DEFAULT 18, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            FOREIGN KEY (invoice_id) REFERENCES sales_invoice(id) ON DELETE CASCADE
        );
INSERT INTO sales_invoice_items VALUES(2,1,3,'finished_good',431.0,43.0,0.0,18533.0,0.0,0.0,0.0,0.0,0.0,0.0,18533.0,18.0,1);
INSERT INTO sales_invoice_items VALUES(3,1,3,'finished_good',33.0,3.0,0.0,99.0,9.0,9.0,0.0,8.910000000000000142,8.910000000000000142,0.0,116.8199999999999932,18.0,1);
INSERT INTO sales_invoice_items VALUES(4,2,1,'finished_good',10.0,100.0,0.0,1000.0,9.0,9.0,0.0,90.0,90.0,0.0,1180.0,18.0,1);
INSERT INTO sales_invoice_items VALUES(5,3,5,'finished_good',100.0,34.0,0.0,3400.0,0.0,0.0,18.0,0.0,0.0,612.0,4012.0,18.0,1);
CREATE TABLE customer_payments (
            id SERIAL PRIMARY KEY ,
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (bank_id) REFERENCES banks(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
INSERT INTO customer_payments VALUES(4,'RCPT260326182520',1,'2026-02-26',50000.0,'cash',NULL,NULL,'','completed',1,'2026-03-26 12:55:20',1);
INSERT INTO customer_payments VALUES(5,'RCPT260326182647',1,'2026-03-10',75000.0,'cash',NULL,NULL,'','completed',1,'2026-03-26 12:56:47',1);
CREATE TABLE vendor_payments (
            id SERIAL PRIMARY KEY ,
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            FOREIGN KEY (vendor_id) REFERENCES vendors(id),
            FOREIGN KEY (bank_id) REFERENCES banks(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );
INSERT INTO vendor_payments VALUES(1,'PAY260328210732',1,'2026-03-28',1000.0,'cash',NULL,NULL,'TRANSPORT PAYMENT','completed',1,'2026-03-28 15:37:32',1);
CREATE TABLE delivery_challan_items (
                    id SERIAL PRIMARY KEY ,
                    challan_id INTEGER NOT NULL,
                    item_id INTEGER NOT NULL,
                    item_type TEXT NOT NULL,
                    item_name TEXT NOT NULL,
                    quantity REAL NOT NULL,
                    rate REAL,
                    amount REAL DEFAULT 0,
                    notes TEXT, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
                    FOREIGN KEY (challan_id) REFERENCES delivery_challan(id) ON DELETE CASCADE
                );
CREATE TABLE employees (
            id SERIAL PRIMARY KEY ,
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
        , company_id INTEGER REFERENCES companies(id) DEFAULT 1);
CREATE TABLE advances (
            id SERIAL PRIMARY KEY ,
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
            updated_at TEXT, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
CREATE TABLE attendance (
            id SERIAL PRIMARY KEY ,
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
            updated_at TEXT, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            UNIQUE(employee_id, date)
        );
CREATE TABLE advance_repayments (
                id SERIAL PRIMARY KEY ,
                advance_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                repayment_date TEXT NOT NULL,
                amount REAL NOT NULL,
                payment_mode TEXT DEFAULT 'cash',
                reference_no TEXT,
                notes TEXT,
                created_at TEXT, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
                FOREIGN KEY (advance_id) REFERENCES advances(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            );
CREATE TABLE payouts (
            id SERIAL PRIMARY KEY ,
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
            updated_at TEXT, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
CREATE TABLE production_entries (
    id SERIAL PRIMARY KEY ,
    production_date DATE NOT NULL,
    finished_good_id INTEGER NOT NULL,
    quantity_produced REAL NOT NULL,
    batch_number TEXT,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, shift TEXT DEFAULT 'Morning', good_quantity REAL DEFAULT 0, rejected_quantity REAL DEFAULT 0, rejection_reason TEXT, batch_no TEXT, machine_no TEXT, operator_name TEXT, supervisor_name TEXT, start_time TEXT, end_time TEXT, production_no TEXT, updated_at TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
    FOREIGN KEY (finished_good_id) REFERENCES finished_goods(id)
);
CREATE TABLE production_consumption (
    id SERIAL PRIMARY KEY ,
    production_entry_id INTEGER NOT NULL,
    raw_material_id INTEGER NOT NULL,
    quantity_used REAL NOT NULL,
    notes TEXT, production_id INTEGER, batch_no TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
    FOREIGN KEY (production_entry_id) REFERENCES production_entries(id),
    FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id)
);
CREATE TABLE gst_rates (
    id SERIAL PRIMARY KEY ,
    rate DECIMAL(5,2) NOT NULL,
    description TEXT,
    cgst_rate DECIMAL(5,2),
    sgst_rate DECIMAL(5,2),
    igst_rate DECIMAL(5,2),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE purchase_invoice_tax_summary (
    id SERIAL PRIMARY KEY ,
    invoice_id INTEGER NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    taxable_value DECIMAL(10,2) DEFAULT 0,
    cgst_amount DECIMAL(10,2) DEFAULT 0,
    sgst_amount DECIMAL(10,2) DEFAULT 0,
    igst_amount DECIMAL(10,2) DEFAULT 0,
    total_tax DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES purchase_invoice(id) ON DELETE CASCADE
);
CREATE TABLE sales_invoice_tax_summary (
    id SERIAL PRIMARY KEY ,
    invoice_id INTEGER NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    taxable_value DECIMAL(10,2) DEFAULT 0,
    cgst_amount DECIMAL(10,2) DEFAULT 0,
    sgst_amount DECIMAL(10,2) DEFAULT 0,
    igst_amount DECIMAL(10,2) DEFAULT 0,
    total_tax DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES sales_invoice(id) ON DELETE CASCADE
);
CREATE TABLE daily_production_summary (
    id SERIAL PRIMARY KEY ,
    production_date DATE UNIQUE NOT NULL,
    total_entries INTEGER DEFAULT 0,
    total_items_produced INTEGER DEFAULT 0,
    total_rejected INTEGER DEFAULT 0,
    total_raw_material_used REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
, company_id INTEGER REFERENCES companies(id) DEFAULT 1);
CREATE TABLE production_transfer (
    id SERIAL PRIMARY KEY ,
    production_entry_id INTEGER NOT NULL,
    transfer_date DATE NOT NULL,
    finished_good_id INTEGER NOT NULL,
    quantity_transferred REAL NOT NULL,
    batch_no TEXT,
    location TEXT,
    reference_no TEXT,
    status TEXT DEFAULT 'pending',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
    FOREIGN KEY (production_entry_id) REFERENCES production_entries(id),
    FOREIGN KEY (finished_good_id) REFERENCES finished_goods(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS "purchase_invoice_items" (
            id SERIAL PRIMARY KEY ,
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
            total REAL NOT NULL, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            FOREIGN KEY (invoice_id) REFERENCES purchase_invoice(id) ON DELETE CASCADE
        );
CREATE TABLE ledger_groups (
            id SERIAL PRIMARY KEY ,
            name TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL, -- Asset, Liability, Equity, Income, Expense
            parent_id INTEGER,
            is_system INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            FOREIGN KEY (parent_id) REFERENCES ledger_groups(id)
        );
INSERT INTO ledger_groups VALUES(1,'Current Assets','Asset',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(2,'Bank Accounts','Asset',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(3,'Cash in Hand','Asset',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(4,'Sundry Debtors','Asset',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(5,'Fixed Assets','Asset',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(6,'Current Liabilities','Liability',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(7,'Sundry Creditors','Liability',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(8,'Duties & Taxes','Liability',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(9,'Loans & Advances','Liability',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(10,'Capital Account','Equity',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(11,'Retained Earnings','Equity',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(12,'Direct Income','Income',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(13,'Sales Accounts','Income',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(14,'Indirect Income','Income',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(15,'Direct Expenses','Expense',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(16,'Purchase Accounts','Expense',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(17,'Indirect Expenses','Expense',NULL,1,'2026-03-29 14:27:27',1);
INSERT INTO ledger_groups VALUES(18,'Salary / Payroll Expenses','Expense',NULL,1,'2026-03-29 14:27:27',1);
CREATE TABLE ledgers (
            id SERIAL PRIMARY KEY ,
            name TEXT UNIQUE NOT NULL,
            group_id INTEGER NOT NULL,
            opening_balance REAL DEFAULT 0,
            balance_type TEXT DEFAULT 'DR', -- DR or CR
            is_system INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, company_id INTEGER REFERENCES companies(id) DEFAULT 1,
            FOREIGN KEY (group_id) REFERENCES ledger_groups(id)
        );
INSERT INTO ledgers VALUES(1,'Main Cash',3,0.0,'DR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(2,'Sales Account',13,0.0,'CR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(3,'Purchase Account',16,0.0,'DR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(4,'CGST Payable',8,0.0,'CR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(5,'SGST Payable',8,0.0,'CR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(6,'IGST Payable',8,0.0,'CR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(7,'Salary Expense',18,0.0,'DR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(8,'Bank Charges',17,0.0,'DR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(9,'Discount Given',17,0.0,'DR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(10,'Discount Received',14,0.0,'CR',1,'2026-03-29 14:27:27',1);
INSERT INTO ledgers VALUES(11,'Accounts Receivable (Control)',4,0.0,'DR',1,'2026-03-29 14:52:29',1);
CREATE TABLE journal_vouchers (
            id SERIAL PRIMARY KEY ,
            voucher_no TEXT UNIQUE NOT NULL,
            voucher_date DATE NOT NULL,
            reference_no TEXT,
            notes TEXT,
            status TEXT DEFAULT 'posted',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        , company_id INTEGER REFERENCES companies(id) DEFAULT 1);
INSERT INTO journal_vouchers VALUES(1,'JV26030001','2026-03-29','','test','posted',NULL,'2026-03-29 14:40:20',1);
INSERT INTO journal_vouchers VALUES(2,'JV26030002','2026-03-29','INV26030002','Auto-posted from Sales Invoice INV26030002','posted',NULL,'2026-03-29 14:52:29',1);
INSERT INTO journal_vouchers VALUES(3,'JV26030003','2026-03-31','INV26030003','Auto-posted from Sales Invoice INV26030003','posted',NULL,'2026-03-31 10:34:33',1);
CREATE TABLE journal_entries (
            id SERIAL PRIMARY KEY ,
            voucher_id INTEGER NOT NULL,
            ledger_id INTEGER NOT NULL,
            debit REAL DEFAULT 0,
            credit REAL DEFAULT 0,
            notes TEXT,
            FOREIGN KEY (voucher_id) REFERENCES journal_vouchers(id) ON DELETE CASCADE,
            FOREIGN KEY (ledger_id) REFERENCES ledgers(id)
        );
INSERT INTO journal_entries VALUES(1,1,2,100.0,0.0,'');
INSERT INTO journal_entries VALUES(2,1,3,0.0,100.0,'');
INSERT INTO journal_entries VALUES(3,2,11,1180.0,0.0,NULL);
INSERT INTO journal_entries VALUES(4,2,2,0.0,1000.0,NULL);
INSERT INTO journal_entries VALUES(5,2,4,0.0,90.0,NULL);
INSERT INTO journal_entries VALUES(6,2,5,0.0,90.0,NULL);
INSERT INTO journal_entries VALUES(7,3,11,4012.0,0.0,NULL);
INSERT INTO journal_entries VALUES(8,3,2,0.0,3400.0,NULL);
INSERT INTO journal_entries VALUES(9,3,6,0.0,612.0,NULL);
CREATE TABLE companies (
            id SERIAL PRIMARY KEY ,
            name TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            email TEXT,
            gst_no TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO companies VALUES(1,'FOUR PLASTIC','Default Address',NULL,NULL,'DEFAULT-GST',1,'2026-03-29 14:52:17');
CREATE TABLE user_companies (
            id SERIAL PRIMARY KEY ,
            user_id INTEGER NOT NULL,
            company_id INTEGER NOT NULL,
            role TEXT DEFAULT 'operator',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
            UNIQUE(user_id, company_id)
        );
INSERT INTO user_companies VALUES(1,1,1,'admin');
CREATE TABLE items_new (
    id SERIAL PRIMARY KEY ,
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
    is_active INTEGER DEFAULT 1
);
INSERT INTO items_new VALUES(1,'Finished Goods','FG0001','PP ORANGE WHITE BASW','KG','3902',18.0,0.0,0.0,0.0,NULL,1);
INSERT INTO items_new VALUES(2,'Finished Goods','FG0002','PP MARRON','KG','3902',18.0,0.0,0.0,0.0,NULL,1);
INSERT INTO items_new VALUES(3,'Finished Goods','FG0003','PP GRAY','KG','3902',18.0,0.0,0.0,0.0,NULL,1);
INSERT INTO items_new VALUES(4,'Finished Goods','FG0004','PPDN','KG','3902',18.0,0.0,0.0,0.0,NULL,1);
INSERT INTO items_new VALUES(5,'Finished Goods','FG0005','PP YELLOW','KG','',18.0,0.0,500.0,500.0,NULL,1);
INSERT INTO items_new VALUES(6,'Raw Material','RM0001','PP SCRAP','KG','',18.0,0.0,200.0,0.0,NULL,1);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('customers',44);
INSERT INTO sqlite_sequence VALUES('users',1);
INSERT INTO sqlite_sequence VALUES('customer_payments',5);
INSERT INTO sqlite_sequence VALUES('finished_goods',22);
INSERT INTO sqlite_sequence VALUES('delivery_challan_items',13);
INSERT INTO sqlite_sequence VALUES('vendors',4);
INSERT INTO sqlite_sequence VALUES('vendor_payments',1);
INSERT INTO sqlite_sequence VALUES('sales_invoice',3);
INSERT INTO sqlite_sequence VALUES('sales_invoice_items',5);
INSERT INTO sqlite_sequence VALUES('ledger_groups',18);
INSERT INTO sqlite_sequence VALUES('ledgers',11);
INSERT INTO sqlite_sequence VALUES('journal_vouchers',3);
INSERT INTO sqlite_sequence VALUES('journal_entries',9);
INSERT INTO sqlite_sequence VALUES('companies',1);
INSERT INTO sqlite_sequence VALUES('user_companies',1);
INSERT INTO sqlite_sequence VALUES('raw_materials',1);
INSERT INTO sqlite_sequence VALUES('production_entries',1);
INSERT INTO sqlite_sequence VALUES('production_consumption',1);
INSERT INTO sqlite_sequence VALUES('items_new',6);
CREATE INDEX idx_sales_invoice_challan ON sales_invoice(challan_no);
CREATE INDEX idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id);
CREATE INDEX idx_sales_invoice_items_item ON sales_invoice_items(item_id, item_type);
CREATE INDEX idx_customer_payments_customer ON customer_payments(customer_id);
CREATE INDEX idx_customer_payments_date ON customer_payments(payment_date);
CREATE INDEX idx_vendor_payments_vendor ON vendor_payments(vendor_id);
CREATE INDEX idx_vendor_payments_date ON vendor_payments(payment_date);
CREATE INDEX idx_purchase_invoice_vendor ON purchase_invoice(vendor_id);
CREATE INDEX idx_purchase_invoice_date ON purchase_invoice(invoice_date);
CREATE INDEX idx_purchase_invoice_tax_summary_invoice ON purchase_invoice_tax_summary(invoice_id);
CREATE INDEX idx_purchase_invoice_payment_status ON purchase_invoice(payment_status);
CREATE INDEX idx_tax_summary_invoice_id ON purchase_invoice_tax_summary(invoice_id);
CREATE INDEX idx_tax_summary_gst_rate ON purchase_invoice_tax_summary(gst_rate);
CREATE INDEX idx_purchase_invoice_payment_type ON purchase_invoice(payment_type);
CREATE INDEX idx_purchase_invoice_created_at ON purchase_invoice(created_at);
CREATE INDEX idx_sales_invoice_tax_summary_invoice ON sales_invoice_tax_summary(invoice_id);
CREATE INDEX idx_sales_invoice_tax_summary_gst_rate ON sales_invoice_tax_summary(gst_rate);
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_vendors_code ON vendors(code);
CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_raw_materials_code ON raw_materials(code);
CREATE INDEX idx_finished_goods_code ON finished_goods(code);
CREATE INDEX idx_sales_invoice_no ON sales_invoice(invoice_no);
CREATE INDEX idx_sales_invoice_date ON sales_invoice(invoice_date);
CREATE INDEX idx_sales_invoice_customer ON sales_invoice(customer_id);
CREATE INDEX idx_purchase_invoice_no ON purchase_invoice(invoice_no);
CREATE INDEX idx_production_entries_date ON production_entries(production_date);
CREATE INDEX idx_production_entries_fg ON production_entries(finished_good_id);
CREATE INDEX idx_production_entries_status ON production_entries(status);
CREATE INDEX idx_production_consumption_entry ON production_consumption(production_entry_id);
CREATE INDEX idx_production_consumption_rm ON production_consumption(raw_material_id);
CREATE INDEX idx_daily_summary_date ON daily_production_summary(production_date);
CREATE INDEX idx_production_transfer_entry ON production_transfer(production_entry_id);
CREATE INDEX idx_production_transfer_fg ON production_transfer(finished_good_id);
CREATE INDEX idx_purchase_items_invoice ON purchase_invoice_items(invoice_id);
CREATE INDEX idx_purchase_items_item ON purchase_invoice_items(item_id, item_type);
CREATE VIEW items AS
SELECT 
    id,
    'finished_good' as item_type,
    name,
    unit,
    opening_stock,
    current_stock,
    is_active,
    created_at
FROM finished_goods
UNION ALL
SELECT 
    id,
    'raw_material' as item_type,
    name,
    unit,
    opening_stock,
    current_stock,
    is_active,
    created_at
FROM raw_materials;

