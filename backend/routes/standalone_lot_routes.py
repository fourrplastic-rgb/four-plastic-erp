from flask import Blueprint, request, jsonify, g
from datetime import datetime
import sqlite3
from database_config import get_db

standalone_lot_bp = Blueprint('standalone_lots', __name__)

@standalone_lot_bp.route('', methods=['GET'])
def get_lots():
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
        SELECT id, date, vendor_id, vendor_name, item_name, lot_no,
               billed_qty, received_qty, rate, billed_amount, received_amount,
               shortage_surplus_qty, financial_diff, paid_amount, status
        FROM standalone_lots
        ORDER BY date DESC, id DESC
        ''')
        
        lots = [dict(row) for row in cursor.fetchall()]
        return jsonify(lots)
    except Exception as e:
        print(f"Error fetching standalone lots: {e}")
        return jsonify({"error": str(e)}), 500

@standalone_lot_bp.route('', methods=['POST'])
def create_lot():
    try:
        data = request.json
        db = get_db()
        cursor = db.cursor()
        
        # Calculate derived fields
        billed_qty = float(data.get('billed_qty', 0))
        received_qty = float(data.get('received_qty', 0))
        rate = float(data.get('rate', 0))
        
        billed_amount = billed_qty * rate
        received_amount = received_qty * rate
        shortage_surplus_qty = received_qty - billed_qty
        financial_diff = shortage_surplus_qty * rate
        
        cursor.execute('''
        INSERT INTO standalone_lots (
            date, vendor_id, vendor_name, item_name, lot_no,
            billed_qty, received_qty, rate, billed_amount, received_amount,
            shortage_surplus_qty, financial_diff, paid_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        ''', (
            data.get('date'),
            data.get('vendor_id'),
            data.get('vendor_name'),
            data.get('item_name'),
            data.get('lot_no'),
            billed_qty,
            received_qty,
            rate,
            billed_amount,
            received_amount,
            shortage_surplus_qty,
            financial_diff
        ))
        
        lot_id = cursor.lastrowid
        db.commit()
        return jsonify({"message": "Lot record created successfully", "id": lot_id}), 201
    except Exception as e:
        db.rollback()
        print(f"Error creating standalone lot: {e}")
        return jsonify({"error": str(e)}), 500

@standalone_lot_bp.route('/<int:lot_id>', methods=['DELETE'])
def delete_lot(lot_id):
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('DELETE FROM standalone_lots WHERE id = ?', (lot_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Lot not found"}), 404
            
        db.commit()
        return jsonify({"message": "Lot deleted successfully"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

@standalone_lot_bp.route('/<int:lot_id>/payments', methods=['GET'])
def get_lot_payments(lot_id):
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
        SELECT id, lot_id, payment_date, amount, reference_no 
        FROM standalone_lot_payments 
        WHERE lot_id = ? 
        ORDER BY payment_date DESC, id DESC
        ''', (lot_id,))
        
        payments = [dict(row) for row in cursor.fetchall()]
        return jsonify(payments)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@standalone_lot_bp.route('/<int:lot_id>/payments', methods=['POST'])
