from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import sqlite3
import os
from datetime import datetime
import logging
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database_config import DB_PATH

payslip_bp = Blueprint('payslip', __name__)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection with error handling"""
    try:
        print(f"📁 Payslip API connecting to: {DB_PATH}")
        
        if not os.path.exists(DB_PATH):
            alt_path = r'H:\NEW MFG\FOUR (R) PLASTIC\database\manufacturing.db'
            if os.path.exists(alt_path):
                print(f"✅ Found database at alternative path: {alt_path}")
                conn = sqlite3.connect(alt_path)
                conn.row_factory = sqlite3.Row
                return conn
            raise FileNotFoundError(f"Database file not found at: {DB_PATH}")
            
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        logger.error(f"Database connection error: {str(e)}")
        raise

@payslip_bp.route('/api/payslips', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_payslips():
    """Get all payslips with optional filters"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get query parameters
        month = request.args.get('month')
        employee_id = request.args.get('employee_id')
        status = request.args.get('status')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT p.*, 
                   e.first_name, e.last_name, e.employee_code, e.department,
                   e.pan_number, e.bank_name, e.bank_account, e.ifsc_code
            FROM payslips p
            LEFT JOIN employees e ON p.employee_id = e.id
            WHERE 1=1
        """
        params = []
        
        if month:
            query += " AND p.month = ?"
            params.append(month)
        
        if employee_id and employee_id != 'all':
            query += " AND p.employee_id = ?"
            params.append(employee_id)
        
        if status and status != 'all':
            query += " AND p.status = ?"
            params.append(status)
        
        query += " ORDER BY p.created_at DESC"
        
        cursor.execute(query, params)
        payslips = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'payslips': payslips,
            'total': len(payslips)
        }), 200
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in get_payslips: {str(e)}")
        if "no such table" in str(e):
            return jsonify({
                'success': True,
                'payslips': [],
                'total': 0,
                'message': 'Payslips table not found'
            }), 200
        return jsonify({'success': False, 'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching payslips: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payslip_bp.route('/api/payslips/<int:payslip_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_payslip(payslip_id):
    """Get single payslip by ID"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT p.*, 
                   e.first_name, e.last_name, e.employee_code, e.department,
                   e.designation, e.pan_number, e.bank_name, e.bank_account, 
                   e.ifsc_code, e.pf_number, e.uan_number
            FROM payslips p
            LEFT JOIN employees e ON p.employee_id = e.id
            WHERE p.id = ?
        """, (payslip_id,))
        
        payslip = cursor.fetchone()
        conn.close()
        
        if not payslip:
            return jsonify({'success': False, 'message': 'Payslip not found'}), 404
        
        return jsonify({
            'success': True,
            'payslip': dict(payslip)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching payslip: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payslip_bp.route('/api/payslips/bulk-generate', methods=['POST', 'OPTIONS'])
@cross_origin()
def bulk_generate_payslips():
    """Generate payslips from payouts"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        month = data.get('month')
        
        if not month:
            return jsonify({'success': False, 'message': 'Month is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if payouts table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='payouts'")
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Payouts table not found'}), 404
        
        # Get payouts for the month
        cursor.execute("SELECT * FROM payouts WHERE month = ?", (month,))
        payouts = cursor.fetchall()
        
        if not payouts:
            conn.close()
            return jsonify({'success': False, 'message': 'No payouts found for this month'}), 404
        
        payslips_created = 0
        now = datetime.now().strftime('%Y-%m-%d')
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        for payout_row in payouts:
            payout = dict(payout_row)
            
            # Check if payslip already exists
            cursor.execute(
                "SELECT id FROM payslips WHERE employee_id = ? AND month = ?",
                (payout['employee_id'], month)
            )
            if cursor.fetchone():
                continue
            
            # Generate payslip number
            cursor.execute("SELECT payslip_no FROM payslips ORDER BY id DESC LIMIT 1")
            last = cursor.fetchone()
            if last:
                last_no = last['payslip_no']
                num = int(last_no.replace('PS', '')) + 1
                payslip_no = f"PS{num:06d}"
            else:
                payslip_no = "PS000001"
            
            # Create payslip from payout
            cursor.execute("""
                INSERT INTO payslips (
                    payslip_no, payout_id, employee_id, month, generated_date,
                    basic_salary, hra, conveyance, medical, special_allowance,
                    total_earnings, pf_deduction, pt_deduction, tax_deduction,
                    advance_deduction, attendance_deduction, other_deductions,
                    total_deductions, net_salary, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                payslip_no, payout['id'], payout['employee_id'], month, now,
                payout['basic_salary'], payout['hra'], payout['conveyance'],
                payout['medical'], payout['special_allowance'],
                payout['total_earnings'], payout['pf_deduction'],
                payout['pt_deduction'], payout['tax_deduction'],
                payout['advance_deduction'], 0, 0,
                payout['total_deductions'], payout['net_salary'], 'generated', timestamp
            ))
            
            payslips_created += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'{payslips_created} payslips generated successfully',
            'count': payslips_created
        }), 201
        
    except Exception as e:
        logger.error(f"Error generating payslips: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payslip_bp.route('/api/payslips/<int:payslip_id>/send-email', methods=['POST', 'OPTIONS'])
@cross_origin()
def send_payslip_email(payslip_id):
    """Send payslip via email"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT p.*, e.email, e.first_name, e.last_name
            FROM payslips p
            LEFT JOIN employees e ON p.employee_id = e.id
            WHERE p.id = ?
        """, (payslip_id,))
        
        result = cursor.fetchone()
        if not result:
            conn.close()
            return jsonify({'success': False, 'message': 'Payslip not found'}), 404
        
        data = dict(result)
        
        if not data.get('email'):
            conn.close()
            return jsonify({'success': False, 'message': 'Employee email not found'}), 404
        
        # Here you would implement actual email sending
        cursor.execute("""
            UPDATE payslips 
            SET status = 'sent', email_sent_date = ?, updated_at = ?
            WHERE id = ?
        """, (
            datetime.now().strftime('%Y-%m-%d'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            payslip_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Payslip marked as sent to {data["email"]}'
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending payslip email: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payslip_bp.route('/api/payslips/bulk-email', methods=['POST', 'OPTIONS'])
@cross_origin()
def bulk_email_payslips():
    """Send multiple payslips via email"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        month = data.get('month')
        
        if not month:
            return jsonify({'success': False, 'message': 'Month is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT p.*, e.email 
            FROM payslips p
            LEFT JOIN employees e ON p.employee_id = e.id
            WHERE p.month = ? AND p.status != 'sent' AND e.email IS NOT NULL
        """, (month,))
        
        payslips = cursor.fetchall()
        
        sent_count = 0
        now = datetime.now().strftime('%Y-%m-%d')
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        for payslip in payslips:
            cursor.execute("""
                UPDATE payslips 
                SET status = 'sent', email_sent_date = ?, updated_at = ?
                WHERE id = ?
            """, (now, timestamp, payslip['id']))
            sent_count += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'{sent_count} payslips marked as sent'
        }), 200
        
    except Exception as e:
        logger.error(f"Error bulk emailing payslips: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payslip_bp.route('/api/payslips/test', methods=['GET', 'OPTIONS'])
@cross_origin()
def test_payslips():
    """Test endpoint to check if payslips API is working"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        return jsonify({
            'success': True,
            'message': 'Payslips API is working',
            'database_path': DB_PATH,
            'database_exists': os.path.exists(DB_PATH)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500