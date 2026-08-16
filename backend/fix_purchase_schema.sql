-- Add missing columns to purchase_invoice table

-- Bill To columns
ALTER TABLE purchase_invoice ADD COLUMN bill_to_address TEXT;
ALTER TABLE purchase_invoice ADD COLUMN bill_to_city TEXT;
ALTER TABLE purchase_invoice ADD COLUMN bill_to_state TEXT;
ALTER TABLE purchase_invoice ADD COLUMN bill_to_pincode TEXT;
ALTER TABLE purchase_invoice ADD COLUMN bill_to_gst TEXT;

-- Ship To columns
ALTER TABLE purchase_invoice ADD COLUMN ship_to_address TEXT;
ALTER TABLE purchase_invoice ADD COLUMN ship_to_city TEXT;
ALTER TABLE purchase_invoice ADD COLUMN ship_to_state TEXT;
ALTER TABLE purchase_invoice ADD COLUMN ship_to_pincode TEXT;
ALTER TABLE purchase_invoice ADD COLUMN ship_to_gst TEXT;

-- Transport columns
ALTER TABLE purchase_invoice ADD COLUMN place_of_supply TEXT;
ALTER TABLE purchase_invoice ADD COLUMN transport_mode TEXT;
ALTER TABLE purchase_invoice ADD COLUMN vehicle_no TEXT;

-- GST columns (if missing)
ALTER TABLE purchase_invoice ADD COLUMN cgst_total REAL DEFAULT 0;
ALTER TABLE purchase_invoice ADD COLUMN sgst_total REAL DEFAULT 0;
ALTER TABLE purchase_invoice ADD COLUMN igst_total REAL DEFAULT 0;
ALTER TABLE purchase_invoice ADD COLUMN gst_total REAL DEFAULT 0;

-- Payment columns
ALTER TABLE purchase_invoice ADD COLUMN paid_amount REAL DEFAULT 0;
ALTER TABLE purchase_invoice ADD COLUMN balance REAL DEFAULT 0;
ALTER TABLE purchase_invoice ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE purchase_invoice ADD COLUMN payment_type TEXT DEFAULT 'cash';
ALTER TABLE purchase_invoice ADD COLUMN bank_id INTEGER;

-- Notes
ALTER TABLE purchase_invoice ADD COLUMN notes TEXT;

SELECT '✅ Migration completed' as message;