from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from database import db
from bson import ObjectId
from datetime import datetime, timedelta
import logging

attendance_bp = Blueprint('attendance', __name__)
logger = logging.getLogger(__name__)

attendance_collection = db.attendance
employees_collection = db.employees

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
        
        # Get attendance records for the date
        attendance = list(attendance_collection.find({'date': date}))
        
        # Convert ObjectId to string and add employee details
        for record in attendance:
            record['id'] = str(record.pop('_id'))
            
            # Get employee details
            employee = employees_collection.find_one({'_id': ObjectId(record['employee_id'])})
            if employee:
                record['employee_name'] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}"
                record['employee_code'] = employee.get('employee_code', '')
                record['department'] = employee.get('department', '')
        
        return jsonify({
            'success': True,
            'attendance': attendance,
            'date': date
        }), 200
        
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
        
        attendance = list(attendance_collection.find({'date': today}))
        
        present = len([a for a in attendance if a['status'] == 'present'])
        absent = len([a for a in attendance if a['status'] == 'absent'])
        late = len([a for a in attendance if a['status'] == 'late'])
        halfday = len([a for a in attendance if a['status'] == 'halfday'])
        leave = len([a for a in attendance if a['status'] == 'leave'])
        
        return jsonify({
            'success': True,
            'present': present,
            'absent': absent,
            'late': late,
            'halfday': halfday,
            'leave': leave,
            'total': present + absent + late + halfday + leave
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
        
        # Check if employee exists
        employee = employees_collection.find_one({'_id': ObjectId(data['employee_id'])})
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Check if attendance already exists for this employee on this date
        existing = attendance_collection.find_one({
            'employee_id': data['employee_id'],
            'date': data['date']
        })
        
        if existing:
            # Update existing
            data['updated_at'] = datetime.now()
            
            # Calculate hours if check_in and check_out provided
            if data.get('check_in') and data.get('check_out'):
                try:
                    check_in = datetime.strptime(data['check_in'], '%H:%M')
                    check_out = datetime.strptime(data['check_out'], '%H:%M')
                    diff = check_out - check_in
                    data['hours'] = round(diff.total_seconds() / 3600, 1)
                except:
                    data['hours'] = None
            
            attendance_collection.update_one(
                {'_id': existing['_id']},
                {'$set': data}
            )
            message = 'Attendance updated successfully'
        else:
            # Create new
            data['created_at'] = datetime.now()
            data['updated_at'] = datetime.now()
            
            # Calculate hours if check_in and check_out provided
            if data.get('check_in') and data.get('check_out'):
                try:
                    check_in = datetime.strptime(data['check_in'], '%H:%M')
                    check_out = datetime.strptime(data['check_out'], '%H:%M')
                    diff = check_out - check_in
                    data['hours'] = round(diff.total_seconds() / 3600, 1)
                except:
                    data['hours'] = None
            
            attendance_collection.insert_one(data)
            message = 'Attendance marked successfully'
        
        return jsonify({
            'success': True,
            'message': message
        }), 201
        
    except Exception as e:
        logger.error(f"Error marking attendance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance/<attendance_id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def update_attendance(attendance_id):
    """Update attendance record"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        
        data['updated_at'] = datetime.now()
        
        # Recalculate hours if times changed
        if data.get('check_in') and data.get('check_out'):
            try:
                check_in = datetime.strptime(data['check_in'], '%H:%M')
                check_out = datetime.strptime(data['check_out'], '%H:%M')
                diff = check_out - check_in
                data['hours'] = round(diff.total_seconds() / 3600, 1)
            except:
                data['hours'] = None
        
        attendance_collection.update_one(
            {'_id': ObjectId(attendance_id)},
            {'$set': data}
        )
        
        return jsonify({
            'success': True,
            'message': 'Attendance updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating attendance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance/<attendance_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_attendance(attendance_id):
    """Delete attendance record"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        result = attendance_collection.delete_one({'_id': ObjectId(attendance_id)})
        
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Attendance record not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Attendance deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting attendance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@attendance_bp.route('/api/attendance/employee/<employee_id>/recent', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_employee_recent_attendance(employee_id):
    """Get recent attendance for an employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        # Get last 30 days attendance
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        
        attendance = list(attendance_collection.find({
            'employee_id': employee_id,
            'date': {'$gte': thirty_days_ago}
        }).sort('date', -1).limit(30))
        
        for record in attendance:
            record['id'] = str(record.pop('_id'))
        
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
        
        # Build filter
        filter_query = {
            'date': {'$gte': from_date, '$lte': to_date}
        }
        
        if employee_id and employee_id != 'all':
            filter_query['employee_id'] = employee_id
        
        # Get attendance records
        attendance = list(attendance_collection.find(filter_query).sort('date', -1))
        
        # Add employee details
        result = []
        for record in attendance:
            record['id'] = str(record.pop('_id'))
            
            employee = employees_collection.find_one({'_id': ObjectId(record['employee_id'])})
            if employee:
                if department and department != 'all' and employee.get('department') != department:
                    continue
                    
                record['employee_name'] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}"
                record['employee_code'] = employee.get('employee_code', '')
                record['department'] = employee.get('department', '')
                result.append(record)
        
        return jsonify({
            'success': True,
            'attendance': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching attendance report: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500