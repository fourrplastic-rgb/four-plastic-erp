import sqlite3
import os
import sys

# Add backend to path to import db
sys.path.append(os.path.abspath('backend'))
from config.database import get_db

def run_migration():
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # 1. Insert Canara Bank
        cursor.execute("SELECT id FROM banks WHERE account_no = '0127201004566'")
        bank_row = cursor.fetchone()
        if not bank_row:
            print("📝 Inserting Canara Bank...")
            cursor.execute('''
                INSERT INTO banks (
                    code, name, account_no, ifsc_code, branch,
                    opening_balance, current_balance, is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
            ''', ('BNK0001', 'Canara Bank', '0127201004566', 'CNRB0002411', 'SME BR MUMBAI SAKINAKA', 1000000.0, 956140.0))
            bank_id = cursor.lastrowid
        else:
            bank_id = bank_row[0]
            print(f"✅ Canara Bank exists with ID {bank_id}")

        # 2. Insert Vendor 'Adoni Enterprises'
        cursor.execute("SELECT id FROM vendors WHERE name = 'Adoni Enterprises'")
        vendor_row = cursor.fetchone()
        if not vendor_row:
            print("📝 Inserting Vendor 'Adoni Enterprises'...")
            cursor.execute('''
                INSERT INTO vendors (
                    code, name, phone, email, address, city, state, pincode,
                    opening_balance, current_balance, is_active, created_by, company_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
            ''', ('VND0001', 'Adoni Enterprises', '9876543210', 'info@adoni.com', 'Mumbai', 'Mumbai', 'Maharashtra', '400072', 0.0, 0.0))
            vendor_id = cursor.lastrowid
        else:
            vendor_id = vendor_row[0]
            print(f"✅ Vendor exists with ID {vendor_id}")

        # 3. Insert Purchase Invoice for 43,860.00
        cursor.execute("SELECT id FROM purchase_invoice WHERE invoice_no = 'PI26080001'")
        invoice_row = cursor.fetchone()
        if not invoice_row:
            print("📝 Inserting Purchase Invoice 'PI26080001'...")
            cursor.execute('''
                INSERT INTO purchase_invoice (
                    invoice_no, invoice_date, vendor_id, subtotal, discount, taxable_amount,
                    cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount,
                    cgst_total, sgst_total, igst_total, gst_total, grand_total, paid_amount,
                    balance, payment_status, payment_type, bank_id, notes, place_of_supply,
                    created_by, company_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            ''', (
                'PI26080001', '2026-08-12', vendor_id, 43860.0, 0.0, 43860.0,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0, 43860.0, 43860.0,
                0.0, 'paid', 'credit', bank_id, 'Purchase of materials from Adoni Enterprises - Cheque 083087', 'Maharashtra'
            ))
            invoice_id = cursor.lastrowid
        else:
            invoice_id = invoice_row[0]
            print(f"✅ Purchase Invoice exists with ID {invoice_id}")

        # 4. Insert Vendor Payment (Cheque 083087)
        cursor.execute("SELECT id FROM vendor_payments WHERE reference_no = '083087'")
        payment_row = cursor.fetchone()
        if not payment_row:
            print("📝 Inserting Vendor Payment...")
            cursor.execute('''
                INSERT INTO vendor_payments (
                    payment_no, vendor_id, payment_date, amount, payment_mode,
                    reference_no, bank_id, notes, status, created_by, company_id, invoice_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
            ''', ('PAY2608120001', vendor_id, '2026-08-12', 43860.0, 'cheque', '083087', bank_id, 'Payment for Purchase Invoice PI26080001', 'completed', invoice_id))
            payment_id = cursor.lastrowid
        else:
            payment_id = payment_row[0]
            print(f"✅ Payment exists with ID {payment_id}")

        conn.commit()
        print("🎉 Successfully committed all transactions!")
        
    except Exception as e:
        conn.rollback()
        print("❌ Error recording cheque payment transactions:", str(e))
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
