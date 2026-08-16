"""
Purchase Invoice Model - Handles purchase invoices with GST
"""
from config.database import get_db, dict_from_row
from datetime import datetime
import sqlite3
import time
from models.accounting_hook import AccountingHook

class PurchaseInvoiceModel:
    """Purchase invoice database operations"""
    
    @staticmethod
    def execute_with_retry(func, max_retries=5):
        """Execute function with retry on database lock"""
        for attempt in range(max_retries):
            try:
                return func()
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e) and attempt < max_retries - 1:
                    print(f"⚠️ Database locked, retrying... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(1)
                else:
                    raise e
    
    @staticmethod
    def generate_invoice_no():
        """Generate unique purchase invoice number"""
        conn = get_db()
        cursor = conn.cursor()
        today = datetime.now()
        year = today.strftime('%y')
        month = today.strftime('%m')
        
        cursor.execute("""
            SELECT COUNT(*) as count FROM purchase_invoice 
            WHERE strftime('%Y%m', invoice_date) = strftime('%Y%m', 'now')
        """)
        row = cursor.fetchone()
        count = row['count'] + 1 if row else 1
        
        # DON'T close the connection - let Flask handle it via teardown
        return f"PUR{year}{month}{count:04d}"
    
    @staticmethod
    def get_all():
        """Get all purchase invoices"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT pi.*, v.name as vendor_name, v.credit_days as vendor_credit_days 
            FROM purchase_invoice pi
            JOIN vendors v ON pi.vendor_id = v.id
            ORDER BY pi.id DESC
        ''')
        invoices = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return invoices
    
    @staticmethod
    def get_lots():
        """Get all purchase lots (purchase invoice items with lot details)"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                pii.id,
                pii.invoice_id,
                pii.item_id,
                pii.lot_no,
                pii.quantity as invoiced_qty,
                pii.received_quantity,
                (pii.quantity - pii.received_quantity) as shortage,
                pii.rate,
                pii.total as lot_billed_amount,
                CASE 
                    WHEN pii.quantity > 0 THEN (pii.total / pii.quantity) * pii.received_quantity 
                    ELSE pii.total 
                END as lot_received_value,
                CASE 
                    WHEN pii.quantity > 0 THEN pii.total - ((pii.total / pii.quantity) * pii.received_quantity)
                    ELSE 0 
                END as lot_financial_diff,
                COALESCE(lp.total_paid, 0) as lot_paid,
                rm.name as item_name,
                rm.code as item_code,
                pi.invoice_no,
                pi.invoice_date,
                pi.grand_total as invoice_total,
                pi.paid_amount as invoice_paid,
                v.name as vendor_name
            FROM purchase_invoice_items pii
            JOIN purchase_invoice pi ON pii.invoice_id = pi.id
            LEFT JOIN raw_materials rm ON pii.item_id = rm.id
            LEFT JOIN vendors v ON pi.vendor_id = v.id
            LEFT JOIN (
                SELECT lot_id, SUM(amount) as total_paid
                FROM lot_payments
                GROUP BY lot_id
            ) lp ON pii.id = lp.lot_id
            ORDER BY pi.invoice_date DESC, pii.id DESC
        ''')
        lots = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return lots

    @staticmethod
    def get_lot_payments(lot_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, lot_id, payment_date, amount, reference_no, created_at
            FROM lot_payments
            WHERE lot_id = ?
            ORDER BY payment_date DESC, id DESC
        ''', (lot_id,))
        payments = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return payments

    @staticmethod
    def add_lot_payment(data):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO lot_payments (lot_id, payment_date, amount, reference_no)
            VALUES (?, ?, ?, ?)
        ''', (data['lot_id'], data['payment_date'], data['amount'], data.get('reference_no')))
        conn.commit()
        conn.close()
        return True

    @staticmethod
    def delete_lot_payment(payment_id):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM lot_payments WHERE id = ?', (payment_id,))
        conn.commit()
        conn.close()
        return True
    
    @staticmethod
    def get_by_id(invoice_id):
        """Get purchase invoice by ID with items"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Get invoice header with vendor details
        cursor.execute('''
            SELECT pi.*, 
                   v.name as vendor_name, 
                   v.gst as vendor_gst,
                   v.address as vendor_address,
                   v.city as vendor_city,
                   v.state as vendor_state,
                   v.pincode as vendor_pincode,
                   v.phone as vendor_phone,
                   v.email as vendor_email
            FROM purchase_invoice pi
            JOIN vendors v ON pi.vendor_id = v.id
            WHERE pi.id = ?
        ''', (invoice_id,))
        
        invoice = dict_from_row(cursor.fetchone())
        
        if invoice:
            # Get invoice items with item details
            cursor.execute('''
                SELECT pi.*, 
                       rm.name as item_name,
                       rm.code as item_code,
                       rm.unit as unit,
                       rm.hsn_code as hsn_code
                FROM purchase_invoice_items pi
                LEFT JOIN raw_materials rm ON pi.item_type = 'raw_material' AND pi.item_id = rm.id
                WHERE pi.invoice_id = ?
                ORDER BY pi.id
            ''', (invoice_id,))
            
            invoice['items'] = [dict_from_row(row) for row in cursor.fetchall()]
            
            # Calculate totals from items
            invoice['total_cgst'] = sum(item.get('cgst_amount', 0) for item in invoice['items'])
            invoice['total_sgst'] = sum(item.get('sgst_amount', 0) for item in invoice['items'])
            invoice['total_igst'] = sum(item.get('igst_amount', 0) for item in invoice['items'])
        
        conn.close()
        return invoice
    
    @staticmethod
    def get_by_invoice_no(invoice_no, vendor_id=None):
        """Get invoice by invoice number and optional vendor"""
        conn = get_db()
        cursor = conn.cursor()
        if vendor_id:
            cursor.execute('SELECT * FROM purchase_invoice WHERE invoice_no = ? AND vendor_id = ?', (invoice_no, vendor_id))
        else:
            cursor.execute('SELECT * FROM purchase_invoice WHERE invoice_no = ?', (invoice_no,))
        invoice = dict_from_row(cursor.fetchone())
        conn.close()
        return invoice
    
    @staticmethod
    def create(data):
        """Create new purchase invoice"""
        def _create():
            conn = get_db()
            cursor = conn.cursor()
            
            # Use provided invoice number or generate a new one
            invoice_no = data.get('invoice_no')
            if not invoice_no or not str(invoice_no).strip():
                invoice_no = PurchaseInvoiceModel.generate_invoice_no()
            else:
                invoice_no = str(invoice_no).strip()
            
            # Calculate totals from items
            items = data.get('items', [])
            
            # Calculate GST totals from items
            cgst_total = sum(item.get('cgst_amount', 0) for item in items)
            sgst_total = sum(item.get('sgst_amount', 0) for item in items)
            igst_total = sum(item.get('igst_amount', 0) for item in items)
            gst_total = cgst_total + sgst_total + igst_total
            
            # Handle bank_id
            bank_id = data.get('bank_id')
            if bank_id is not None and str(bank_id).strip() and str(bank_id) != '0':
                try:
                    bank_id = int(bank_id)
                except (ValueError, TypeError):
                    bank_id = None
            else:
                bank_id = None
            
            print(f"💰 Bank ID: {bank_id}")
            print(f"📦 Vendor ID: {data.get('vendor_id')}")
            print(f"📝 Purchase Invoice No: {invoice_no}")
            print(f"📦 Items count: {len(items)}")
            
            # Insert invoice header
            cursor.execute('''
                INSERT INTO purchase_invoice (
                    invoice_no, invoice_date, vendor_id,
                    bill_to_address, bill_to_city, bill_to_state, bill_to_pincode, bill_to_gst,
                    ship_to_address, ship_to_city, ship_to_state, ship_to_pincode, ship_to_gst,
                    place_of_supply, transport_mode, vehicle_no,
                    subtotal, discount, taxable_amount,
                    cgst_total, sgst_total, igst_total, gst_total,
                    grand_total, paid_amount, balance, payment_status,
                    payment_type, bank_id, notes, attachment_path,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                invoice_no,
                data.get('invoice_date', datetime.now().strftime('%Y-%m-%d')),
                data.get('vendor_id'),
                data.get('bill_to_address'),
                data.get('bill_to_city'),
                data.get('bill_to_state'),
                data.get('bill_to_pincode'),
                data.get('bill_to_gst'),
                data.get('ship_to_address'),
                data.get('ship_to_city'),
                data.get('ship_to_state'),
                data.get('ship_to_pincode'),
                data.get('ship_to_gst'),
                data.get('place_of_supply', ''),
                data.get('transport_mode', 'Road'),
                data.get('vehicle_no', ''),
                data.get('subtotal', 0),
                data.get('discount', 0),
                data.get('taxable_amount', 0),
                cgst_total,
                sgst_total,
                igst_total,
                gst_total,
                data.get('grand_total', 0),
                data.get('paid_amount', 0),
                data.get('grand_total', 0) - data.get('paid_amount', 0),
                data.get('payment_status', 'pending'),
                data.get('payment_type', 'cash'),
                bank_id,
                data.get('notes', ''),
                data.get('attachment_path'),
                1  # created_by (default admin)
            ))
            
            invoice_id = cursor.lastrowid
            
            # Insert invoice items
            for item in items:
                print(f"📦 Inserting item: {item.get('item_name')} (ID: {item.get('item_id')})")
                cursor.execute('''
                    INSERT INTO purchase_invoice_items (
                        invoice_id, item_id, item_type,
                        quantity, rate, discount, taxable_value,
                        cgst_rate, sgst_rate, igst_rate,
                        cgst_amount, sgst_amount, igst_amount,
                        total, lot_no, received_quantity
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    invoice_id,
                    item.get('item_id'),
                    item.get('item_type', 'raw_material'),
                    item.get('quantity', 0),
                    item.get('rate', 0),
                    item.get('discount', 0),
                    item.get('taxable_value', 0),
                    item.get('cgst_rate', 9),
                    item.get('sgst_rate', 9),
                    item.get('igst_rate', 0),
                    item.get('cgst_amount', 0),
                    item.get('sgst_amount', 0),
                    item.get('igst_amount', 0),
                    item.get('total', 0),
                    item.get('lot_no'),
                    float(item.get('received_quantity')) if item.get('received_quantity') not in [None, ''] else float(item.get('quantity', 0))
                ))
                
                # Update raw material stock (increase on purchase)
                rec_qty = float(item.get('received_quantity')) if item.get('received_quantity') not in [None, ''] else float(item.get('quantity', 0))
                cursor.execute('''
                    UPDATE raw_materials 
                    SET current_stock = current_stock + ? 
                    WHERE id = ?
                ''', (rec_qty, item.get('item_id')))
            
            # Post Journal Entry
            try:
                AccountingHook.post_purchase_invoice(
                    cursor,
                    invoice_no,
                    data.get('vendor_id'),
                    data.get('taxable_amount', 0),
                    cgst_total, sgst_total, igst_total,
                    data.get('grand_total', 0)
                )
                print("✅ Auto-posted Journal Entry for Purchase Invoice.")
            except Exception as j_err:
                print(f"❌ Failed to auto-post Journal Entry: {j_err}")
                pass

            conn.commit()
            conn.close()
            
            return {'id': invoice_id, 'invoice_no': invoice_no, 'message': 'Purchase invoice created successfully'}
        
        return PurchaseInvoiceModel.execute_with_retry(_create)
    
    @staticmethod
    def update(invoice_id, data):
        """Update existing purchase invoice with retry logic"""
        def _update():
            conn = get_db()
            cursor = conn.cursor()
            
            # First, get old items to reverse stock
            cursor.execute('SELECT item_id, quantity, received_quantity FROM purchase_invoice_items WHERE invoice_id = ?', (invoice_id,))
            old_items = cursor.fetchall()
            
            # Reverse old stock updates
            for old_item in old_items:
                rev_qty = old_item[2] if old_item[2] is not None else old_item[1]
                cursor.execute('''
                    UPDATE raw_materials 
                    SET current_stock = current_stock - ? 
                    WHERE id = ?
                ''', (rev_qty, old_item[0]))
            
            # Commit after reversing stock
            conn.commit()
            
            # Calculate totals from new items
            items = data.get('items', [])
            
            # Calculate GST totals from items
            cgst_total = sum(item.get('cgst_amount', 0) for item in items)
            sgst_total = sum(item.get('sgst_amount', 0) for item in items)
            igst_total = sum(item.get('igst_amount', 0) for item in items)
            gst_total = cgst_total + sgst_total + igst_total
            
            # Handle bank_id
            bank_id = data.get('bank_id')
            if bank_id is not None and str(bank_id).strip() and str(bank_id) != '0':
                try:
                    bank_id = int(bank_id)
                except (ValueError, TypeError):
                    bank_id = None
            else:
                bank_id = None
            
            print(f"💰 Updating purchase invoice {invoice_id}")
            
            # Update invoice header
            cursor.execute('''
                UPDATE purchase_invoice SET
                    invoice_date = ?,
                    vendor_id = ?,
                    bill_to_address = ?,
                    bill_to_city = ?,
                    bill_to_state = ?,
                    bill_to_pincode = ?,
                    bill_to_gst = ?,
                    ship_to_address = ?,
                    ship_to_city = ?,
                    ship_to_state = ?,
                    ship_to_pincode = ?,
                    ship_to_gst = ?,
                    place_of_supply = ?,
                    transport_mode = ?,
                    vehicle_no = ?,
                    subtotal = ?,
                    discount = ?,
                    taxable_amount = ?,
                    cgst_total = ?,
                    sgst_total = ?,
                    igst_total = ?,
                    gst_total = ?,
                    grand_total = ?,
                    paid_amount = ?,
                    balance = ?,
                    payment_status = ?,
                    payment_type = ?,
                    bank_id = ?,
                    notes = ?,
                    attachment_path = ?
                WHERE id = ?
            ''', (
                data.get('invoice_date'),
                data.get('vendor_id'),
                data.get('bill_to_address'),
                data.get('bill_to_city'),
                data.get('bill_to_state'),
                data.get('bill_to_pincode'),
                data.get('bill_to_gst'),
                data.get('ship_to_address'),
                data.get('ship_to_city'),
                data.get('ship_to_state'),
                data.get('ship_to_pincode'),
                data.get('ship_to_gst'),
                data.get('place_of_supply', ''),
                data.get('transport_mode', 'Road'),
                data.get('vehicle_no', ''),
                data.get('subtotal', 0),
                data.get('discount', 0),
                data.get('taxable_amount', 0),
                cgst_total,
                sgst_total,
                igst_total,
                gst_total,
                data.get('grand_total', 0),
                data.get('paid_amount', 0),
                data.get('grand_total', 0) - data.get('paid_amount', 0),
                data.get('payment_status', 'pending'),
                data.get('payment_type', 'cash'),
                bank_id,
                data.get('notes', ''),
                data.get('attachment_path'),
                invoice_id
            ))
            
            # Commit after updating header
            conn.commit()
            
            # Delete existing items
            cursor.execute('DELETE FROM purchase_invoice_items WHERE invoice_id = ?', (invoice_id,))
            conn.commit()
            
            # Insert updated items and update stock
            for item in items:
                cursor.execute('''
                    INSERT INTO purchase_invoice_items (
                        invoice_id, item_id, item_type,
                        quantity, rate, discount, taxable_value,
                        cgst_rate, sgst_rate, igst_rate,
                        cgst_amount, sgst_amount, igst_amount,
                        total, lot_no, received_quantity
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    invoice_id,
                    item.get('item_id'),
                    item.get('item_type', 'raw_material'),
                    item.get('quantity', 0),
                    item.get('rate', 0),
                    item.get('discount', 0),
                    item.get('taxable_value', 0),
                    item.get('cgst_rate', 9),
                    item.get('sgst_rate', 9),
                    item.get('igst_rate', 0),
                    item.get('cgst_amount', 0),
                    item.get('sgst_amount', 0),
                    item.get('igst_amount', 0),
                    item.get('total', 0),
                    item.get('lot_no'),
                    float(item.get('received_quantity')) if item.get('received_quantity') not in [None, ''] else float(item.get('quantity', 0))
                ))
                
                # Update raw material stock (increase on purchase)
                rec_qty = float(item.get('received_quantity')) if item.get('received_quantity') not in [None, ''] else float(item.get('quantity', 0))
                cursor.execute('''
                    UPDATE raw_materials 
                    SET current_stock = current_stock + ? 
                    WHERE id = ?
                ''', (rec_qty, item.get('item_id')))
                
                # Commit after each item to reduce lock time
                conn.commit()
            
            conn.close()
            
            return {'message': 'Purchase invoice updated successfully', 'id': invoice_id}
        
        return PurchaseInvoiceModel.execute_with_retry(_update)
    
    @staticmethod
    def delete(invoice_id):
        """Delete purchase invoice and revert stock and journal entries"""
        def _delete():
            conn = get_db()
            cursor = conn.cursor()
            
            # Fetch invoice header details first
            cursor.execute('SELECT invoice_no FROM purchase_invoice WHERE id = ?', (invoice_id,))
            invoice = cursor.fetchone()
            if not invoice:
                return {'error': 'Purchase invoice not found'}
                
            invoice_no = invoice['invoice_no']
            
            # Fetch items to reverse stock updates (subtract purchase quantity)
            cursor.execute('SELECT item_id, quantity, received_quantity FROM purchase_invoice_items WHERE invoice_id = ?', (invoice_id,))
            items = cursor.fetchall()
            for item in items:
                rec_qty = item[2] if item[2] is not None else item[1]
                cursor.execute('''
                    UPDATE raw_materials 
                    SET current_stock = current_stock - ? 
                    WHERE id = ?
                ''', (rec_qty, item[0]))
                
            # Reverse auto-posted journal entries
            cursor.execute('SELECT id FROM journal_vouchers WHERE reference_no = ? AND notes LIKE ?', (invoice_no, "Auto-posted from Purchase %"))
            vouchers = cursor.fetchall()
            for v in vouchers:
                cursor.execute('DELETE FROM journal_entries WHERE voucher_id = ?', (v[0],))
                cursor.execute('DELETE FROM journal_vouchers WHERE id = ?', (v[0],))
                
            # Delete invoice (cascade delete takes care of purchase_invoice_items & lot_payments)
            cursor.execute('DELETE FROM purchase_invoice WHERE id = ?', (invoice_id,))
            conn.commit()
            conn.close()
            return {'message': 'Purchase invoice deleted successfully'}
            
        return PurchaseInvoiceModel.execute_with_retry(_delete)
    
    @staticmethod
    def get_vendor_outstanding(vendor_id):
        """Get vendor outstanding balance"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT COALESCE(SUM(balance), 0) as outstanding
            FROM purchase_invoice
            WHERE vendor_id = ? AND payment_status != 'paid'
        ''', (vendor_id,))
        result = cursor.fetchone()
        conn.close()
        return result['outstanding'] if result else 0

    @staticmethod
    def update_attachment(invoice_id, attachment_path):
        """Update attachment path of a purchase invoice"""
        def _update():
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE purchase_invoice 
                SET attachment_path = ? 
                WHERE id = ?
            ''', (attachment_path, invoice_id))
            conn.commit()
            return {'message': 'Attachment updated successfully'}
        return PurchaseInvoiceModel.execute_with_retry(_update)