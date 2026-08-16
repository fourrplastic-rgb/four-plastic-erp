"""
Customer Ledger Routes - API endpoints for customer ledger
"""
from flask import Blueprint, request, jsonify
from config.database import get_db, dict_from_row
from datetime import datetime
import traceback

customer_ledger_bp = Blueprint('customer_ledger', __name__, url_prefix='/api/customer-ledger')

def get_invoice_items(invoice_no, cursor):
    """Get items for a sales invoice using invoice number - joins with finished_goods/raw_materials"""
    try:
        print(f"🔍 Looking for items for invoice: {invoice_no}")
        
        # Get the invoice ID from the invoice number
        cursor.execute('''
            SELECT id FROM sales_invoice WHERE invoice_no = ?
        ''', (invoice_no,))
        
        invoice_row = cursor.fetchone()
        
        if not invoice_row:
            print(f"❌ Invoice {invoice_no} not found in sales_invoice table")
            return []
        
        invoice_id = invoice_row['id']
        print(f"✅ Found invoice ID: {invoice_id} for invoice {invoice_no}")
        
        # Now get items using invoice_id with JOIN to get item names
        cursor.execute('''
            SELECT 
                si.item_id,
                si.item_type,
                si.quantity,
                si.rate,
                CASE 
                    WHEN si.item_type = 'finished_good' THEN fg.name 
                    ELSE rm.name 
                END as item_name,
                CASE 
                    WHEN si.item_type = 'finished_good' THEN fg.unit 
                    ELSE rm.unit 
                END as unit,
                (si.quantity * si.rate) as amount
            FROM sales_invoice_items si
            LEFT JOIN finished_goods fg ON si.item_type = 'finished_good' AND si.item_id = fg.id
            LEFT JOIN raw_materials rm ON si.item_type = 'raw_material' AND si.item_id = rm.id
            WHERE si.invoice_id = ?
        ''', (invoice_id,))
        
        items = []
        for row in cursor.fetchall():
            item = dict_from_row(row)
            if item:
                # Get item name from the joined tables
                item_name = item.get('item_name')
                if not item_name or item_name == '':
                    # Fallback if no name found
                    if item.get('item_type') == 'finished_good':
                        item_name = f"Finished Good ID: {item.get('item_id')}"
                    else:
                        item_name = f"Raw Material ID: {item.get('item_id')}"
                
                items.append({
                    'item_name': item_name,
                    'quantity': item['quantity'] or 0,
                    'rate': item['rate'] or 0,
                    'unit': item.get('unit', 'KG'),
                    'amount': (item['quantity'] or 0) * (item['rate'] or 0)
                })
        
        print(f"📦 Found {len(items)} items for invoice {invoice_no}")
        for item in items:
            print(f"   - {item['item_name']}: {item['quantity']} × {item['rate']} = {item['amount']}")
        
        return items
        
    except Exception as e:
        print(f"❌ Error fetching items for invoice {invoice_no}: {e}")
        traceback.print_exc()
        return []

