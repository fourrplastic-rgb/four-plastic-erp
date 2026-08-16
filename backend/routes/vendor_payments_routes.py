"""
Vendor Payments Routes - API endpoints for vendor payments with invoice-wise matching
"""
from flask import Blueprint, request, jsonify
from config.database import get_db, dict_from_row
from datetime import datetime
import traceback
from models.accounting_hook import AccountingHook

vendor_payments_bp = Blueprint('vendor_payments', __name__, url_prefix='/api/vendor-payments')

@vendor_payments_bp.route('', methods=['GET'])
def get_payments():
    """Get all vendor payments with optional date filter"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        from_date = request.args.get('from', '2000-01-01')
        to_date = request.args.get('to', datetime.now().strftime('%Y-%m-%d'))
        
        company_id = request.args.get('company_id')
        
        if company_id:
            cursor.execute('''
                SELECT vp.*, v.name as vendor_name, v.code as vendor_code, pi.invoice_no as invoice_no 
                FROM vendor_payments vp
                JOIN vendors v ON vp.vendor_id = v.id
                LEFT JOIN purchase_invoice pi ON vp.invoice_id = pi.id
                WHERE vp.payment_date BETWEEN ? AND ? AND vp.company_id = ?
                ORDER BY vp.payment_date DESC, vp.id DESC
            ''', (from_date, to_date, company_id))
        else:
            cursor.execute('''
                SELECT vp.*, v.name as vendor_name, v.code as vendor_code, pi.invoice_no as invoice_no 
                FROM vendor_payments vp
                JOIN vendors v ON vp.vendor_id = v.id
                LEFT JOIN purchase_invoice pi ON vp.invoice_id = pi.id
                WHERE vp.payment_date BETWEEN ? AND ?
                ORDER BY vp.payment_date DESC, vp.id DESC
            ''', (from_date, to_date))
        
        payments = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(payments)
        
    except Exception as e:
        print(f"❌ Error fetching vendor payments: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@vendor_payments_bp.route('/<int:payment_id>', methods=['GET'])
def get_payment(payment_id):
    """Get single vendor payment by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT vp.*, v.name as vendor_name, v.code as vendor_code, pi.invoice_no as invoice_no
            FROM vendor_payments vp
            JOIN vendors v ON vp.vendor_id = v.id
            LEFT JOIN purchase_invoice pi ON vp.invoice_id = pi.id
            WHERE vp.id = ?
        ''', (payment_id,))
        
        payment = dict_from_row(cursor.fetchone())
        conn.close()
        
        if payment:
            return jsonify(payment)
        return jsonify({'error': 'Payment not found'}), 404
        
    except Exception as e:
        print(f"❌ Error fetching payment: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@vendor_payments_bp.route('/open-invoices/<int:vendor_id>', methods=['GET'])
def get_open_invoices(vendor_id):
    """Get all unpaid/partially paid purchase invoices for a vendor"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, invoice_no, invoice_date, grand_total, paid_amount, balance, payment_status
            FROM purchase_invoice
            WHERE vendor_id = ? AND payment_status != 'paid'
            ORDER BY invoice_date DESC, id DESC
        ''', (vendor_id,))
        
        invoices = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(invoices)
    except Exception as e:
        print(f"❌ Error fetching open invoices: {str(e)}")
        return jsonify({'error': str(e)}), 500

