-- Migration script to add missing columns

ALTER TABLE sales_invoice ADD COLUMN cgst_total REAL DEFAULT 0;
ALTER TABLE sales_invoice ADD COLUMN sgst_total REAL DEFAULT 0;
ALTER TABLE sales_invoice ADD COLUMN igst_total REAL DEFAULT 0;
ALTER TABLE sales_invoice ADD COLUMN bill_to_address TEXT;
ALTER TABLE sales_invoice ADD COLUMN bill_to_city TEXT;
ALTER TABLE sales_invoice ADD COLUMN bill_to_state TEXT;
ALTER TABLE sales_invoice ADD COLUMN bill_to_pincode TEXT;
ALTER TABLE sales_invoice ADD COLUMN bill_to_gst TEXT;
ALTER TABLE sales_invoice ADD COLUMN ship_to_address TEXT;
ALTER TABLE sales_invoice ADD COLUMN ship_to_city TEXT;
ALTER TABLE sales_invoice ADD COLUMN ship_to_state TEXT;
ALTER TABLE sales_invoice ADD COLUMN ship_to_pincode TEXT;
ALTER TABLE sales_invoice ADD COLUMN ship_to_gst TEXT;
ALTER TABLE sales_invoice ADD COLUMN challan_no TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_invoice_challan ON sales_invoice(challan_no);