@customer_ledger_bp.route('/<int:customer_id>', methods=['GET'])
def get_customer_ledger(customer_id):
    """Get complete ledger for a customer with correct opening balance for date range"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get customer details
        cursor.execute('''
            SELECT id, code, name, address, city, state, pincode, 
                   gst, phone, email, credit_limit, credit_days,
                   opening_balance, current_balance, created_at
            FROM customers 
            WHERE id = ? AND is_active = 1
        ''', (customer_id,))
        
        customer = dict_from_row(cursor.fetchone())
        
        if not customer:
            conn.close()
            return jsonify({'error': 'Customer not found'}), 404
        
        # Get date range from query params
        from_date = request.args.get('from_date', '2000-01-01')
        to_date = request.args.get('to_date', datetime.now().strftime('%Y-%m-%d'))
        
        # Calculate opening balance for this date range
        cursor.execute('''
            SELECT 
                COALESCE((
                    SELECT SUM(grand_total) FROM sales_invoice 
                    WHERE customer_id = ? AND invoice_date < ?
                ), 0) as sales_before,
                COALESCE((
                    SELECT SUM(amount) FROM customer_payments 
                    WHERE customer_id = ? AND payment_date < ?
                ), 0) as payments_before,
                COALESCE((
                    SELECT SUM(je.debit - je.credit) 
                    FROM journal_entries je
                    JOIN journal_vouchers jv ON je.voucher_id = jv.id
                    WHERE je.party_type = 'customer' AND je.party_id = ? AND jv.voucher_date < ?
                ), 0) as journals_before
        ''', (customer_id, from_date, customer_id, from_date, customer_id, from_date))
        
        before_totals = dict_from_row(cursor.fetchone())
        
        # Calculate opening balance for this date range
        opening_balance_for_range = customer['opening_balance'] + before_totals['sales_before'] - before_totals['payments_before'] + before_totals['journals_before']
        
        # Get all transactions within date range
        cursor.execute('''
            -- Sales Invoices within date range
            SELECT 
                'SALES' as transaction_type,
                invoice_no as reference_no,
                invoice_date as transaction_date,
                grand_total as debit,
                0 as credit,
                COALESCE(notes, 'Sales Invoice') as description
            FROM sales_invoice 
            WHERE customer_id = ? 
                AND invoice_date BETWEEN ? AND ?
            
            UNION ALL
            
            -- Customer Payments within date range
            SELECT 
                'PAYMENT' as transaction_type,
                cp.receipt_no as reference_no,
                cp.payment_date as transaction_date,
                0 as debit,
                cp.amount as credit,
                CASE 
                    WHEN si.invoice_no IS NOT NULL THEN 'Payment Received (Allocated to ' || si.invoice_no || ')'
                    ELSE COALESCE(cp.notes, 'Payment Received')
                END as description
            FROM customer_payments cp
            LEFT JOIN sales_invoice si ON cp.invoice_id = si.id
            WHERE cp.customer_id = ? 
                AND cp.payment_date BETWEEN ? AND ?
                
            UNION ALL
            
            -- Journal Entries within date range
            SELECT 
                'JOURNAL' as transaction_type,
                jv.voucher_no as reference_no,
                jv.voucher_date as transaction_date,
                je.debit as debit,
                je.credit as credit,
                COALESCE(je.notes, jv.notes, 'Journal Entry') as description
            FROM journal_entries je
            JOIN journal_vouchers jv ON je.voucher_id = jv.id
            WHERE je.party_type = 'customer' AND je.party_id = ? 
                AND jv.voucher_date BETWEEN ? AND ?
            
            ORDER BY transaction_date
        ''', (
            customer_id, from_date, to_date,
            customer_id, from_date, to_date,
            customer_id, from_date, to_date
        ))
        
        transactions_raw = cursor.fetchall()
        
        # Convert to list of dicts and ADD ITEMS for sales transactions
        transactions = []
        for row in transactions_raw:
            trans = dict_from_row(row)
            if trans:
                # ✅ ADD ITEMS TO SALES TRANSACTIONS (pass cursor)
                if trans['transaction_type'] == 'SALES' and trans['reference_no']:
                    trans['items'] = get_invoice_items(trans['reference_no'], cursor)
                else:
                    trans['items'] = []
                transactions.append(trans)
        
        # Build final transactions list with opening balance
        final_transactions = []
        
        # Add opening balance as first transaction
        if transactions or opening_balance_for_range != 0:
            final_transactions.append({
                'transaction_type': 'OPENING',
                'reference_no': None,
                'transaction_date': from_date,
                'debit': 0,
                'credit': 0,
                'description': f'Opening Balance (as on {from_date})',
                'items': [],
                'balance': opening_balance_for_range
            })
        
        # Add all transactions with running balance
        running_balance = opening_balance_for_range
        for trans in transactions:
            running_balance = running_balance + trans['debit'] - trans['credit']
            final_transactions.append({
                'transaction_type': trans['transaction_type'],
                'reference_no': trans['reference_no'],
                'transaction_date': trans['transaction_date'],
                'debit': trans['debit'],
                'credit': trans['credit'],
                'description': trans['description'],
                'items': trans.get('items', []),
                'balance': running_balance
            })
        
        # Calculate summary for the date range
        cursor.execute('''
            SELECT COALESCE(SUM(grand_total), 0) as total_sales
            FROM sales_invoice 
            WHERE customer_id = ? 
                AND invoice_date BETWEEN ? AND ?
        ''', (customer_id, from_date, to_date))
        total_sales = dict_from_row(cursor.fetchone())['total_sales']
        
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total_payments
            FROM customer_payments 
            WHERE customer_id = ? 
                AND payment_date BETWEEN ? AND ?
        ''', (customer_id, from_date, to_date))
        total_payments = dict_from_row(cursor.fetchone())['total_payments']
        
        cursor.execute('''
            SELECT MAX(transaction_date) as last_transaction_date FROM (
                SELECT MAX(invoice_date) as transaction_date FROM sales_invoice WHERE customer_id = ?
                UNION ALL
                SELECT MAX(payment_date) as transaction_date FROM customer_payments WHERE customer_id = ?
            )
        ''', (customer_id, customer_id))
        last_transaction = dict_from_row(cursor.fetchone())
        
        cursor.execute('''
            SELECT COUNT(*) as total_invoices
            FROM sales_invoice 
            WHERE customer_id = ?
        ''', (customer_id,))
        total_invoices = dict_from_row(cursor.fetchone())['total_invoices']
        
        cursor.execute('''
            SELECT COALESCE(SUM(grand_total), 0) as total_all_sales
            FROM sales_invoice 
            WHERE customer_id = ?
        ''', (customer_id,))
        total_all_sales = dict_from_row(cursor.fetchone())['total_all_sales']
        avg_invoice = total_all_sales / total_invoices if total_invoices > 0 else 0
        
        cursor.execute('''
            SELECT 
                COALESCE((
                    SELECT SUM(grand_total) FROM sales_invoice WHERE customer_id = ?
                ), 0) as total_all_sales,
                COALESCE((
                    SELECT SUM(amount) FROM customer_payments WHERE customer_id = ?
                ), 0) as total_all_payments,
                COALESCE((
                    SELECT SUM(debit - credit) FROM journal_entries WHERE party_type = 'customer' AND party_id = ?
                ), 0) as total_all_journals
        ''', (customer_id, customer_id, customer_id))
        all_totals = dict_from_row(cursor.fetchone())
        
        current_balance = customer['opening_balance'] + all_totals['total_all_sales'] - all_totals['total_all_payments'] + all_totals['total_all_journals']
        net_change = total_sales - total_payments
        
        conn.close()
        
        return jsonify({
            'customer': {
                'id': customer['id'],
                'code': customer['code'],
                'name': customer['name'],
                'address': customer['address'],
                'city': customer['city'],
                'state': customer['state'],
                'pincode': customer['pincode'],
                'gst': customer['gst'],
                'phone': customer['phone'],
                'email': customer['email'],
                'credit_limit': customer['credit_limit'],
                'credit_days': customer['credit_days'],
                'opening_balance': customer['opening_balance'],
                'current_balance': current_balance
            },
            'transactions': final_transactions,
            'summary': {
                'total_sales': total_sales,
                'total_payments': total_payments,
                'total_invoices': total_invoices,
                'avg_invoice': avg_invoice,
                'last_transaction_date': last_transaction['last_transaction_date'] if last_transaction else None,
                'opening_balance_for_range': opening_balance_for_range,
                'closing_balance': running_balance if final_transactions else opening_balance_for_range,
                'net_change': net_change
            },
            'from_date': from_date,
            'to_date': to_date
        })
        
    except Exception as e:
        print(f"❌ Error fetching customer ledger: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@customer_ledger_bp.route('/outstanding', methods=['GET'])
def get_all_outstanding():
    """Get outstanding balances for all customers up to a specific date"""
    try:
        to_date = request.args.get('to_date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                c.id, 
                c.code, 
                c.name, 
                c.phone, 
                c.city,
                c.credit_limit, 
                c.credit_days,
                c.opening_balance,
                COALESCE((
                    SELECT SUM(grand_total) FROM sales_invoice 
                    WHERE customer_id = c.id AND invoice_date <= ?
                ), 0) as total_sales,
                COALESCE((
                    SELECT SUM(amount) FROM customer_payments 
                    WHERE customer_id = c.id AND payment_date <= ?
                ), 0) as total_payments,
                COALESCE((
                    SELECT SUM(je.debit - je.credit) 
                    FROM journal_entries je
                    JOIN journal_vouchers jv ON je.voucher_id = jv.id
                    WHERE je.party_type = 'customer' AND je.party_id = c.id AND jv.voucher_date <= ?
                ), 0) as total_journals,
                COALESCE(MAX(si.invoice_date), 'No transactions') as last_transaction,
                COUNT(DISTINCT si.id) as invoice_count
            FROM customers c
            LEFT JOIN sales_invoice si ON c.id = si.customer_id AND si.invoice_date <= ?
            WHERE c.is_active = 1
            GROUP BY c.id
        ''', (to_date, to_date, to_date, to_date))
        
        customers = []
        total_outstanding = 0
        
        for row in cursor.fetchall():
            customer = dict_from_row(row)
            if customer:
                outstanding = customer['opening_balance'] + customer['total_sales'] - customer['total_payments'] + customer['total_journals']
                customer['outstanding'] = outstanding
                total_outstanding += outstanding
                customers.append(customer)
        
        customers.sort(key=lambda x: x['outstanding'], reverse=True)
        
        conn.close()
        
        return jsonify({
            'customers': customers,
            'total_outstanding': total_outstanding,
            'total_customers': len(customers)
        })
        
    except Exception as e:
        print(f"❌ Error fetching outstanding: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@customer_ledger_bp.route('/payment', methods=['POST'])
def record_payment():
    """Record a customer payment"""
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        receipt_no = f"RCPT{datetime.now().strftime('%y%m%d%H%M%S')}"
        
        cursor.execute('''
            INSERT INTO customer_payments (
                receipt_no, customer_id, payment_date, amount,
                payment_mode, reference_no, bank_id, notes, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            receipt_no,
            data['customer_id'],
            data['payment_date'],
            data['amount'],
            data['payment_mode'],
            data.get('reference_no'),
            data.get('bank_id'),
            data.get('notes'),
            'completed',
            data.get('created_by', 1)
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'receipt_no': receipt_no,
            'message': 'Payment recorded successfully'
        })
        
    except Exception as e:
        print(f"❌ Error recording payment: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500