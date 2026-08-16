from flask import Blueprint, request, jsonify
from database_config import get_db

customer_bp = Blueprint('customer', __name__)

@customer_bp.route('/customers', methods=['GET'])
def get_customers():
    """Get all customers"""
    db = get_db()
    customers = db.execute('SELECT * FROM customers ORDER BY created_at DESC').fetchall()
    
    # Convert to list of dicts
    result = []
    for customer in customers:
        result.append({
            'id': customer['id'],
            'code': customer['code'],
            'name': customer['name'],
            'phone': customer['phone'],
            'mobile': customer['mobile'],
            'email': customer['email'],
            'address': customer['address'],
            'city': customer['city'],
            'state': customer['state'],
            'pincode': customer['pincode'],
            'gst': customer['gst'],
            'pan': customer['pan'],
            'contact_person': customer['contact_person'],
            'credit_limit': customer['credit_limit'],
            'credit_days': customer['credit_days'],
            'opening_balance': customer['opening_balance'],
            'current_balance': customer['current_balance'],
            'is_active': customer['is_active'],
            'created_at': customer['created_at'],
            'updated_at': customer['updated_at']
        })
    
    return jsonify(result)

@customer_bp.route('/customers/<int:id>', methods=['GET'])
def get_customer(id):
    """Get single customer by ID"""
    db = get_db()
    customer = db.execute('SELECT * FROM customers WHERE id = ?', (id,)).fetchone()
    
    if customer is None:
        return jsonify({'error': 'Customer not found'}), 404
    
    return jsonify({
        'id': customer['id'],
        'code': customer['code'],
        'name': customer['name'],
        'phone': customer['phone'],
        'mobile': customer['mobile'],
        'email': customer['email'],
        'address': customer['address'],
        'city': customer['city'],
        'state': customer['state'],
        'pincode': customer['pincode'],
        'gst': customer['gst'],
        'pan': customer['pan'],
        'contact_person': customer['contact_person'],
        'credit_limit': customer['credit_limit'],
        'credit_days': customer['credit_days'],
        'opening_balance': customer['opening_balance'],
        'current_balance': customer['current_balance'],
        'is_active': customer['is_active'],
        'created_at': customer['created_at'],
        'updated_at': customer['updated_at']
    })