def create_lot_payment(lot_id):
    try:
        data = request.json
        amount = float(data.get('amount', 0))
        payment_date = data.get('payment_date')
        reference_no = data.get('reference_no', '')
        
        db = get_db()
        cursor = db.cursor()
        
        # Verify lot exists
        cursor.execute('SELECT id FROM standalone_lots WHERE id = ?', (lot_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Lot not found"}), 404
            
        # Add payment
        cursor.execute('''
        INSERT INTO standalone_lot_payments (lot_id, payment_date, amount, reference_no)
        VALUES (?, ?, ?, ?)
        ''', (lot_id, payment_date, amount, reference_no))
        
        payment_id = cursor.lastrowid
        
        # Update paid_amount on lot
        cursor.execute('''
        UPDATE standalone_lots 
        SET paid_amount = paid_amount + ?
        WHERE id = ?
        ''', (amount, lot_id))
        
        db.commit()
        return jsonify({"message": "Payment recorded successfully", "id": payment_id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

@standalone_lot_bp.route('/payments/<int:payment_id>', methods=['DELETE'])
def delete_lot_payment(payment_id):
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get payment amount and lot_id first
        cursor.execute('SELECT lot_id, amount FROM standalone_lot_payments WHERE id = ?', (payment_id,))
        payment = cursor.fetchone()
        
        if not payment:
            return jsonify({"error": "Payment not found"}), 404
            
        # Delete payment
        cursor.execute('DELETE FROM standalone_lot_payments WHERE id = ?', (payment_id,))
        
        # Update paid_amount on lot
        cursor.execute('''
        UPDATE standalone_lots 
        SET paid_amount = paid_amount - ?
        WHERE id = ?
        ''', (payment['amount'], payment['lot_id']))
        
        db.commit()
        return jsonify({"message": "Payment deleted successfully"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

# ----------------- RECEIPTS -----------------

@standalone_lot_bp.route('/<int:lot_id>/receipts', methods=['GET'])
def get_lot_receipts(lot_id):
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
        SELECT id, lot_id, receipt_date, quantity, reference_no 
        FROM standalone_lot_receipts 
        WHERE lot_id = ? 
        ORDER BY receipt_date DESC, id DESC
        ''', (lot_id,))
        
        receipts = [dict(row) for row in cursor.fetchall()]
        return jsonify(receipts)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@standalone_lot_bp.route('/<int:lot_id>/receipts', methods=['POST'])
def create_lot_receipt(lot_id):
    try:
        data = request.json
        quantity = float(data.get('quantity', 0))
        receipt_date = data.get('receipt_date')
        reference_no = data.get('reference_no', '')
        
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('SELECT id, rate FROM standalone_lots WHERE id = ?', (lot_id,))
        lot = cursor.fetchone()
        if not lot:
            return jsonify({"error": "Lot not found"}), 404
        
        rate = float(lot['rate'] or 0)
            
        cursor.execute('''
        INSERT INTO standalone_lot_receipts (lot_id, receipt_date, quantity, reference_no)
        VALUES (?, ?, ?, ?)
        ''', (lot_id, receipt_date, quantity, reference_no))
        
        receipt_id = cursor.lastrowid
        
        # Update lot: received_qty, shortage_surplus_qty, received_amount, financial_diff
        cursor.execute('''
        UPDATE standalone_lots 
        SET received_qty = received_qty + ?,
            received_amount = received_amount + (? * rate),
            shortage_surplus_qty = (received_qty + ?) - billed_qty,
            financial_diff = ((received_qty + ?) - billed_qty) * rate
        WHERE id = ?
        ''', (quantity, quantity, quantity, quantity, lot_id))
        
        db.commit()
        return jsonify({"message": "Receipt recorded successfully", "id": receipt_id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

@standalone_lot_bp.route('/receipts/<int:receipt_id>', methods=['DELETE'])
def delete_lot_receipt(receipt_id):
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('SELECT lot_id, quantity FROM standalone_lot_receipts WHERE id = ?', (receipt_id,))
        receipt = cursor.fetchone()
        
        if not receipt:
            return jsonify({"error": "Receipt not found"}), 404
            
        cursor.execute('DELETE FROM standalone_lot_receipts WHERE id = ?', (receipt_id,))
        
        qty = receipt['quantity']
        
        # Update lot math
        cursor.execute('''
        UPDATE standalone_lots 
        SET received_qty = received_qty - ?,
            received_amount = received_amount - (? * rate),
            shortage_surplus_qty = (received_qty - ?) - billed_qty,
            financial_diff = ((received_qty - ?) - billed_qty) * rate
        WHERE id = ?
        ''', (qty, qty, qty, qty, receipt['lot_id']))
        
        db.commit()
        return jsonify({"message": "Receipt deleted successfully"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
