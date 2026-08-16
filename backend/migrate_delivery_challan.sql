-- Add missing columns to delivery_challan table (without dropping)

-- Bill To columns
ALTER TABLE delivery_challan ADD COLUMN bill_to_address TEXT;
ALTER TABLE delivery_challan ADD COLUMN bill_to_city TEXT;
ALTER TABLE delivery_challan ADD COLUMN bill_to_state TEXT;
ALTER TABLE delivery_challan ADD COLUMN bill_to_pincode TEXT;
ALTER TABLE delivery_challan ADD COLUMN bill_to_gst TEXT;

-- Ship To columns
ALTER TABLE delivery_challan ADD COLUMN ship_to_address TEXT;
ALTER TABLE delivery_challan ADD COLUMN ship_to_city TEXT;
ALTER TABLE delivery_challan ADD COLUMN ship_to_state TEXT;
ALTER TABLE delivery_challan ADD COLUMN ship_to_pincode TEXT;
ALTER TABLE delivery_challan ADD COLUMN ship_to_gst TEXT;

-- Transporter columns
ALTER TABLE delivery_challan ADD COLUMN transporter_name TEXT;
ALTER TABLE delivery_challan ADD COLUMN transporter_phone TEXT;
ALTER TABLE delivery_challan ADD COLUMN lr_no TEXT;
ALTER TABLE delivery_challan ADD COLUMN lr_date DATE;

-- Package columns
ALTER TABLE delivery_challan ADD COLUMN no_of_packages INTEGER DEFAULT 0;
ALTER TABLE delivery_challan ADD COLUMN weight REAL DEFAULT 0;
ALTER TABLE delivery_challan ADD COLUMN freight_charges REAL DEFAULT 0;
ALTER TABLE delivery_challan ADD COLUMN payment_terms TEXT;

-- Updated timestamp
ALTER TABLE delivery_challan ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_delivery_challan_lr_no ON delivery_challan(lr_no);
CREATE INDEX IF NOT EXISTS idx_delivery_challan_transporter ON delivery_challan(transporter_name);
CREATE INDEX IF NOT EXISTS idx_delivery_challan_status ON delivery_challan(status);

SELECT '✅ Delivery Challan table updated successfully!' as message;