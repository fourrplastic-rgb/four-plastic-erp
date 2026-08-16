from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import sqlite3
import os
from datetime import datetime
import logging
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database_config import DB_PATH

payout_bp = Blueprint('payout', __name__)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection with error handling"""
    try:
        print(f"📁 Payout API connecting to: {DB_PATH}")
        
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

def get_db_connection_with_timeout(timeout=10):
    """Get database connection with timeout to prevent locking"""
    try:
        print(f"📁 Payout API connecting with timeout: {DB_PATH}")
        
        if not os.path.exists(DB_PATH):
            alt_path = r'H:\NEW MFG\FOUR (R) PLASTIC\database\manufacturing.db'
            if os.path.exists(alt_path):
                print(f"✅ Found database at alternative path: {alt_path}")
                conn = sqlite3.connect(alt_path, timeout=timeout)
                conn.row_factory = sqlite3.Row
                return conn
            raise FileNotFoundError(f"Database file not found at: {DB_PATH}")

        conn = sqlite3.connect(DB_PATH, timeout=timeout)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        logger.error(f"Database connection error: {str(e)}")
        raise

@payout_bp.route('/api/payouts', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_payouts():
    """Get all payouts with optional filters"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get query parameters
        status = request.args.get('status')
        month = request.args.get('month')
        employee_id = request.args.get('employee_id')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query with optional employee_id filter
        query = """
            SELECT p.*, 
                   e.id as emp_id,
                   e.first_name, 
                   e.last_name, 
                   e.employee_code, 
                   e.department,
                   CASE 
                       WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
                       THEN e.first_name || ' ' || e.last_name
                       WHEN e.first_name IS NOT NULL 
                       THEN e.first_name
                       WHEN e.last_name IS NOT NULL 
                       THEN e.last_name
                       ELSE 'Employee #' || p.employee_id
                   END as employee_name
            FROM payouts p
            LEFT JOIN employees e ON p.employee_id = e.id
            WHERE 1=1
        """
        params = []
        
        if status and status != 'all':
            query += " AND p.status = ?"
            params.append(status)
        
        if month:
            query += " AND p.month = ?"
            params.append(month)
            
        if employee_id:
            query += " AND p.employee_id = ?"
            params.append(employee_id)
        
        query += " ORDER BY p.created_at DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        payouts = []
        for row in rows:
            record = dict(row)
            # Ensure employee_name is always set
            if not record.get('employee_name') or record.get('employee_name') == '':
                if record.get('first_name'):
                    record['employee_name'] = f"{record['first_name']} {record.get('last_name', '')}".strip()
                else:
                    record['employee_name'] = f"Employee #{record['employee_id']}"
            payouts.append(record)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'payouts': payouts,
            'total': len(payouts)
        }), 200
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in get_payouts: {str(e)}")
        if "no such table" in str(e):
            return jsonify({
                'success': True,
                'payouts': [],
                'total': 0,
                'message': 'Payouts table not found'
            }), 200
        return jsonify({'success': False, 'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching payouts: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payout_bp.route('/api/payouts/employee/<int:employee_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_payouts_by_employee(employee_id):
    """Get payouts for a specific employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get query parameters
        month = request.args.get('month')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query for specific employee
        query = """
            SELECT p.*, 
                   e.id as emp_id,
                   e.first_name, 
                   e.last_name, 
                   e.employee_code, 
                   e.department,
                   CASE 
                       WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
                       THEN e.first_name || ' ' || e.last_name
                       WHEN e.first_name IS NOT NULL 
                       THEN e.first_name
                       WHEN e.last_name IS NOT NULL 
                       THEN e.last_name
                       ELSE 'Employee #' || p.employee_id
                   END as employee_name
            FROM payouts p
            LEFT JOIN employees e ON p.employee_id = e.id
            WHERE p.employee_id = ?
        """
        params = [employee_id]
        
        if month:
            query += " AND p.month = ?"
            params.append(month)
        
        query += " ORDER BY p.month DESC, p.created_at DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        payouts = []
        for row in rows:
            record = dict(row)
            # Ensure employee_name is always set
            if not record.get('employee_name') or record.get('employee_name') == '':
                if record.get('first_name'):
                    record['employee_name'] = f"{record['first_name']} {record.get('last_name', '')}".strip()
                else:
                    record['employee_name'] = f"Employee #{record['employee_id']}"
            payouts.append(record)
        
        conn.close()
        
        # Get employee details separately if needed
        employee_details = None
        if payouts and len(payouts) > 0:
            employee_details = {
                'id': payouts[0].get('employee_id'),
                'first_name': payouts[0].get('first_name'),
                'last_name': payouts[0].get('last_name'),
                'employee_code': payouts[0].get('employee_code'),
                'department': payouts[0].get('department')
            }
        
        return jsonify({
            'success': True,
            'payouts': payouts,
            'employee': employee_details,
            'total': len(payouts)
        }), 200
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in get_payouts_by_employee: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching employee payouts: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payout_bp.route('/api/payouts/<int:payout_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_payout(payout_id):
    """Get single payout by ID"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT p.*, 
                   e.id as emp_id,
                   e.first_name, 
                   e.last_name, 
                   e.employee_code,
                   e.department,
                   CASE 
                       WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
                       THEN e.first_name || ' ' || e.last_name
                       WHEN e.first_name IS NOT NULL 
                       THEN e.first_name
                       WHEN e.last_name IS NOT NULL 
                       THEN e.last_name
                       ELSE 'Employee #' || p.employee_id
                   END as employee_name
            FROM payouts p
            LEFT JOIN employees e ON p.employee_id = e.id
            WHERE p.id = ?
        """, (payout_id,))
        
        payout = cursor.fetchone()
        conn.close()
        
        if not payout:
            return jsonify({'success': False, 'message': 'Payout not found'}), 404
        
        payout_dict = dict(payout)
        
        return jsonify({
            'success': True,
            'payout': payout_dict
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching payout: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payout_bp.route('/api/payouts', methods=['POST', 'OPTIONS'])
@cross_origin()
def create_payout():
    """Create a new payout"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        
        # Validate required fields
        required_fields = ['employee_id', 'month']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400
        
        conn = get_db_connection_with_timeout(10)
        cursor = conn.cursor()
        
        # Check if payout already exists for this employee and month
        cursor.execute("""
            SELECT id FROM payouts 
            WHERE employee_id = ? AND month = ?
        """, (data['employee_id'], data['month']))
        
        existing = cursor.fetchone()
        if existing:
            conn.close()
            return jsonify({
                'success': False, 
                'message': f'Payout already exists for employee {data["employee_id"]} in month {data["month"]}'
            }), 400
        
        # Generate payout number
        cursor.execute("SELECT payout_no FROM payouts ORDER BY id DESC LIMIT 1")
        last = cursor.fetchone()
        if last:
            last_no = last['payout_no']
            num = int(last_no.replace('POUT', '')) + 1
            payout_no = f"POUT{num:06d}"
        else:
            payout_no = "POUT000001"
        
        # Calculate totals if not provided - with safe float conversion
        basic = float(data.get('basic_salary') or 0)
        hra = float(data.get('hra') or 0)
        conveyance = float(data.get('conveyance') or 0)
        medical = float(data.get('medical') or 0)
        special = float(data.get('special_allowance') or 0)
        
        total_earnings = data.get('total_earnings')
        if total_earnings is None:
            total_earnings = basic + hra + conveyance + medical + special
        
        pf_deduction = float(data.get('pf_deduction') or 0)
        pt_deduction = float(data.get('pt_deduction') or 0)
        tax_deduction = float(data.get('tax_deduction') or 0)
        advance_deduction = float(data.get('advance_deduction') or 0)
        
        total_deductions = data.get('total_deductions')
        if total_deductions is None:
            total_deductions = pf_deduction + pt_deduction + tax_deduction + advance_deduction
        
        net_salary = data.get('net_salary')
        if net_salary is None:
            net_salary = total_earnings - total_deductions
        
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute("""
            INSERT INTO payouts (
                payout_no, employee_id, month, basic_salary, hra, conveyance, 
                medical, special_allowance, total_earnings, pf_deduction, 
                pt_deduction, tax_deduction, advance_deduction, total_deductions, 
                net_salary, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payout_no, data['employee_id'], data['month'], 
            basic, hra, conveyance, medical, special,
            total_earnings, pf_deduction, pt_deduction, tax_deduction, 
            advance_deduction, total_deductions, net_salary, 
            data.get('status', 'pending'), now, now
        ))
        
        payout_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Payout created successfully',
            'payout_id': payout_id,
            'payout_no': payout_no
        }), 201
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in create_payout: {str(e)}")
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error creating payout: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payout_bp.route('/api/payouts/generate', methods=['POST', 'OPTIONS'])
@cross_origin()
def generate_payouts():
    """Generate payouts for a month"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        month = data.get('month')
        
        if not month:
            return jsonify({'success': False, 'message': 'Month is required'}), 400
        
        # Use timeout to prevent database locking
        conn = get_db_connection_with_timeout(10)
        cursor = conn.cursor()
        
        # Check if payouts already exist for this month
        cursor.execute("SELECT COUNT(*) as count FROM payouts WHERE month = ?", (month,))
        row = cursor.fetchone()
        if row and row['count'] > 0:
            conn.close()
            return jsonify({'success': False, 'message': 'Payouts already exist for this month'}), 400
        
        # Get all active employees with safe NULL handling
        cursor.execute("""
            SELECT 
                id,
                employee_code,
                first_name,
                last_name,
                department,
                COALESCE(basic_salary, 0) as basic_salary,
                COALESCE(hra, 0) as hra,
                COALESCE(conveyance, 0) as conveyance,
                COALESCE(medical, 0) as medical,
                COALESCE(special_allowance, 0) as special_allowance
            FROM employees 
            WHERE status = 'active'
        """)
        employees = cursor.fetchall()
        
        if not employees:
            conn.close()
            return jsonify({'success': False, 'message': 'No active employees found'}), 404
        
        # Get pending advances for all employees
        cursor.execute("""
            SELECT employee_id, COALESCE(SUM(COALESCE(balance, 0)), 0) as total_advance 
            FROM advances 
            WHERE status = 'pending' 
            GROUP BY employee_id
        """)
        advances_data = {}
        for row in cursor.fetchall():
            advances_data[row['employee_id']] = float(row['total_advance'])
        
        payouts_created = 0
        for employee in employees:
            emp = dict(employee)
            
            # Safely convert all numeric values
            basic = float(emp.get('basic_salary') or 0)
            hra = float(emp.get('hra') or 0)
            conveyance = float(emp.get('conveyance') or 0)
            medical = float(emp.get('medical') or 0)
            special = float(emp.get('special_allowance') or 0)
            
            total_earnings = basic + hra + conveyance + medical + special
            
            # Get advance deduction for this employee
            advance_deduction = float(advances_data.get(emp['id'], 0))
            
            # Calculate deductions
            pf_deduction = min(basic * 0.12, 15000)  # Cap PF at 15000
            pt_deduction = 200 if basic > 10000 else (150 if basic > 5000 else 0)
            tax_deduction = 0
            
            total_deductions = pf_deduction + pt_deduction + tax_deduction + advance_deduction
            net_salary = total_earnings - total_deductions
            
            # Generate payout number
            cursor.execute("SELECT payout_no FROM payouts ORDER BY id DESC LIMIT 1")
            last = cursor.fetchone()
            if last:
                last_no = last['payout_no']
                num = int(last_no.replace('POUT', '')) + 1
                payout_no = f"POUT{num:06d}"
            else:
                payout_no = "POUT000001"
            
            # Create payout record
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute("""
                INSERT INTO payouts (
                    payout_no, employee_id, month, basic_salary, hra, conveyance, 
                    medical, special_allowance, total_earnings, pf_deduction, 
                    pt_deduction, tax_deduction, advance_deduction, total_deductions, 
                    net_salary, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                payout_no, emp['id'], month, basic, hra, conveyance, medical, special,
                total_earnings, pf_deduction, pt_deduction, tax_deduction, 
                advance_deduction, total_deductions, net_salary, 'pending', now, now
            ))
            
            payouts_created += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'{payouts_created} payouts generated successfully',
            'count': payouts_created
        }), 201
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in generate_payouts: {str(e)}")
        if 'locked' in str(e).lower():
            return jsonify({'success': False, 'message': 'Database is busy, please try again'}), 500
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error generating payouts: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payout_bp.route('/api/payouts/<int:payout_id>/process', methods=['PUT', 'OPTIONS'])
@cross_origin()
def process_payout(payout_id):
    """Mark a payout as processed"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection_with_timeout(5)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM payouts WHERE id = ?", (payout_id,))
        payout = cursor.fetchone()
        if not payout:
            conn.close()
            return jsonify({'success': False, 'message': 'Payout not found'}), 404
        
        cursor.execute("""
            UPDATE payouts 
            SET status = 'paid', payment_date = ?, updated_at = ?
            WHERE id = ?
        """, (
            datetime.now().strftime('%Y-%m-%d'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            payout_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Payout processed successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing payout: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payout_bp.route('/api/payouts/bulk-process', methods=['POST', 'OPTIONS'])
@cross_origin()
def bulk_process_payouts():
    """Process multiple payouts at once"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        payout_ids = data.get('payout_ids', [])
        
        if not payout_ids:
            return jsonify({'success': False, 'message': 'No payouts selected'}), 400
        
        conn = get_db_connection_with_timeout(10)
        cursor = conn.cursor()
        
        # Convert to integers
        payout_ids = [int(pid) for pid in payout_ids]
        placeholders = ','.join(['?' for _ in payout_ids])
        now = datetime.now().strftime('%Y-%m-%d')
        updated = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.execute(f"""
            UPDATE payouts 
            SET status = 'paid', payment_date = ?, updated_at = ?
            WHERE id IN ({placeholders}) AND status = 'pending'
        """, [now, updated] + payout_ids)
        
        processed_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'{processed_count} payouts processed successfully',
            'processed': processed_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error bulk processing payouts: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payout_bp.route('/api/payouts/<int:payout_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_payout(payout_id):
    """Delete a payout"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection_with_timeout(5)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM payouts WHERE id = ?", (payout_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Payout deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting payout: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payout_bp.route('/api/payouts/summary', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_payout_summary():
    """Get payout summary for a month"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        month = request.args.get('month')
        if not month:
            month = datetime.now().strftime('%Y-%m')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                COUNT(*) as total_payouts,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                COALESCE(SUM(net_salary), 0) as total_amount,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN net_salary ELSE 0 END), 0) as paid_amount,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN net_salary ELSE 0 END), 0) as pending_amount
            FROM payouts
            WHERE month = ?
        """, (month,))
        
        summary = dict(cursor.fetchone() or {})
        conn.close()
        
        return jsonify({
            'success': True,
            'summary': summary,
            'month': month
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting payout summary: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@payout_bp.route('/api/payouts/test', methods=['GET', 'OPTIONS'])
@cross_origin()
def test_payouts():
    """Test endpoint to check if payouts API is working"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        return jsonify({
            'success': True,
            'message': 'Payouts API is working',
            'database_path': DB_PATH,
            'database_exists': os.path.exists(DB_PATH)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500