"""
Customer Payments Routes - API endpoints for customer receipts with invoice-wise matching
"""
from flask import Blueprint, request, jsonify
from config.database import get_db, dict_from_row
from datetime import datetime
import traceback
from models.accounting_hook import AccountingHook

customer_payments_bp = Blueprint('customer_payments', __name__, url_prefix='/api/customer-payments')

@customer_payments_bp.route('', methods=['GET'])
def get_payments():
    """Get all customer payments with optional date filter"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        from_date = request.args.get('from', '2000-01-01')
        to_date = request.args.get('to', datetime.now().strftime('%Y-%m-%d'))
        
        company_id = request.args.get('company_id')
        
        if company_id:
            cursor.execute('''
                SELECT cp.*, c.name as customer_name, c.code as customer_code, si.invoice_no as invoice_no 
                FROM customer_payments cp
                JOIN customers c ON cp.customer_id = c.id
                LEFT JOIN sales_invoice si ON cp.invoice_id = si.id
                WHERE cp.payment_date BETWEEN ? AND ? AND cp.company_id = ?
                ORDER BY cp.payment_date DESC, cp.id DESC
            ''', (from_date, to_date, company_id))
        else:
            cursor.execute('''
                SELECT cp.*, c.name as customer_name, c.code as customer_code, si.invoice_no as invoice_no 
                FROM customer_payments cp
                JOIN customers c ON cp.customer_id = c.id
                LEFT JOIN sales_invoice si ON cp.invoice_id = si.id
                WHERE cp.payment_date BETWEEN ? AND ?
                ORDER BY cp.payment_date DESC, cp.id DESC
            ''', (from_date, to_date))
        
        payments = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(payments)
        
    except Exception as e:
        print(f"❌ Error fetching customer payments: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@customer_payments_bp.route('/<int:payment_id>', methods=['GET'])
def get_payment(payment_id):
    """Get single customer payment by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT cp.*, c.name as customer_name, c.code as customer_code, si.invoice_no as invoice_no
            FROM customer_payments cp
            JOIN customers c ON cp.customer_id = c.id
            LEFT JOIN sales_invoice si ON cp.invoice_id = si.id
            WHERE cp.id = ?
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

