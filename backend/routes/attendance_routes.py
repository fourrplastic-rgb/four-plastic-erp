from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import sqlite3
import os
from datetime import datetime, timedelta
import logging
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database_config import DB_PATH

attendance_bp = Blueprint('attendance', __name__)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection with error handling"""
    try:
        print(f"📁 Attendance API connecting to: {DB_PATH}")
        
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

@attendance_bp.route('/api/attendance', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_attendance():
    """Get attendance for specific date"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        date = request.args.get('date')
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT a.*, 
                   e.first_name, e.last_name, e.employee_code, e.department,
                   e.first_name || ' ' || e.last_name as employee_name
            FROM attendance a
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE a.date = ?
            ORDER BY e.first_name
        """, (date,))
        
        attendance = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'attendance': attendance,
            'date': date,
            'count': len(attendance)
        }), 200
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in get_attendance: {str(e)}")
        if "no such table" in str(e):
            return jsonify({
                'success': True,
                'attendance': [],
                'date': date,
                'count': 0
            }), 200
        return jsonify({'success': False, 'message': str(e)}), 500
    except Exception as e:
        logger.error(f"Error fetching attendance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance/today', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_today_attendance():
    """Get today's attendance summary"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        today = datetime.now().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'halfday' THEN 1 ELSE 0 END) as halfday,
                SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave
            FROM attendance 
            WHERE date = ?
        """, (today,))
        
        row = cursor.fetchone()
        if row:
            stats = dict(row)
        else:
            stats = {'total': 0, 'present': 0, 'absent': 0, 'late': 0, 'halfday': 0, 'leave': 0}
        
        conn.close()
        
        return jsonify({
            'success': True,
            **stats
        }), 200
        
    except sqlite3.OperationalError as e:
        logger.error(f"Database error in get_today_attendance: {str(e)}")
        return jsonify({
            'success': True,
            'present': 0, 'absent': 0, 'late': 0, 'halfday': 0, 'leave': 0, 'total': 0
        }), 200
    except Exception as e:
        logger.error(f"Error fetching today's attendance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance', methods=['POST', 'OPTIONS'])
@cross_origin()
def mark_attendance():
    """Mark attendance for an employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        
        # Validate required fields
        required_fields = ['employee_id', 'date', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if employee exists
        cursor.execute("SELECT id, first_name, last_name FROM employees WHERE id = ?", (data['employee_id'],))
        employee = cursor.fetchone()
        if not employee:
            conn.close()
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Calculate hours if check_in and check_out provided
        if data.get('check_in') and data.get('check_out'):
            try:
                check_in = datetime.strptime(data['check_in'], '%H:%M')
                check_out = datetime.strptime(data['check_out'], '%H:%M')
                diff = check_out - check_in
                if diff.total_seconds() < 0:
                    diff = timedelta(days=1) + diff
                data['hours'] = round(diff.total_seconds() / 3600, 1)
            except Exception as e:
                logger.error(f"Error calculating hours: {str(e)}")
                data['hours'] = None
        
        # Check if attendance already exists
        cursor.execute(
            "SELECT id FROM attendance WHERE employee_id = ? AND date = ?",
            (data['employee_id'], data['date'])
        )
        existing = cursor.fetchone()
        
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        if existing:
            # Update existing
            update_fields = []
            values = []
            for key, value in data.items():
                if key not in ['id', 'created_at']:
                    update_fields.append(f"{key} = ?")
                    values.append(value)
            
            update_fields.append("updated_at = ?")
            values.append(now)
            values.append(existing['id'])
            
            query = f"UPDATE attendance SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, values)
            message = 'Attendance updated successfully'
        else:
            # Insert new
            data['created_at'] = now
            data['updated_at'] = now
            
            columns = []
            placeholders = []
            values = []
            for key, value in data.items():
                if value is not None:
                    columns.append(key)
                    placeholders.append('?')
                    values.append(value)
            
            query = f"INSERT INTO attendance ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
            cursor.execute(query, values)
            message = 'Attendance marked successfully'
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': message
        }), 201
        
    except sqlite3.IntegrityError as e:
        logger.error(f"Integrity error marking attendance: {str(e)}")
        return jsonify({'success': False, 'message': 'Duplicate attendance record'}), 400
    except Exception as e:
        logger.error(f"Error marking attendance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance/<int:attendance_id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def update_attendance(attendance_id):
    """Update attendance record"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if attendance exists
        cursor.execute("SELECT id FROM attendance WHERE id = ?", (attendance_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'message': 'Attendance record not found'}), 404
        
        # Recalculate hours if times changed
        if data.get('check_in') and data.get('check_out'):
            try:
                check_in = datetime.strptime(data['check_in'], '%H:%M')
                check_out = datetime.strptime(data['check_out'], '%H:%M')
                diff = check_out - check_in
                if diff.total_seconds() < 0:
                    diff = timedelta(days=1) + diff
                data['hours'] = round(diff.total_seconds() / 3600, 1)
            except:
                data['hours'] = None
        
        # Build update query
        update_fields = []
        values = []
        for key, value in data.items():
            if key not in ['id', 'created_at'] and value is not None:
                update_fields.append(f"{key} = ?")
                values.append(value)
        
        update_fields.append("updated_at = ?")
        values.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        values.append(attendance_id)
        
        query = f"UPDATE attendance SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, values)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Attendance updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating attendance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance/<int:attendance_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_attendance(attendance_id):
    """Delete attendance record"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM attendance WHERE id = ?", (attendance_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Attendance deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting attendance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance/employee/<int:employee_id>/recent', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_employee_recent_attendance(employee_id):
    """Get recent attendance for an employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get last 30 days attendance
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM attendance 
            WHERE employee_id = ? AND date >= ?
            ORDER BY date DESC
            LIMIT 30
        """, (employee_id, thirty_days_ago))
        
        attendance = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'attendance': attendance
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching employee attendance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance/report', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_attendance_report():
    """Get attendance report for date range"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        from_date = request.args.get('from')
        to_date = request.args.get('to')
        employee_id = request.args.get('employee_id')
        department = request.args.get('department')
        
        if not from_date or not to_date:
            return jsonify({'success': False, 'message': 'From and to dates are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT a.*, 
                   e.first_name, e.last_name, e.employee_code, e.department,
                   e.first_name || ' ' || e.last_name as employee_name
            FROM attendance a
            LEFT JOIN employees e ON a.employee_id = e.id
            WHERE a.date BETWEEN ? AND ?
        """
        params = [from_date, to_date]
        
        if employee_id and employee_id != 'all':
            query += " AND a.employee_id = ?"
            params.append(int(employee_id))
        
        if department and department != 'all':
            query += " AND e.department = ?"
            params.append(department)
        
        query += " ORDER BY a.date DESC, e.first_name"
        
        cursor.execute(query, params)
        attendance = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'attendance': attendance,
            'total': len(attendance)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching attendance report: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance/test', methods=['GET', 'OPTIONS'])
@cross_origin()
def test_attendance():
    """Test endpoint to check if attendance API is working"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        return jsonify({
            'success': True,
            'message': 'Attendance API is working',
            'database_path': DB_PATH,
            'database_exists': os.path.exists(DB_PATH)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500