@vendor_payments_bp.route('', methods=['POST'])
def create_payment():
    """Create new vendor payment with optional invoice matching"""
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        # Generate payment number
        payment_no = f"PAY{datetime.now().strftime('%y%m%d%H%M%S')}"
        
        invoice_id = data.get('invoice_id')
        if invoice_id == '' or invoice_id == 0:
            invoice_id = None
            
        cursor.execute('''
            INSERT INTO vendor_payments (
                payment_no, vendor_id, payment_date, amount,
                payment_mode, reference_no, bank_id, notes, status,
                created_by, cheque_image_path, invoice_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            1,  # created_by
            data.get('cheque_image_path'),
            invoice_id
        ))
        
        # Update vendor balance
        cursor.execute('''
            UPDATE vendors 
            SET current_balance = current_balance - ? 
            WHERE id = ?
        ''', (data['amount'], data['vendor_id']))
        
        # Update linked purchase invoice balances if matched
        if invoice_id:
            cursor.execute('SELECT grand_total, paid_amount FROM purchase_invoice WHERE id = ?', (invoice_id,))
            inv = cursor.fetchone()
            if inv:
                new_paid = (inv['paid_amount'] or 0) + float(data['amount'])
                new_bal = max(0, (inv['grand_total'] or 0) - new_paid)
                new_status = 'paid' if new_bal <= 0 else 'partial'
                cursor.execute('''
                    UPDATE purchase_invoice
                    SET paid_amount = ?, balance = ?, payment_status = ?
                    WHERE id = ?
                ''', (new_paid, new_bal, new_status, invoice_id))
        
        # Post Journal Entry!
        try:
            AccountingHook.post_payment_made(
                cursor,
                payment_no,
                data['vendor_id'],
                data['amount'],
                data.get('bank_id')
            )
            print("✅ Auto-posted Journal Entry for Vendor Payment.")
        except Exception as j_err:
            print(f"❌ Failed to auto-post Journal Entry: {j_err}")
            pass

        payment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': payment_id,
            'payment_no': payment_no,
            'message': 'Payment created successfully'
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating payment: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@vendor_payments_bp.route('/<int:payment_id>', methods=['PUT'])
def update_payment(payment_id):
    """Update vendor payment with invoice matching correction"""
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        # Get old details to adjust balances
        cursor.execute('SELECT amount, invoice_id, vendor_id FROM vendor_payments WHERE id = ?', (payment_id,))
        old_payment = cursor.fetchone()
        if not old_payment:
            conn.close()
            return jsonify({'error': 'Payment not found'}), 404
            
        old_amount = old_payment['amount']
        old_invoice_id = old_payment['invoice_id']
        old_vendor_id = old_payment['vendor_id']
        
        # Reverse old invoice matching
        if old_invoice_id:
            cursor.execute('SELECT grand_total, paid_amount FROM purchase_invoice WHERE id = ?', (old_invoice_id,))
            old_inv = cursor.fetchone()
            if old_inv:
                rev_paid = max(0, (old_inv['paid_amount'] or 0) - old_amount)
                rev_bal = (old_inv['grand_total'] or 0) - rev_paid
                rev_status = 'paid' if rev_bal <= 0 else ('partial' if rev_paid > 0 else 'pending')
                cursor.execute('''
                    UPDATE purchase_invoice
                    SET paid_amount = ?, balance = ?, payment_status = ?
                    WHERE id = ?
                ''', (rev_paid, rev_bal, rev_status, old_invoice_id))
        
        new_invoice_id = data.get('invoice_id')
        if new_invoice_id == '' or new_invoice_id == 0:
            new_invoice_id = None
            
        # Update payment record
        cursor.execute('''
            UPDATE vendor_payments SET
                payment_date = ?,
                amount = ?,
                payment_mode = ?,
                reference_no = ?,
                bank_id = ?,
                notes = ?,
                cheque_image_path = ?,
                invoice_id = ?
            WHERE id = ?
        ''', (
            data['payment_date'],
            data['amount'],
            data['payment_mode'],
            data.get('reference_no'),
            data.get('bank_id'),
            data.get('notes'),
            data.get('cheque_image_path'),
            new_invoice_id,
            payment_id
        ))
        
        # Adjust vendor balance (reverse old, add new)
        cursor.execute('''
            UPDATE vendors 
            SET current_balance = current_balance + ? - ? 
            WHERE id = ?
        ''', (old_amount, data['amount'], data['vendor_id']))
        
        # Apply new invoice matching
        if new_invoice_id:
            cursor.execute('SELECT grand_total, paid_amount FROM purchase_invoice WHERE id = ?', (new_invoice_id,))
            new_inv = cursor.fetchone()
            if new_inv:
                new_paid = (new_inv['paid_amount'] or 0) + float(data['amount'])
                new_bal = max(0, (new_inv['grand_total'] or 0) - new_paid)
                new_status = 'paid' if new_bal <= 0 else 'partial'
                cursor.execute('''
                    UPDATE purchase_invoice
                    SET paid_amount = ?, balance = ?, payment_status = ?
                    WHERE id = ?
                ''', (new_paid, new_bal, new_status, new_invoice_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Payment updated successfully'})
        
    except Exception as e:
        print(f"❌ Error updating payment: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@vendor_payments_bp.route('/<int:payment_id>', methods=['DELETE'])
def delete_payment(payment_id):
    """Delete vendor payment and reverse invoice status/balances"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get payment details to reverse balance
        cursor.execute('SELECT vendor_id, amount, invoice_id FROM vendor_payments WHERE id = ?', (payment_id,))
        payment = cursor.fetchone()
        
        if payment:
            # Reverse vendor balance
            cursor.execute('''
                UPDATE vendors 
                SET current_balance = current_balance + ? 
                WHERE id = ?
            ''', (payment['amount'], payment['vendor_id']))
            
            # Reverse invoice balance if linked
            if payment['invoice_id']:
                cursor.execute('SELECT grand_total, paid_amount FROM purchase_invoice WHERE id = ?', (payment['invoice_id'],))
                inv = cursor.fetchone()
                if inv:
                    rev_paid = max(0, (inv['paid_amount'] or 0) - payment['amount'])
                    rev_bal = (inv['grand_total'] or 0) - rev_paid
                    rev_status = 'paid' if rev_bal <= 0 else ('partial' if rev_paid > 0 else 'pending')
                    cursor.execute('''
                        UPDATE purchase_invoice
                        SET paid_amount = ?, balance = ?, payment_status = ?
                        WHERE id = ?
                    ''', (rev_paid, rev_bal, rev_status, payment['invoice_id']))
            
            # Delete payment
            cursor.execute('DELETE FROM vendor_payments WHERE id = ?', (payment_id,))
            
            conn.commit()
            
        conn.close()
        return jsonify({'message': 'Payment deleted successfully'})
        
    except Exception as e:
        print(f"❌ Error deleting payment: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500