@customer_bp.route('/customers', methods=['POST'])
def create_customer():
    """Create new customer"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'phone']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    db = get_db()
    
    # Auto-generate customer code
    last_code = db.execute("SELECT code FROM customers ORDER BY id DESC LIMIT 1").fetchone()
    
    if last_code and last_code['code']:
        try:
            last_num = int(last_code['code'].replace('CUST', ''))
            new_num = last_num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    new_code = f"CUST{new_num:04d}"
    
    # Insert new customer with all fields
    db.execute('''
        INSERT INTO customers (
            code, name, phone, mobile, email, address, city, 
            state, pincode, gst, pan, contact_person,
            credit_limit, credit_days, opening_balance, current_balance,
            is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ''', (
        new_code,
        data.get('name'),
        data.get('phone', ''),
        data.get('mobile', ''),
        data.get('email', ''),
        data.get('address', ''),
        data.get('city', ''),
        data.get('state', ''),
        data.get('pincode', ''),
        data.get('gst', ''),
        data.get('pan', ''),
        data.get('contact_person', ''),
        data.get('credit_limit', 0),
        data.get('credit_days', 30),
        data.get('opening_balance', 0),
        data.get('opening_balance', 0),  # current_balance starts as opening_balance
        1
    ))
    
    db.commit()
    
    # Get the newly created customer to return
    new_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    new_customer = db.execute("SELECT * FROM customers WHERE id = ?", (new_id,)).fetchone()
    
    return jsonify({
        'message': 'Customer created successfully',
        'customer': {
            'id': new_customer['id'],
            'code': new_customer['code'],
            'name': new_customer['name'],
            'phone': new_customer['phone'],
            'email': new_customer['email'],
            'gst': new_customer['gst'],
            'credit_limit': new_customer['credit_limit'],
            'opening_balance': new_customer['opening_balance']
        }
    }), 201

@customer_bp.route('/customers/<int:id>', methods=['PUT'])
def update_customer(id):
    """Update customer"""
    data = request.get_json()
    
    db = get_db()
    
    # Check if customer exists
    customer = db.execute('SELECT * FROM customers WHERE id = ?', (id,)).fetchone()
    if customer is None:
        return jsonify({'error': 'Customer not found'}), 404
    
    # Update customer with all fields
    db.execute('''
        UPDATE customers SET
            name = ?,
            phone = ?,
            mobile = ?,
            email = ?,
            address = ?,
            city = ?,
            state = ?,
            pincode = ?,
            gst = ?,
            pan = ?,
            contact_person = ?,
            credit_limit = ?,
            credit_days = ?,
            opening_balance = ?,
            updated_at = datetime('now')
        WHERE id = ?
    ''', (
        data.get('name', customer['name']),
        data.get('phone', customer['phone']),
        data.get('mobile', customer['mobile']),
        data.get('email', customer['email']),
        data.get('address', customer['address']),
        data.get('city', customer['city']),
        data.get('state', customer['state']),
        data.get('pincode', customer['pincode']),
        data.get('gst', customer['gst']),
        data.get('pan', customer['pan']),
        data.get('contact_person', customer['contact_person']),
        data.get('credit_limit', customer['credit_limit']),
        data.get('credit_days', customer['credit_days']),
        data.get('opening_balance', customer['opening_balance']),
        id
    ))
    
    db.commit()
    
    return jsonify({'message': 'Customer updated successfully'})

@customer_bp.route('/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    """Delete customer"""
    db = get_db()
    
    # Check if customer exists
    customer = db.execute('SELECT id FROM customers WHERE id = ?', (id,)).fetchone()
    if customer is None:
        return jsonify({'error': 'Customer not found'}), 404
    
    # Delete customer
    db.execute('DELETE FROM customers WHERE id = ?', (id,))
    db.commit()
    
    return jsonify({'message': 'Customer deleted successfully'})

# Backwards-compatible API routes with /api prefix
@customer_bp.route('/api/customers', methods=['GET', 'POST'])
def api_customers():
    if request.method == 'GET':
        return get_customers()
    return create_customer()

@customer_bp.route('/api/customers/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def api_customer_detail(id):
    if request.method == 'GET':
        return get_customer(id)
    if request.method == 'PUT':
        return update_customer(id)
    if request.method == 'DELETE':
        return delete_customer(id)

@customer_bp.route('/api/customers/search', methods=['GET'])
def api_search_customers():
    """Search customers by query param `q`"""
    q = request.args.get('q', '')
    db = get_db()
    search_term = f"%{q}%"
    rows = db.execute('''
        SELECT * FROM customers
        WHERE (name LIKE ? OR code LIKE ? OR phone LIKE ? OR email LIKE ?)
        ORDER BY name
        LIMIT 100
    ''', (search_term, search_term, search_term, search_term)).fetchall()

    result = []
    for customer in rows:
        result.append({
            'id': customer['id'],
            'code': customer['code'],
            'name': customer['name'],
            'phone': customer['phone'],
            'mobile': customer['mobile'],
            'email': customer['email'],
            'address': customer['address'],
            'city': customer['city'],
            'state': customer['state'],
            'pincode': customer['pincode'],
            'gst': customer['gst'],
            'pan': customer['pan'],
            'contact_person': customer['contact_person'],
            'credit_limit': customer['credit_limit'],
            'credit_days': customer['credit_days'],
            'opening_balance': customer['opening_balance'],
            'current_balance': customer['current_balance'],
            'is_active': customer['is_active'],
            'created_at': customer['created_at'],
            'updated_at': customer['updated_at']
        })

    return jsonify(result)