from flask import Blueprint, request, jsonify
import sqlite3
import os
from datetime import datetime
import traceback

vendor_ledger_bp = Blueprint('vendor_ledger', __name__)

# Fix: Use manufacturing.db with correct path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                       "database", "manufacturing.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row):
    """Convert sqlite3.Row to dict"""
    if row is None:
        return None
    return dict(row)


def get_purchase_invoice_items(invoice_no, cursor):
    """Get items for a purchase invoice using invoice number - joins with raw_materials/finished_goods"""
    try:
        print(f"🔍 Looking for items for purchase invoice: {invoice_no}")
        
        # Get the invoice ID from the invoice number
        cursor.execute('''
            SELECT id FROM purchase_invoice WHERE invoice_no = ?
        ''', (invoice_no,))
        
        invoice_row = cursor.fetchone()
        
        if not invoice_row:
            print(f"❌ Purchase Invoice {invoice_no} not found in purchase_invoice table")
            return []
        
        invoice_id = invoice_row['id']
        print(f"✅ Found invoice ID: {invoice_id} for purchase invoice {invoice_no}")
        
        # Now get items using invoice_id with JOIN to get item names
        cursor.execute('''
            SELECT 
                pi.item_id,
                pi.item_type,
                pi.quantity,
                pi.rate,
                CASE 
                    WHEN pi.item_type = 'raw_material' THEN rm.name 
                    ELSE fg.name 
                END as item_name,
                CASE 
                    WHEN pi.item_type = 'raw_material' THEN rm.unit 
                    ELSE fg.unit 
                END as unit,
                (pi.quantity * pi.rate) as amount
            FROM purchase_invoice_items pi
            LEFT JOIN raw_materials rm ON pi.item_type = 'raw_material' AND pi.item_id = rm.id
            LEFT JOIN finished_goods fg ON pi.item_type = 'finished_good' AND pi.item_id = fg.id
            WHERE pi.invoice_id = ?
        ''', (invoice_id,))
        
        items = []
        for row in cursor.fetchall():
            item = dict_from_row(row)
            if item:
                item_name = item.get('item_name')
                if not item_name or item_name == '':
                    if item.get('item_type') == 'raw_material':
                        item_name = f"Raw Material ID: {item.get('item_id')}"
                    else:
                        item_name = f"Finished Good ID: {item.get('item_id')}"
                
                items.append({
                    'item_name': item_name,
                    'quantity': item['quantity'] or 0,
                    'rate': item['rate'] or 0,
                    'unit': item.get('unit', 'KG'),
                    'amount': (item['quantity'] or 0) * (item['rate'] or 0)
                })
        
        print(f"📦 Found {len(items)} items for purchase invoice {invoice_no}")
        return items
        
    except Exception as e:
        print(f"❌ Error fetching items for purchase invoice {invoice_no}: {e}")
        traceback.print_exc()
        return []


