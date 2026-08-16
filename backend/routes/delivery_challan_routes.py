from flask import Blueprint, request, jsonify
from models.delivery_challan_model import DeliveryChallan
from models.customer_model import CustomerModel
import traceback

delivery_challan_bp = Blueprint('delivery_challan', __name__)

# Initialize table
DeliveryChallan.create_table()

# Route for getting next number
@delivery_challan_bp.route('/api/delivery-challans/next-number', methods=['GET', 'OPTIONS'])
def get_next_number():
    """Get next delivery challan number"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    
    try:
        result = DeliveryChallan.get_next_number()
        print(f"✅ Next challan number: {result}")
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Error getting next number: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Main routes for delivery challans
@delivery_challan_bp.route('/api/delivery-challans', methods=['GET', 'POST', 'OPTIONS'])
@delivery_challan_bp.route('/api/delivery-challans/', methods=['GET', 'POST', 'OPTIONS'])
def handle_challans():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200

    if request.method == 'GET':
        return get_all()
    elif request.method == 'POST':
        return create()

@delivery_challan_bp.route('/api/delivery-challans/<int:challan_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def handle_challan(challan_id):
    """Handle individual challan operations"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    
    if request.method == 'GET':
        return get_by_id(challan_id)
    elif request.method == 'PUT':
        return update(challan_id)
    elif request.method == 'DELETE':
        return delete(challan_id)

@delivery_challan_bp.route('/api/delivery-challans/<int:challan_id>/status', methods=['PUT', 'OPTIONS'])
def update_challan_status(challan_id):
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'PUT,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
        
    try:
        data = request.json
        status = data.get('status')
        if not status:
            return jsonify({'error': 'Status is required'}), 400
            
        result = DeliveryChallan.update_status(challan_id, status)
        return jsonify(result), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def get_all():
    """Get all delivery challans"""
    try:
        challans = DeliveryChallan.get_all()
        return jsonify(challans), 200
    except Exception as e:
        print(f"❌ Error fetching challans: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def get_by_id(challan_id):
    """Get delivery challan by ID"""
    try:
        challan = DeliveryChallan.get_by_id(challan_id)
        if challan:
            return jsonify(challan), 200
        return jsonify({'error': 'Delivery challan not found'}), 404
    except Exception as e:
        print(f"❌ Error fetching challan {challan_id}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def create():
    """Create new delivery challan"""
    try:
        data = request.json
        print("📥 Creating delivery challan:", data)
        
        # Validate required fields
        if not data.get('customer_id'):
            return jsonify({'error': 'Customer is required'}), 400
            
        if not data.get('challan_date'):
            return jsonify({'error': 'Challan date is required'}), 400
        
        result = DeliveryChallan.create(data)
        return jsonify(result), 201
        
    except Exception as e:
        print(f"❌ Error creating delivery challan: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def update(challan_id):
    """Update delivery challan"""
    try:
        data = request.json
        print(f"📥 Updating delivery challan {challan_id}:", data)
        
        result = DeliveryChallan.update(challan_id, data)
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Error updating delivery challan {challan_id}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def delete(challan_id):
    """Delete delivery challan"""
    try:
        result = DeliveryChallan.delete(challan_id)
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Error deleting delivery challan {challan_id}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500