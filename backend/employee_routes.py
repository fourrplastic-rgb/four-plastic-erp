from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from database import db
from bson import ObjectId
from datetime import datetime
import logging

employee_bp = Blueprint('employee', __name__)
logger = logging.getLogger(__name__)

# Collection
employees_collection = db.employees

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
        
        # Build filter
        filter_query = {}
        if status and status != 'all':
            filter_query['status'] = status
        if department and department != 'all':
            filter_query['department'] = department
        if search:
            filter_query['$or'] = [
                {'first_name': {'$regex': search, '$options': 'i'}},
                {'last_name': {'$regex': search, '$options': 'i'}},
                {'employee_code': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
                {'phone': {'$regex': search, '$options': 'i'}}
            ]
        
        # Get employees
        employees = list(employees_collection.find(filter_query).sort('first_name', 1))
        
        # Convert ObjectId to string
        for emp in employees:
            emp['id'] = str(emp.pop('_id'))
        
        return jsonify({
            'success': True,
            'employees': employees,
            'total': len(employees)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching employees: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees/<employee_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_employee(employee_id):
    """Get single employee by ID"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        employee = employees_collection.find_one({'_id': ObjectId(employee_id)})
        
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        employee['id'] = str(employee.pop('_id'))
        
        return jsonify({
            'success': True,
            'employee': employee
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
        
        # Check if email already exists
        existing = employees_collection.find_one({'email': data['email']})
        if existing:
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Check if employee code already exists
        if 'employee_code' in data:
            existing_code = employees_collection.find_one({'employee_code': data['employee_code']})
            if existing_code:
                return jsonify({'success': False, 'message': 'Employee code already exists'}), 400
        
        # Add timestamps
        data['created_at'] = datetime.now()
        data['updated_at'] = datetime.now()
        
        # Set default status if not provided
        if 'status' not in data:
            data['status'] = 'active'
        
        # Insert employee
        result = employees_collection.insert_one(data)
        
        return jsonify({
            'success': True,
            'message': 'Employee created successfully',
            'id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating employee: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees/<employee_id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def update_employee(employee_id):
    """Update employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        
        # Check if employee exists
        employee = employees_collection.find_one({'_id': ObjectId(employee_id)})
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Check email uniqueness if changing
        if 'email' in data and data['email'] != employee['email']:
            existing = employees_collection.find_one({'email': data['email']})
            if existing:
                return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Add updated timestamp
        data['updated_at'] = datetime.now()
        
        # Update employee
        employees_collection.update_one(
            {'_id': ObjectId(employee_id)},
            {'$set': data}
        )
        
        return jsonify({
            'success': True,
            'message': 'Employee updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating employee: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@employee_bp.route('/api/employees/<employee_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_employee(employee_id):
    """Delete employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        # Check if employee has any advances or attendance records
        from bson import ObjectId
        advances_count = db.advances.count_documents({'employee_id': employee_id})
        attendance_count = db.attendance.count_documents({'employee_id': employee_id})
        
        if advances_count > 0 or attendance_count > 0:
            return jsonify({
                'success': False, 
                'message': 'Cannot delete employee with existing records. Please mark as inactive instead.'
            }), 400
        
        result = employees_collection.delete_one({'_id': ObjectId(employee_id)})
        
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
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
            
        last_employee = employees_collection.find_one(
            {},
            sort=[('employee_code', -1)]
        )
        
        last_code = last_employee['employee_code'] if last_employee else 'EMP000'
        
        return jsonify({
            'success': True,
            'lastCode': last_code
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting last code: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500