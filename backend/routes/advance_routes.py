from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import sqlite3
import os
from datetime import datetime
import logging
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database_config import DB_PATH

advance_bp = Blueprint('advance', __name__)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection with error handling"""
    try:
        print(f"📁 Advance API connecting to: {DB_PATH}")
        
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

@advance_bp.route('/api/advances', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_advances():
    """Get all advances with optional filters"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get query parameters
        status = request.args.get('status')
        employee_id = request.args.get('employee_id')
        from_date = request.args.get('from')
        to_date = request.args.get('to')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Updated query to include employee_name
        query = """
            SELECT a.*, 
                   e.id as emp_id,
                   e.first_name, 
                   e.last_name, 
                   e.employee_code,
                   CASE 
                       WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
                       THEN e.first_name || ' ' || e.last_name
                       WHEN e.first_name IS NOT NULL 
                       THEN e.first_name
                       WHEN e.last_name IS NOT NULL 
                       THEN e.last_name
                       ELSE 'Employee #' || a.employee_id
                   END as employee_name
            FROM advances a
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE 1=1
        """
        params = []
        
        if status and status != 'all':
            query += " AND a.status = ?"
            params.append(status)
        
        if employee_id and employee_id != 'all':
            query += " AND a.employee_id = ?"
            params.append(employee_id)
        
        if from_date:
            query += " AND a.date >= ?"
            params.append(from_date)
        
        if to_date:
            query += " AND a.date <= ?"
            params.append(to_date)
        
        query += " ORDER BY a.date DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        advances = []
        for row in rows:
            record = dict(row)
            # Ensure employee_name is always set
            if not record.get('employee_name') or record.get('employee_name') == '':
                if record.get('first_name'):
                    record['employee_name'] = f"{record['first_name']} {record.get('last_name', '')}".strip()
                else:
                    # Try to get employee name from employees table
                    try:
                        emp_cursor = conn.cursor()
                        emp_cursor.execute(
                            "SELECT first_name || ' ' || last_name as name FROM employees WHERE id = ?", 
                            (record['employee_id'],)
                        )
                        emp_result = emp_cursor.fetchone()
                        if emp_result:
                            record['employee_name'] = emp_result['name']
                        else:
                            record['employee_name'] = f"Employee #{record['employee_id']}"
                    except:
                        record['employee_name'] = f"Employee #{record['employee_id']}"
            
            advances.append(record)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'advances': advances,
            'total': len(advances)
        }), 200
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in get_advances: {str(e)}")
        if "no such table" in str(e):
            return jsonify({
                'success': True,
                'advances': [],
                'total': 0,
                'message': 'Advances table not found'
            }), 200
        return jsonify({'success': False, 'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching advances: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/<int:advance_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_advance(advance_id):
    """Get single advance by ID"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Updated query to include employee_name
        cursor.execute("""
            SELECT a.*, 
                   e.id as emp_id,
                   e.first_name, 
                   e.last_name, 
                   e.employee_code,
                   CASE 
                       WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
                       THEN e.first_name || ' ' || e.last_name
                       WHEN e.first_name IS NOT NULL 
                       THEN e.first_name
                       WHEN e.last_name IS NOT NULL 
                       THEN e.last_name
                       ELSE 'Employee #' || a.employee_id
                   END as employee_name
            FROM advances a
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE a.id = ?
        """, (advance_id,))
        
        advance = cursor.fetchone()
        conn.close()
        
        if not advance:
            return jsonify({'success': False, 'message': 'Advance not found'}), 404
        
        advance_dict = dict(advance)
        
        return jsonify({
            'success': True,
            'advance': advance_dict
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching advance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances', methods=['POST', 'OPTIONS'])
@cross_origin()
def create_advance():
    """Create new advance"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        logger.info(f"Creating advance with data: {data}")
        
        # Validate required fields
        if not data.get('employee_id'):
            return jsonify({'success': False, 'message': 'Employee ID is required'}), 400
        if not data.get('date'):
            return jsonify({'success': False, 'message': 'Date is required'}), 400
        if not data.get('amount'):
            return jsonify({'success': False, 'message': 'Amount is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if employees table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'")
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Employees table not found'}), 500
        
        # Check if advances table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='advances'")
        if not cursor.fetchone():
            # Create advances table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS advances (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    advance_no TEXT UNIQUE NOT NULL,
                    employee_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    amount REAL NOT NULL,
                    purpose TEXT,
                    repayment_mode TEXT DEFAULT 'monthly',
                    repayment_installments INTEGER DEFAULT 1,
                    repaid_amount REAL DEFAULT 0,
                    balance REAL DEFAULT 0,
                    status TEXT DEFAULT 'pending',
                    notes TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    FOREIGN KEY (employee_id) REFERENCES employees(id)
                )
            """)
            conn.commit()
            logger.info("Created advances table")
        
        # Check if employee exists
        cursor.execute("SELECT id, first_name, last_name FROM employees WHERE id = ?", (data['employee_id'],))
        employee = cursor.fetchone()
        if not employee:
            conn.close()
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Generate advance number
        cursor.execute("SELECT advance_no FROM advances ORDER BY id DESC LIMIT 1")
        last = cursor.fetchone()
        if last:
            last_no = last['advance_no']
            if last_no.startswith('ADV'):
                try:
                    num = int(last_no[3:]) + 1
                    advance_no = f"ADV{num:06d}"
                except:
                    advance_no = "ADV000001"
            else:
                advance_no = "ADV000001"
        else:
            advance_no = "ADV000001"
        
        # Prepare data for insert
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        amount = float(data['amount'])
        
        cursor.execute("""
            INSERT INTO advances (
                advance_no, employee_id, date, amount, purpose, 
                repayment_mode, repayment_installments,
                repaid_amount, balance, status, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            advance_no,
            data['employee_id'],
            data['date'],
            amount,
            data.get('purpose', ''),
            data.get('repayment_mode', 'monthly'),
            int(data.get('repayment_installments', 1)),
            0,
            amount,
            'pending',
            data.get('remarks', ''),
            now,
            now
        ))
        
        advance_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Advance created successfully with ID: {advance_id}")
        
        return jsonify({
            'success': True,
            'message': 'Advance created successfully',
            'id': advance_id,
            'advance_no': advance_no
        }), 201
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error creating advance: {str(e)}")
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error creating advance: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/<int:advance_id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def update_advance(advance_id):
    """Update advance"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if advance exists
        cursor.execute("SELECT * FROM advances WHERE id = ?", (advance_id,))
        advance = cursor.fetchone()
        if not advance:
            conn.close()
            return jsonify({'success': False, 'message': 'Advance not found'}), 404
        
        # Recalculate balance if amount or repaid changed
        if 'amount' in data or 'repaid_amount' in data:
            current = dict(advance)
            amount = float(data.get('amount', current['amount']))
            repaid = float(data.get('repaid_amount', current['repaid_amount']))
            data['balance'] = amount - repaid
            data['status'] = 'completed' if data['balance'] <= 0 else 'pending'
        
        # Build update query
        update_fields = []
        values = []
        for key, value in data.items():
            if key in ['amount', 'purpose', 'repayment_mode', 'repayment_installments', 
                      'repaid_amount', 'balance', 'status', 'notes'] and value is not None:
                update_fields.append(f"{key} = ?")
                values.append(value)
        
        if not update_fields:
            conn.close()
            return jsonify({'success': False, 'message': 'No fields to update'}), 400
        
        update_fields.append("updated_at = ?")
        values.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        values.append(advance_id)
        
        query = f"UPDATE advances SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, values)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Advance updated successfully'
        }), 200
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in update_advance: {str(e)}")
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500
    except Exception as e:
        logger.error(f"Error updating advance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/<int:advance_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_advance(advance_id):
    """Delete advance"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if advance exists
        cursor.execute("SELECT id FROM advances WHERE id = ?", (advance_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Advance not found'}), 404
        
        # Delete related repayments first (if table exists)
        try:
            cursor.execute("DELETE FROM advance_repayments WHERE advance_id = ?", (advance_id,))
        except:
            pass
        
        cursor.execute("DELETE FROM advances WHERE id = ?", (advance_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Advance deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting advance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== NEW REPAYMENT ENDPOINTS ====================

@advance_bp.route('/api/advances/<int:advance_id>/repayments', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_advance_repayments(advance_id):
    """Get all repayments for an advance"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if advance_repayments table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='advance_repayments'")
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            conn.close()
            return jsonify({
                'success': True,
                'repayments': []
            }), 200
        
        cursor.execute("""
            SELECT * FROM advance_repayments 
            WHERE advance_id = ? 
            ORDER BY repayment_date DESC
        """, (advance_id,))
        
        repayments = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'repayments': repayments
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching repayments: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/<int:advance_id>/repay', methods=['POST', 'OPTIONS'])
@cross_origin()
def record_repayment(advance_id):
    """Record a repayment for an advance"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        repayment_amount = float(data.get('amount', 0))
        
        if repayment_amount <= 0:
            return jsonify({'success': False, 'message': 'Invalid repayment amount'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get advance
        cursor.execute("SELECT * FROM advances WHERE id = ?", (advance_id,))
        advance = cursor.fetchone()
        if not advance:
            conn.close()
            return jsonify({'success': False, 'message': 'Advance not found'}), 404
        
        advance = dict(advance)
        
        # Calculate new repaid amount and balance
        current_repaid = advance.get('repaid_amount') or 0
        new_repaid = current_repaid + repayment_amount
        new_balance = advance['amount'] - new_repaid
        
        # Update advance
        cursor.execute("""
            UPDATE advances 
            SET repaid_amount = ?, balance = ?, status = ?, updated_at = ?
            WHERE id = ?
        """, (
            new_repaid, 
            new_balance, 
            'completed' if new_balance <= 0 else 'pending',
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            advance_id
        ))
        
        # Create advance_repayments table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS advance_repayments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                advance_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                repayment_date TEXT NOT NULL,
                amount REAL NOT NULL,
                payment_mode TEXT DEFAULT 'cash',
                reference_no TEXT,
                notes TEXT,
                created_at TEXT,
                FOREIGN KEY (advance_id) REFERENCES advances(id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            )
        """)
        
        # Record repayment transaction
        cursor.execute("""
            INSERT INTO advance_repayments 
            (advance_id, employee_id, repayment_date, amount, payment_mode, reference_no, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            advance_id,
            advance['employee_id'],
            data.get('repayment_date', datetime.now().strftime('%Y-%m-%d')),
            repayment_amount,
            data.get('payment_mode', 'cash'),
            data.get('reference_no'),
            data.get('notes', ''),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Repayment recorded successfully',
            'balance': new_balance
        }), 200
        
    except Exception as e:
        logger.error(f"Error recording repayment: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/<int:advance_id>/repayments/<int:repayment_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_repayment(advance_id, repayment_id):
    """Delete a repayment record"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get repayment details before deleting
        cursor.execute("SELECT * FROM advance_repayments WHERE id = ? AND advance_id = ?", 
                      (repayment_id, advance_id))
        repayment = cursor.fetchone()
        
        if not repayment:
            conn.close()
            return jsonify({'success': False, 'message': 'Repayment not found'}), 404
        
        repayment = dict(repayment)
        
        # Delete the repayment
        cursor.execute("DELETE FROM advance_repayments WHERE id = ?", (repayment_id,))
        
        # Update advance balance
        cursor.execute("SELECT * FROM advances WHERE id = ?", (advance_id,))
        advance = cursor.fetchone()
        
        if advance:
            advance = dict(advance)
            new_repaid = (advance.get('repaid_amount') or 0) - repayment['amount']
            new_balance = advance['amount'] - new_repaid
            
            cursor.execute("""
                UPDATE advances 
                SET repaid_amount = ?, balance = ?, status = ?, updated_at = ?
                WHERE id = ?
            """, (
                new_repaid,
                new_balance,
                'pending' if new_balance > 0 else 'completed',
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                advance_id
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Repayment deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting repayment: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/employee/<int:employee_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_employee_advances(employee_id):
    """Get all advances for an employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Updated query to include employee_name
        cursor.execute("""
            SELECT a.*, 
                   e.first_name, 
                   e.last_name, 
                   e.employee_code,
                   CASE 
                       WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
                       THEN e.first_name || ' ' || e.last_name
                       WHEN e.first_name IS NOT NULL 
                       THEN e.first_name
                       WHEN e.last_name IS NOT NULL 
                       THEN e.last_name
                       ELSE 'Employee #' || a.employee_id
                   END as employee_name
            FROM advances a
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE a.employee_id = ? 
            ORDER BY a.date DESC
        """, (employee_id,))
        
        advances = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'advances': advances
        }), 200
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in get_employee_advances: {str(e)}")
        if "no such table" in str(e):
            return jsonify({
                'success': True,
                'advances': [],
                'message': 'Advances table not found'
            }), 200
        return jsonify({'success': False, 'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching employee advances: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/test', methods=['GET', 'OPTIONS'])
@cross_origin()
def test_advances():
    """Test endpoint to check if advances API is working"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        return jsonify({
            'success': True,
            'message': 'Advances API is working',
            'database_path': DB_PATH,
            'database_exists': os.path.exists(DB_PATH)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500