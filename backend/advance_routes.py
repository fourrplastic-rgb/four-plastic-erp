from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from database import db
from bson import ObjectId
from datetime import datetime
import logging

advance_bp = Blueprint('advance', __name__)
logger = logging.getLogger(__name__)

advances_collection = db.advances
employees_collection = db.employees

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
        
        # Build filter
        filter_query = {}
        if status and status != 'all':
            filter_query['status'] = status
        if employee_id and employee_id != 'all':
            filter_query['employee_id'] = employee_id
        if from_date and to_date:
            filter_query['date'] = {'$gte': from_date, '$lte': to_date}
        elif from_date:
            filter_query['date'] = {'$gte': from_date}
        elif to_date:
            filter_query['date'] = {'$lte': to_date}
        
        # Get advances
        advances = list(advances_collection.find(filter_query).sort('date', -1))
        
        # Add employee details and convert ObjectId
        result = []
        for adv in advances:
            adv['id'] = str(adv.pop('_id'))
            
            employee = employees_collection.find_one({'_id': ObjectId(adv['employee_id'])})
            if employee:
                adv['employee_name'] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}"
                adv['employee_code'] = employee.get('employee_code', '')
            
            result.append(adv)
        
        return jsonify({
            'success': True,
            'advances': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching advances: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/<advance_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_advance(advance_id):
    """Get single advance by ID"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        advance = advances_collection.find_one({'_id': ObjectId(advance_id)})
        
        if not advance:
            return jsonify({'success': False, 'message': 'Advance not found'}), 404
        
        advance['id'] = str(advance.pop('_id'))
        
        # Add employee details
        employee = employees_collection.find_one({'_id': ObjectId(advance['employee_id'])})
        if employee:
            advance['employee_name'] = f"{employee.get('first_name', '')} {employee.get('last_name', '')}"
            advance['employee_code'] = employee.get('employee_code', '')
        
        return jsonify({
            'success': True,
            'advance': advance
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
        
        # Validate required fields
        required_fields = ['employee_id', 'date', 'amount']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Check if employee exists
        employee = employees_collection.find_one({'_id': ObjectId(data['employee_id'])})
        if not employee:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Set defaults
        data['repaid'] = 0
        data['balance'] = float(data['amount'])
        data['status'] = 'pending'
        data['created_at'] = datetime.now()
        data['updated_at'] = datetime.now()
        
        # Insert advance
        result = advances_collection.insert_one(data)
        
        return jsonify({
            'success': True,
            'message': 'Advance created successfully',
            'id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating advance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/<advance_id>', methods=['PUT', 'OPTIONS'])
@cross_origin()
def update_advance(advance_id):
    """Update advance"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        data = request.json
        
        # Check if advance exists
        advance = advances_collection.find_one({'_id': ObjectId(advance_id)})
        if not advance:
            return jsonify({'success': False, 'message': 'Advance not found'}), 404
        
        # Update timestamp
        data['updated_at'] = datetime.now()
        
        # Recalculate balance if amount or repaid changed
        if 'amount' in data or 'repaid' in data:
            amount = float(data.get('amount', advance['amount']))
            repaid = float(data.get('repaid', advance['repaid']))
            data['balance'] = amount - repaid
            data['status'] = 'completed' if data['balance'] <= 0 else 'pending'
        
        # Update advance
        advances_collection.update_one(
            {'_id': ObjectId(advance_id)},
            {'$set': data}
        )
        
        return jsonify({
            'success': True,
            'message': 'Advance updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating advance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/<advance_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_advance(advance_id):
    """Delete advance"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        result = advances_collection.delete_one({'_id': ObjectId(advance_id)})
        
        if result.deleted_count == 0:
            return jsonify({'success': False, 'message': 'Advance not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Advance deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error deleting advance: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/<advance_id>/repay', methods=['POST', 'OPTIONS'])
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
        
        # Get advance
        advance = advances_collection.find_one({'_id': ObjectId(advance_id)})
        if not advance:
            return jsonify({'success': False, 'message': 'Advance not found'}), 404
        
        # Calculate new repaid amount and balance
        new_repaid = float(advance['repaid']) + repayment_amount
        new_balance = float(advance['amount']) - new_repaid
        
        # Update advance
        advances_collection.update_one(
            {'_id': ObjectId(advance_id)},
            {'$set': {
                'repaid': new_repaid,
                'balance': new_balance,
                'status': 'completed' if new_balance <= 0 else 'pending',
                'updated_at': datetime.now()
            }}
        )
        
        # Record repayment transaction
        repayment_record = {
            'advance_id': advance_id,
            'employee_id': advance['employee_id'],
            'amount': repayment_amount,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'created_at': datetime.now()
        }
        db.advance_repayments.insert_one(repayment_record)
        
        return jsonify({
            'success': True,
            'message': 'Repayment recorded successfully',
            'balance': new_balance
        }), 200
        
    except Exception as e:
        logger.error(f"Error recording repayment: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@advance_bp.route('/api/advances/employee/<employee_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_employee_advances(employee_id):
    """Get all advances for an employee"""
    try:
        if request.method == 'OPTIONS':
            return '', 200
            
        advances = list(advances_collection.find({'employee_id': employee_id}).sort('date', -1))
        
        for adv in advances:
            adv['id'] = str(adv.pop('_id'))
        
        return jsonify({
            'success': True,
            'advances': advances
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching employee advances: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500