@customer_payments_bp.route('/open-invoices/<int:customer_id>', methods=['GET'])
def get_open_invoices(customer_id):
    """Get all unpaid/partially paid sales invoices for a customer"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, invoice_no, invoice_date, grand_total, paid_amount, balance, payment_status
            FROM sales_invoice
            WHERE customer_id = ? AND payment_status != 'paid'
            ORDER BY invoice_date DESC, id DESC
        ''', (customer_id,))
        
        invoices = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(invoices)
    except Exception as e:
        print(f"❌ Error fetching open invoices: {str(e)}")
        return jsonify({'error': str(e)}), 500

@customer_payments_bp.route('', methods=['POST'])
def create_payment():
    """Create new customer payment with optional invoice matching"""
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        # Generate receipt number
        receipt_no = f"RCPT{datetime.now().strftime('%y%m%d%H%M%S')}"
        
        invoice_id = data.get('invoice_id')
        if invoice_id == '' or invoice_id == 0:
            invoice_id = None
            
        cursor.execute('''
            INSERT INTO customer_payments (
                receipt_no, customer_id, payment_date, amount,
                payment_mode, reference_no, bank_id, notes, status,
                created_by, cheque_image_path, invoice_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            1,  # created_by
            data.get('cheque_image_path'),
            invoice_id
        ))
        
        # Update customer balance
        cursor.execute('''
            UPDATE customers 
            SET current_balance = current_balance - ? 
            WHERE id = ?
        ''', (data['amount'], data['customer_id']))
        
        # Update linked sales invoice balances if matched
        if invoice_id:
            cursor.execute('SELECT grand_total, paid_amount FROM sales_invoice WHERE id = ?', (invoice_id,))
            inv = cursor.fetchone()
            if inv:
                new_paid = (inv['paid_amount'] or 0) + float(data['amount'])
                new_bal = max(0, (inv['grand_total'] or 0) - new_paid)
                new_status = 'paid' if new_bal <= 0 else 'partial'
                cursor.execute('''
                    UPDATE sales_invoice
                    SET paid_amount = ?, balance = ?, payment_status = ?
                    WHERE id = ?
                ''', (new_paid, new_bal, new_status, invoice_id))
        
        # Post Journal Entry!
        try:
            AccountingHook.post_payment_receipt(
                cursor,
                receipt_no,
                data['customer_id'],
                data['amount'],
                data.get('bank_id')
            )
            print("✅ Auto-posted Journal Entry for Customer Payment.")
        except Exception as j_err:
            print(f"❌ Failed to auto-post Journal Entry: {j_err}")
            pass

        payment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': payment_id,
            'receipt_no': receipt_no,
            'message': 'Receipt created successfully'
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating payment: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@customer_payments_bp.route('/<int:payment_id>', methods=['PUT'])
def update_payment(payment_id):
    """Update customer payment with invoice matching correction"""
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        # Get old details to adjust balances
        cursor.execute('SELECT amount, invoice_id, customer_id FROM customer_payments WHERE id = ?', (payment_id,))
        old_payment = cursor.fetchone()
        if not old_payment:
            conn.close()
            return jsonify({'error': 'Payment not found'}), 404
            
        old_amount = old_payment['amount']
        old_invoice_id = old_payment['invoice_id']
        old_customer_id = old_payment['customer_id']
        
        # Reverse old invoice matching
        if old_invoice_id:
            cursor.execute('SELECT grand_total, paid_amount FROM sales_invoice WHERE id = ?', (old_invoice_id,))
            old_inv = cursor.fetchone()
            if old_inv:
                rev_paid = max(0, (old_inv['paid_amount'] or 0) - old_amount)
                rev_bal = (old_inv['grand_total'] or 0) - rev_paid
                rev_status = 'paid' if rev_bal <= 0 else ('partial' if rev_paid > 0 else 'pending')
                cursor.execute('''
                    UPDATE sales_invoice
                    SET paid_amount = ?, balance = ?, payment_status = ?
                    WHERE id = ?
                ''', (rev_paid, rev_bal, rev_status, old_invoice_id))
        
        new_invoice_id = data.get('invoice_id')
        if new_invoice_id == '' or new_invoice_id == 0:
            new_invoice_id = None
            
        # Update payment record
        cursor.execute('''
            UPDATE customer_payments SET
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
        
        # Adjust customer balance (reverse old, add new)
        cursor.execute('''
            UPDATE customers 
            SET current_balance = current_balance + ? - ? 
            WHERE id = ?
        ''', (old_amount, data['amount'], data['customer_id']))
        
        # Apply new invoice matching
        if new_invoice_id:
            cursor.execute('SELECT grand_total, paid_amount FROM sales_invoice WHERE id = ?', (new_invoice_id,))
            new_inv = cursor.fetchone()
            if new_inv:
                new_paid = (new_inv['paid_amount'] or 0) + float(data['amount'])
                new_bal = max(0, (new_inv['grand_total'] or 0) - new_paid)
                new_status = 'paid' if new_bal <= 0 else 'partial'
                cursor.execute('''
                    UPDATE sales_invoice
                    SET paid_amount = ?, balance = ?, payment_status = ?
                    WHERE id = ?
                ''', (new_paid, new_bal, new_status, new_invoice_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Receipt updated successfully'})
        
    except Exception as e:
        print(f"❌ Error updating payment: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@customer_payments_bp.route('/<int:payment_id>', methods=['DELETE'])
def delete_payment(payment_id):
    """Delete customer payment and reverse invoice status/balances"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get payment details to reverse balance
        cursor.execute('SELECT customer_id, amount, invoice_id FROM customer_payments WHERE id = ?', (payment_id,))
        payment = cursor.fetchone()
        
        if payment:
            # Reverse customer balance
            cursor.execute('''
                UPDATE customers 
                SET current_balance = current_balance + ? 
                WHERE id = ?
            ''', (payment['amount'], payment['customer_id']))
            
            # Reverse invoice balance if linked
            if payment['invoice_id']:
                cursor.execute('SELECT grand_total, paid_amount FROM sales_invoice WHERE id = ?', (payment['invoice_id'],))
                inv = cursor.fetchone()
                if inv:
                    rev_paid = max(0, (inv['paid_amount'] or 0) - payment['amount'])
                    rev_bal = (inv['grand_total'] or 0) - rev_paid
                    rev_status = 'paid' if rev_bal <= 0 else ('partial' if rev_paid > 0 else 'pending')
                    cursor.execute('''
                        UPDATE sales_invoice
                        SET paid_amount = ?, balance = ?, payment_status = ?
                        WHERE id = ?
                    ''', (rev_paid, rev_bal, rev_status, payment['invoice_id']))
            
            # Delete payment
            cursor.execute('DELETE FROM customer_payments WHERE id = ?', (payment_id,))
            
            conn.commit()
            
        conn.close()
        return jsonify({'message': 'Receipt deleted successfully'})
        
    except Exception as e:
        print(f"❌ Error deleting payment: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500