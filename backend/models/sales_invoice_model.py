"""
Sales Invoice Model - Handles sales invoices with GST
"""
from config.database import get_db, dict_from_row
from datetime import datetime
import sqlite3
import time
from models.accounting_hook import AccountingHook

class SalesInvoiceModel:
    """Sales invoice database operations"""
    
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
        """Generate unique invoice number based on MAX invoice number"""
        conn = get_db()
        cursor = conn.cursor()
        today = datetime.now()
        year = today.strftime('%y')
        month = today.strftime('%m')
        prefix = f"INV{year}{month}"
        
        # Get the maximum invoice number for this month
        cursor.execute("""
            SELECT invoice_no FROM sales_invoice 
            WHERE invoice_no LIKE ? 
            ORDER BY invoice_no DESC LIMIT 1
        """, (f"{prefix}%",))
        
        result = cursor.fetchone()
        # DON'T close the connection here - let Flask handle it
        
        if result:
            # Extract the number part and increment
            last_no = result['invoice_no']
            try:
                # Try to get the last 4 digits as the number
                last_num = int(last_no[-4:])
                new_num = last_num + 1
            except:
                # If parsing fails, start from 1
                new_num = 1
            return f"{prefix}{new_num:04d}"
        else:
            # First invoice of the month
            return f"{prefix}0001"
    
    @staticmethod
    def get_all():
        """Get all sales invoices"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT si.*, c.name as customer_name, c.credit_days as customer_credit_days 
            FROM sales_invoice si
            JOIN customers c ON si.customer_id = c.id
            ORDER BY si.id DESC
        ''')
        invoices = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return invoices
    
    @staticmethod
    def get_by_id(invoice_id):
        """Get invoice by ID with items"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Get invoice header with customer details
        cursor.execute('''
            SELECT si.*, 
                   c.name as customer_name, 
                   c.gst as customer_gst,
                   c.address as customer_address,
                   c.city as customer_city,
                   c.state as customer_state,
                   c.pincode as customer_pincode,
                   c.phone as customer_phone,
                   c.email as customer_email
            FROM sales_invoice si
            JOIN customers c ON si.customer_id = c.id
            WHERE si.id = ?
        ''', (invoice_id,))
        
        invoice = dict_from_row(cursor.fetchone())
        
        if invoice:
            # Get invoice items with item details
            cursor.execute('''
                SELECT si.*, 
                       CASE 
                           WHEN si.item_type = 'finished_good' THEN fg.name 
                           ELSE rm.name 
                       END as item_name,
                       CASE 
                           WHEN si.item_type = 'finished_good' THEN fg.code 
                           ELSE rm.code 
                       END as item_code,
                       CASE 
                           WHEN si.item_type = 'finished_good' THEN fg.unit 
                           ELSE rm.unit 
                       END as unit,
                       CASE 
                           WHEN si.item_type = 'finished_good' THEN fg.hsn_code 
                           ELSE rm.hsn_code 
                       END as hsn_code
                FROM sales_invoice_items si
                LEFT JOIN finished_goods fg ON si.item_type = 'finished_good' AND si.item_id = fg.id
                LEFT JOIN raw_materials rm ON si.item_type = 'raw_material' AND si.item_id = rm.id
                WHERE si.invoice_id = ?
                ORDER BY si.id
            ''', (invoice_id,))
            
            invoice['items'] = [dict_from_row(row) for row in cursor.fetchall()]
            
            # Calculate totals from items
            invoice['total_cgst'] = sum(item.get('cgst_amount', 0) for item in invoice['items'])
            invoice['total_sgst'] = sum(item.get('sgst_amount', 0) for item in invoice['items'])
            invoice['total_igst'] = sum(item.get('igst_amount', 0) for item in invoice['items'])
        
        conn.close()
        return invoice
    
    @staticmethod
    def get_by_invoice_no(invoice_no):
        """Get invoice by invoice number"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM sales_invoice WHERE invoice_no = ?', (invoice_no,))
        invoice = dict_from_row(cursor.fetchone())
        conn.close()
        return invoice
    
    @staticmethod
    def create(data):
        """Create new sales invoice"""
        def _create():
            conn = get_db()
            cursor = conn.cursor()
            
            # Generate invoice number
            invoice_no = data.get('invoice_no')
            if invoice_no:
                invoice_no = str(invoice_no).strip()
            if not invoice_no:
                invoice_no = SalesInvoiceModel.generate_invoice_no()
            
            # Calculate totals from items
            items = data.get('items', [])
            
            # Calculate GST totals from items
            cgst_total = sum(item.get('cgst_amount', 0) for item in items)
            sgst_total = sum(item.get('sgst_amount', 0) for item in items)
            igst_total = sum(item.get('igst_amount', 0) for item in items)
            gst_total = cgst_total + sgst_total + igst_total
            
            # Handle bank_id - convert empty string to None
            bank_id = data.get('bank_id')
            if bank_id is not None and str(bank_id).strip() and str(bank_id) != '0':
                try:
                    bank_id = int(bank_id)
                except (ValueError, TypeError):
                    bank_id = None
            else:
                bank_id = None
            
            print(f"💰 Bank ID: {bank_id}")
            print(f"📦 Customer ID: {data.get('customer_id')}")
            print(f"📝 Invoice No: {invoice_no}")
            print(f"📦 Items count: {len(items)}")
            
            # Insert invoice header
            cursor.execute('''
                INSERT INTO sales_invoice (
                    invoice_no, invoice_date, customer_id,
                    bill_to_address, bill_to_city, bill_to_state, bill_to_pincode, bill_to_gst,
                    ship_to_address, ship_to_city, ship_to_state, ship_to_pincode, ship_to_gst,
                    place_of_supply, transport_mode, vehicle_no, challan_no,
                    subtotal, discount, taxable_amount,
                    cgst_total, sgst_total, igst_total, gst_total,
                    grand_total, paid_amount, balance, payment_status,
                    payment_type, bank_id, notes, attachment_path,
                    created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                invoice_no,
                data.get('invoice_date', datetime.now().strftime('%Y-%m-%d')),
                data.get('customer_id'),
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
                data.get('challan_no'),
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
                print(f"📦 Inserting item: {item.get('item_name')} (ID: {item.get('item_id')}, Type: {item.get('item_type')})")
                cursor.execute('''
                    INSERT INTO sales_invoice_items (
                        invoice_id, item_id, item_type,
                        quantity, rate, discount, taxable_value,
                        cgst_rate, sgst_rate, igst_rate,
                        cgst_amount, sgst_amount, igst_amount,
                        total
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    invoice_id,
                    item.get('item_id'),
                    item.get('item_type', 'finished_good'),
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
                    item.get('total', 0)
                ))
                
                # Only deduct stock if no delivery challan is linked
                if not data.get('challan_no'):
                    item_type = item.get('item_type', 'finished_good')
                    table = 'finished_goods' if item_type == 'finished_good' else 'raw_materials'
                    cursor.execute(f'''
                        UPDATE {table} 
                        SET current_stock = current_stock - ?, updated_at = datetime('now')
                        WHERE id = ?
                    ''', (item.get('quantity', 0), item.get('item_id')))
            
            # Post Journal Entry!
            try:
                AccountingHook.post_sales_invoice(
                    cursor,
                    invoice_no, 
                    data.get('customer_id'),
                    data.get('taxable_amount', 0),
                    cgst_total, sgst_total, igst_total,
                    data.get('grand_total', 0)
                )
                print("✅ Auto-posted Journal Entry for Sales Invoice.")
            except Exception as j_err:
                print(f"❌ Failed to auto-post Journal Entry: {j_err}")
                # Don't fail the invoice creation just because of journal error for now
                pass

            conn.commit()
            # DON'T close the connection here - let Flask handle it
            return {'id': invoice_id, 'invoice_no': invoice_no, 'message': 'Invoice created successfully'}
        
        return SalesInvoiceModel.execute_with_retry(_create)
    
    @staticmethod
    def update(invoice_id, data):
        """Update existing sales invoice"""
        def _update():
            conn = get_db()
            cursor = conn.cursor()
            
            # Fetch old invoice and items to reverse stock
            cursor.execute('SELECT challan_no FROM sales_invoice WHERE id = ?', (invoice_id,))
            old_invoice = cursor.fetchone()
            old_challan_no = old_invoice['challan_no'] if old_invoice else None
            
            if not old_challan_no:
                cursor.execute('SELECT item_id, quantity, item_type FROM sales_invoice_items WHERE invoice_id = ?', (invoice_id,))
                old_items = cursor.fetchall()
                for old_item in old_items:
                    item_type = old_item['item_type']
                    table_name = 'finished_goods' if item_type == 'finished_good' else 'raw_materials'
                    cursor.execute(f'''
                        UPDATE {table_name} 
                        SET current_stock = current_stock + ?, updated_at = datetime('now')
                        WHERE id = ?
                    ''', (old_item['quantity'], old_item['item_id']))
                    
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
            
            print(f"💰 Updating invoice {invoice_id} with bank_id: {bank_id}")
            
            # Update invoice header
            cursor.execute('''
                UPDATE sales_invoice SET
                    invoice_date = ?,
                    customer_id = ?,
                    challan_no = ?,
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
                data.get('customer_id'),
                data.get('challan_no'),
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
            
            # Delete existing items
            cursor.execute('DELETE FROM sales_invoice_items WHERE invoice_id = ?', (invoice_id,))
            
            # Insert updated items
            for item in items:
                cursor.execute('''
                    INSERT INTO sales_invoice_items (
                        invoice_id, item_id, item_type,
                        quantity, rate, discount, taxable_value,
                        cgst_rate, sgst_rate, igst_rate,
                        cgst_amount, sgst_amount, igst_amount,
                        total
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    invoice_id,
                    item.get('item_id'),
                    item.get('item_type', 'finished_good'),
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
                    item.get('total', 0)
                ))
                
                # Only deduct stock if no delivery challan is linked
                if not data.get('challan_no'):
                    item_type = item.get('item_type', 'finished_good')
                    table = 'finished_goods' if item_type == 'finished_good' else 'raw_materials'
                    cursor.execute(f'''
                        UPDATE {table} 
                        SET current_stock = current_stock - ?, updated_at = datetime('now')
                        WHERE id = ?
                    ''', (item.get('quantity', 0), item.get('item_id')))
            
            conn.commit()
            # DON'T close the connection here - let Flask handle it
            return {'message': 'Invoice updated successfully', 'id': invoice_id}
        
        return SalesInvoiceModel.execute_with_retry(_update)
    
    @staticmethod
    def delete(invoice_id):
        """Delete invoice"""
        def _delete():
            conn = get_db()
            cursor = conn.cursor()
            
            # Fetch invoice to see if we need to revert stock
            cursor.execute('SELECT challan_no FROM sales_invoice WHERE id = ?', (invoice_id,))
            old_invoice = cursor.fetchone()
            
            if old_invoice and not old_invoice['challan_no']:
                cursor.execute('SELECT item_id, quantity, item_type FROM sales_invoice_items WHERE invoice_id = ?', (invoice_id,))
                old_items = cursor.fetchall()
                for old_item in old_items:
                    item_type = old_item['item_type']
                    table_name = 'finished_goods' if item_type == 'finished_good' else 'raw_materials'
                    cursor.execute(f'''
                        UPDATE {table_name} 
                        SET current_stock = current_stock + ?, updated_at = datetime('now')
                        WHERE id = ?
                    ''', (old_item['quantity'], old_item['item_id']))
                    
            cursor.execute('DELETE FROM sales_invoice WHERE id = ?', (invoice_id,))
            conn.commit()
            return {'message': 'Invoice deleted successfully'}
        
        return SalesInvoiceModel.execute_with_retry(_delete)
    
    @staticmethod
    def get_customer_outstanding(customer_id):
        """Get customer outstanding balance"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT COALESCE(SUM(balance), 0) as outstanding
            FROM sales_invoice
            WHERE customer_id = ? AND payment_status != 'paid'
        ''', (customer_id,))
        result = cursor.fetchone()
        conn.close()
        return result['outstanding'] if result else 0
    
    @staticmethod
    def get_dashboard_stats():
        """Get sales statistics for dashboard"""
        conn = get_db()
        cursor = conn.cursor()
        
        today = datetime.now().strftime('%Y-%m-%d')
        month_start = datetime.now().strftime('%Y-%m-01')
        
        stats = {}
        
        # Today's sales
        cursor.execute('''
            SELECT COALESCE(COUNT(*), 0) as count, COALESCE(SUM(grand_total), 0) as total
            FROM sales_invoice
            WHERE date(invoice_date) = ?
        ''', (today,))
        row = cursor.fetchone()
        stats['today_invoices'] = row['count']
        stats['today_sales'] = row['total']
        
        # Monthly sales
        cursor.execute('''
            SELECT COALESCE(COUNT(*), 0) as count, COALESCE(SUM(grand_total), 0) as total
            FROM sales_invoice
            WHERE invoice_date >= ?
        ''', (month_start,))
        row = cursor.fetchone()
        stats['month_invoices'] = row['count']
        stats['month_sales'] = row['total']
        
        # Pending payments
        cursor.execute('''
            SELECT COALESCE(SUM(balance), 0) as total
            FROM sales_invoice
            WHERE payment_status != 'paid'
        ''')
        stats['pending_payments'] = cursor.fetchone()['total']
        
        conn.close()
        return stats

    @staticmethod
    def update_attachment(invoice_id, attachment_path):
        """Update attachment path of a sales invoice"""
        def _update():
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE sales_invoice 
                SET attachment_path = ? 
                WHERE id = ?
            ''', (attachment_path, invoice_id))
            conn.commit()
            return {'message': 'Attachment updated successfully'}
        return SalesInvoiceModel.execute_with_retry(_update)