# ==============================================
# GET: Fetch vendor ledger with transactions
# ==============================================
@vendor_ledger_bp.route('/api/vendor-ledger/<int:vendor_id>', methods=['GET'])
def get_vendor_ledger(vendor_id):
    """Get complete ledger for a vendor with correct opening balance for date range"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        print(f"\n=== VENDOR LEDGER REQUEST for ID: {vendor_id} ===")

        # Get vendor details
        cursor.execute("SELECT * FROM vendors WHERE id = ?", (vendor_id,))
        vendor = cursor.fetchone()

        if not vendor:
            conn.close()
            return jsonify({'error': 'Vendor not found'}), 404

        vendor_dict = dict_from_row(vendor)
        print(f"Vendor found: {vendor_dict.get('name')}")

        # Get date range from query params
        from_date = request.args.get('from_date', '2000-01-01')
        to_date = request.args.get('to_date', datetime.now().strftime('%Y-%m-%d'))

        print(f"Date range: {from_date} to {to_date}")

        # Calculate opening balance for this date range
        cursor.execute('''
            SELECT 
                COALESCE((
                    SELECT SUM(grand_total) FROM purchase_invoice 
                    WHERE vendor_id = ? AND invoice_date < ?
                ), 0) as purchases_before,
                COALESCE((
                    SELECT SUM(amount) FROM vendor_payments 
                    WHERE vendor_id = ? AND payment_date < ?
                ), 0) as payments_before,
                COALESCE((
                    SELECT SUM(je.credit - je.debit) 
                    FROM journal_entries je
                    JOIN journal_vouchers jv ON je.voucher_id = jv.id
                    WHERE je.party_type = 'vendor' AND je.party_id = ? AND jv.voucher_date < ?
                ), 0) as journals_before
        ''', (vendor_id, from_date, vendor_id, from_date, vendor_id, from_date))

        before_totals = dict_from_row(cursor.fetchone())
        
        opening_balance = float(vendor_dict.get('opening_balance', 0) or 0)
        opening_balance_for_range = opening_balance + before_totals['purchases_before'] - before_totals['payments_before'] + before_totals['journals_before']
        
        print(f"Opening balance for period: {opening_balance_for_range}")

        # Get all transactions within date range
        cursor.execute('''
            SELECT 
                invoice_date as transaction_date,
                'PURCHASE' as transaction_type,
                invoice_no as reference_no,
                COALESCE(notes, 'Purchase Invoice') as description,
                0 as debit,
                grand_total as credit
            FROM purchase_invoice 
            WHERE vendor_id = ? 
                AND invoice_date BETWEEN ? AND ?
            
            UNION ALL
            
            SELECT 
                vp.payment_date as transaction_date,
                'PAYMENT' as transaction_type,
                vp.payment_no as reference_no,
                CASE 
                    WHEN pi.invoice_no IS NOT NULL THEN 'Payment Made (Allocated to ' || pi.invoice_no || ')'
                    ELSE COALESCE(vp.notes, 'Payment Made')
                END as description,
                vp.amount as debit,
                0 as credit
            FROM vendor_payments vp
            LEFT JOIN purchase_invoice pi ON vp.invoice_id = pi.id
            WHERE vp.vendor_id = ? 
                AND vp.payment_date BETWEEN ? AND ?
                
            UNION ALL
            
            SELECT 
                jv.voucher_date as transaction_date,
                'JOURNAL' as transaction_type,
                jv.voucher_no as reference_no,
                COALESCE(je.notes, jv.notes, 'Journal Entry') as description,
                je.debit as debit,
                je.credit as credit
            FROM journal_entries je
            JOIN journal_vouchers jv ON je.voucher_id = jv.id
            WHERE je.party_type = 'vendor' AND je.party_id = ? 
                AND jv.voucher_date BETWEEN ? AND ?
            
            ORDER BY transaction_date
        ''', (
            vendor_id, from_date, to_date,
            vendor_id, from_date, to_date,
            vendor_id, from_date, to_date
        ))

        transactions_raw = cursor.fetchall()
        
        transactions = []
        for row in transactions_raw:
            trans = dict_from_row(row)
            if trans:
                if trans['transaction_type'] == 'PURCHASE' and trans['reference_no']:
                    trans['items'] = get_purchase_invoice_items(trans['reference_no'], cursor)
                else:
                    trans['items'] = []
                transactions.append(trans)
        
        print(f"Found {len(transactions)} transactions")

        # Build final transactions list
        final_transactions = []
        
        if transactions or opening_balance_for_range != 0:
            final_transactions.append({
                'transaction_type': 'OPENING',
                'reference_no': '-',
                'transaction_date': from_date,
                'debit': 0,
                'credit': 0,
                'description': f'Opening Balance (as on {from_date})',
                'items': [],
                'balance': opening_balance_for_range
            })
        
        running_balance = opening_balance_for_range
        for trans in transactions:
            running_balance = running_balance - trans['debit'] + trans['credit']
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

        # Calculate summary
        cursor.execute('''
            SELECT COALESCE(SUM(grand_total), 0) as total_purchases
            FROM purchase_invoice 
            WHERE vendor_id = ? 
                AND invoice_date BETWEEN ? AND ?
        ''', (vendor_id, from_date, to_date))
        total_purchases = dict_from_row(cursor.fetchone())['total_purchases']
        
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total_payments
            FROM vendor_payments 
            WHERE vendor_id = ? 
                AND payment_date BETWEEN ? AND ?
        ''', (vendor_id, from_date, to_date))
        total_payments = dict_from_row(cursor.fetchone())['total_payments']
        
        cursor.execute('''
            SELECT MAX(transaction_date) as last_transaction_date FROM (
                SELECT MAX(invoice_date) as transaction_date FROM purchase_invoice WHERE vendor_id = ?
                UNION ALL
                SELECT MAX(payment_date) as transaction_date FROM vendor_payments WHERE vendor_id = ?
            )
        ''', (vendor_id, vendor_id))
        last_transaction = dict_from_row(cursor.fetchone())
        
        cursor.execute('''
            SELECT COUNT(*) as total_invoices
            FROM purchase_invoice 
            WHERE vendor_id = ?
        ''', (vendor_id,))
        total_invoices = dict_from_row(cursor.fetchone())['total_invoices']
        
        cursor.execute('''
            SELECT COALESCE(SUM(grand_total), 0) as total_all_purchases
            FROM purchase_invoice 
            WHERE vendor_id = ?
        ''', (vendor_id,))
        total_all_purchases = dict_from_row(cursor.fetchone())['total_all_purchases']
        avg_invoice = total_all_purchases / total_invoices if total_invoices > 0 else 0
        
        cursor.execute('''
            SELECT 
                COALESCE((
                    SELECT SUM(grand_total) FROM purchase_invoice WHERE vendor_id = ?
                ), 0) as total_all_purchases,
                COALESCE((
                    SELECT SUM(amount) FROM vendor_payments WHERE vendor_id = ?
                ), 0) as total_all_payments,
                COALESCE((
                    SELECT SUM(credit - debit) FROM journal_entries WHERE party_type = 'vendor' AND party_id = ?
                ), 0) as total_all_journals
        ''', (vendor_id, vendor_id, vendor_id))
        all_totals = dict_from_row(cursor.fetchone())
        
        current_balance = opening_balance + all_totals['total_all_purchases'] - all_totals['total_all_payments'] + all_totals['total_all_journals']
        net_change = total_purchases - total_payments
        
        conn.close()

        return jsonify({
            'success': True,
            'vendor': {
                'id': vendor_dict['id'],
                'code': vendor_dict.get('code', ''),
                'name': vendor_dict.get('name', ''),
                'address': vendor_dict.get('address', ''),
                'city': vendor_dict.get('city', ''),
                'state': vendor_dict.get('state', ''),
                'pincode': vendor_dict.get('pincode', ''),
                'gst': vendor_dict.get('gst', ''),
                'phone': vendor_dict.get('phone', ''),
                'email': vendor_dict.get('email', ''),
                'credit_limit': vendor_dict.get('credit_limit', 0),
                'credit_days': vendor_dict.get('credit_days', 0),
                'opening_balance': opening_balance,
                'current_balance': current_balance
            },
            'transactions': final_transactions,
            'summary': {
                'total_purchases': total_purchases,
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
        }), 200

    except Exception as e:
        print(f"❌ Error fetching vendor ledger: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ==============================================
# GET: Fetch outstanding vendors (FIXED)
# ==============================================
@vendor_ledger_bp.route('/api/vendor-ledger/outstanding', methods=['GET'])
def get_outstanding_vendors():
    """Get outstanding balances for all vendors up to a specific date"""
    try:
        to_date = request.args.get('to_date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # Debug: Check what's in the database
        cursor.execute("SELECT COUNT(*) as count FROM vendors WHERE is_active = 1 OR is_active IS NULL")
        vendor_count = dict_from_row(cursor.fetchone())
        print(f"📊 Total active vendors: {vendor_count['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM purchase_invoice")
        invoice_count = dict_from_row(cursor.fetchone())
        print(f"📊 Total purchase invoices: {invoice_count['count']}")
        
        cursor.execute("SELECT COUNT(*) as count FROM vendor_payments")
        payment_count = dict_from_row(cursor.fetchone())
        print(f"📊 Total vendor payments: {payment_count['count']}")

        # Get all vendors with their purchase and payment totals up to to_date
        cursor.execute('''
            SELECT 
                v.id, 
                v.code, 
                v.name, 
                v.phone, 
                v.city,
                v.address,
                v.gst,
                COALESCE(v.opening_balance, 0) as opening_balance,
                COALESCE((
                    SELECT SUM(grand_total) FROM purchase_invoice 
                    WHERE vendor_id = v.id AND invoice_date <= ?
                ), 0) as total_purchases,
                COALESCE((
                    SELECT SUM(amount) FROM vendor_payments 
                    WHERE vendor_id = v.id AND payment_date <= ?
                ), 0) as total_payments,
                COALESCE((
                    SELECT SUM(je.credit - je.debit) 
                    FROM journal_entries je
                    JOIN journal_vouchers jv ON je.voucher_id = jv.id
                    WHERE je.party_type = 'vendor' AND je.party_id = v.id AND jv.voucher_date <= ?
                ), 0) as total_journals
            FROM vendors v
            WHERE v.is_active = 1 OR v.is_active IS NULL
            ORDER BY v.name
        ''', (to_date, to_date, to_date))

        vendors = []
        total_outstanding = 0

        for row in cursor.fetchall():
            vendor = dict_from_row(row)
            if vendor:
                # Calculate outstanding based on date range
                opening = float(vendor.get('opening_balance', 0) or 0)
                purchases = float(vendor.get('total_purchases', 0) or 0)
                payments = float(vendor.get('total_payments', 0) or 0)
                journals = float(vendor.get('total_journals', 0) or 0)
                
                # Method 1: Opening + Purchases - Payments + Journals (accurate for dates)
                calculated_outstanding = opening + purchases - payments + journals
                
                vendor['outstanding'] = calculated_outstanding
                vendor['total_purchases'] = purchases
                vendor['total_payments'] = payments
                total_outstanding += calculated_outstanding
                vendors.append(vendor)
                
                print(f"📌 Vendor: {vendor['name']} | Opening: {opening} | Purchases: {purchases} | Payments: {payments} | Outstanding: {calculated_outstanding}")

        # Sort by outstanding amount (highest first)
        vendors.sort(key=lambda x: x['outstanding'], reverse=True)

        conn.close()

        return jsonify({
            'success': True,
            'vendors': vendors,
            'total_outstanding': total_outstanding,
            'total_vendors': len(vendors),
            'as_on_date': datetime.now().strftime('%Y-%m-%d')
        }), 200

    except Exception as e:
        print(f"❌ Error fetching outstanding vendors: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ==============================================
# POST: Record vendor payment
# ==============================================
@vendor_ledger_bp.route('/api/vendor-ledger/payment', methods=['POST'])
def record_vendor_payment():
    """Record a vendor payment"""
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        payment_no = f"PAY{datetime.now().strftime('%y%m%d%H%M%S')}"
        
        cursor.execute('''
            INSERT INTO vendor_payments (
                payment_no, vendor_id, payment_date, amount,
                payment_mode, reference_no, bank_id, notes, status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            payment_no,
            data['vendor_id'],
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
            'payment_no': payment_no,
            'message': 'Payment recorded successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error recording vendor payment: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500