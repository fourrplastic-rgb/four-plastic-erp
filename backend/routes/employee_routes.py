from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import sqlite3
import os
from datetime import datetime
import logging
import sys

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database_config import DB_PATH

employee_bp = Blueprint('employee', __name__)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection with error handling"""
    try:
        # Log the path for debugging
        print(f"📁 Employee API connecting to: {DB_PATH}")
        
        # Check if file exists
        if not os.path.exists(DB_PATH):
            logger.error(f"Database file does not exist at: {DB_PATH}")
            # Try alternative path
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

@employee_bp.route('/api/employees', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_employees():
    """Get all employees with optional filters"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get query parameters
        status = request.args.get('status')
        department = request.args.get('department')
        search = request.args.get('search')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query
        query = "SELECT * FROM employees WHERE 1=1"
        params = []
        
        if status and status != 'all':
            query += " AND status = ?"
            params.append(status)
        
        if department and department != 'all':
            query += " AND department = ?"
            params.append(department)
        
        if search:
            query += """ AND (first_name LIKE ? OR last_name LIKE ? OR 
                             employee_code LIKE ? OR email LIKE ? OR phone LIKE ?)"""
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term, search_term, search_term])
        
        query += " ORDER BY first_name ASC"
        
        cursor.execute(query, params)
        employees = cursor.fetchall()
        
        # Convert to list of dicts
        result = []
        for emp in employees:
            emp_dict = dict(emp)
            result.append(emp_dict)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'employees': result,
            'total': len(result)
        }), 200
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in get_employees: {str(e)}")
        if "no such table" in str(e):
            return jsonify({
                'success': True,
                'employees': [],
                'total': 0,
                'message': 'Employees table not found'
            }), 200
        return jsonify({'success': False, 'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching employees: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees/<int:employee_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_employee(employee_id):
    """Get single employee by ID"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM employees WHERE id = ?", (employee_id,))
        employee = cursor.fetchone()
        
        conn.close()
        
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        return jsonify({
            'success': True,
            'employee': dict(employee)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching employee: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees', methods=['POST', 'OPTIONS'])
@cross_origin()
def create_employee():
    """Create new employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'phone', 'basic_salary']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT id FROM employees WHERE email = ?", (data['email'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Check if employee code already exists
        if 'employee_code' in data:
            cursor.execute("SELECT id FROM employees WHERE employee_code = ?", (data['employee_code'],))
            if cursor.fetchone():
                conn.close()
                return jsonify({'success': False, 'message': 'Employee code already exists'}), 400
        
        # Generate employee code if not provided
        if 'employee_code' not in data or not data['employee_code']:
            cursor.execute("SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1")
            last = cursor.fetchone()
            if last:
                last_code = last['employee_code']
                num = int(last_code.replace('EMP', '')) + 1
                data['employee_code'] = f"EMP{num:03d}"
            else:
                data['employee_code'] = "EMP001"
        
        # Insert employee
        columns = []
        values = []
        placeholders = []
        
        for key, value in data.items():
            if value is not None:
                columns.append(key)
                values.append(value)
                placeholders.append('?')
        
        # Add timestamps
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        columns.append('created_at')
        values.append(now)
        placeholders.append('?')
        
        columns.append('updated_at')
        values.append(now)
        placeholders.append('?')
        
        query = f"INSERT INTO employees ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
        cursor.execute(query, values)
        
        employee_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Employee created successfully',
            'id': employee_id
        }), 201
        
    except sqlite3.IntegrityError as e:
        logger.error(f"Integrity error creating employee: {str(e)}")
        return jsonify({'success': False, 'message': 'Duplicate entry. Employee code or email may already exist.'}), 400
    except Exception as e:
        logger.error(f"Error creating employee: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees/<int:employee_id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def update_employee(employee_id):
    """Update employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if employee exists
        cursor.execute("SELECT * FROM employees WHERE id = ?", (employee_id,))
        employee = cursor.fetchone()
        if not employee:
            conn.close()
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Check email uniqueness if changing
        if 'email' in data:
            cursor.execute("SELECT id FROM employees WHERE email = ? AND id != ?", 
                          (data['email'], employee_id))
            if cursor.fetchone():
                conn.close()
                return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Build update query
        set_clause = []
        values = []
        for key, value in data.items():
            if key not in ['id', 'created_at'] and value is not None:
                set_clause.append(f"{key} = ?")
                values.append(value)
        
        # Add updated timestamp
        set_clause.append("updated_at = ?")
        values.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        values.append(employee_id)
        
        query = f"UPDATE employees SET {', '.join(set_clause)} WHERE id = ?"
        cursor.execute(query, values)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Employee updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating employee: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees/<int:employee_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_employee(employee_id):
    """Delete employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if employee has any advances or attendance records
        cursor.execute("SELECT COUNT(*) as count FROM advances WHERE employee_id = ?", (employee_id,))
        row = cursor.fetchone()
        advances_count = row['count'] if row else 0
        
        cursor.execute("SELECT COUNT(*) as count FROM attendance WHERE employee_id = ?", (employee_id,))
        row = cursor.fetchone()
        attendance_count = row['count'] if row else 0
        
        if advances_count > 0 or attendance_count > 0:
            conn.close()
            return jsonify({
                'success': False, 
                'message': 'Cannot delete employee with existing records. Please mark as inactive instead.'
            }), 400
        
        cursor.execute("DELETE FROM employees WHERE id = ?", (employee_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Employee deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting employee: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees/last-code', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_last_employee_code():
    """Get last employee code for generating new code"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT employee_code FROM employees ORDER BY employee_code DESC LIMIT 1")
        result = cursor.fetchone()
        
        last_code = result['employee_code'] if result else 'EMP000'
        conn.close()
        
        return jsonify({
            'success': True,
            'lastCode': last_code
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting last code: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees/stats', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_employee_stats():
    """Get employee statistics"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total counts by status
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
                SUM(CASE WHEN status = 'onleave' THEN 1 ELSE 0 END) as on_leave
            FROM employees
        """)
        row = cursor.fetchone()
        stats = dict(row) if row else {'total': 0, 'active': 0, 'inactive': 0, 'on_leave': 0}
        
        # Get department-wise count
        cursor.execute("""
            SELECT department, COUNT(*) as count 
            FROM employees 
            WHERE department IS NOT NULL AND department != ''
            GROUP BY department
        """)
        departments = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': stats,
            'departments': departments
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees/test', methods=['GET', 'OPTIONS'])
@cross_origin()
def test_employees():
    """Test endpoint to check if employees API is working"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        return jsonify({
            'success': True,
            'message': 'Employees API is working',
            'database_path': DB_PATH,
            'database_exists': os.path.exists(DB_PATH)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500