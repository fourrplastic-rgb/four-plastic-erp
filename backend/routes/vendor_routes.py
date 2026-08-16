"""
Vendor Routes - Complete API endpoints for vendors
"""
from flask import Blueprint, request, jsonify
import sqlite3
import os

vendor_bp = Blueprint('vendor', __name__, url_prefix='/api/vendors')

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                       "database", "manufacturing.db")

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@vendor_bp.route('', methods=['GET', 'POST'])
def vendors():
    """Handle GET (list) and POST (create) for vendors"""
    
    # GET - List all vendors
    if request.method == 'GET':
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM vendors WHERE is_active = 1 ORDER BY name')
        vendors = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(vendors)
    
    # POST - Create new vendor
    if request.method == 'POST':
        try:
            data = request.json
            print("📝 Creating vendor with data:", data)
            
            conn = get_db()
            cursor = conn.cursor()
            
            # Generate vendor code
            cursor.execute("SELECT COUNT(*) as count FROM vendors")
            count = cursor.fetchone()[0] + 1
            code = f"VEN{count:04d}"
            
            cursor.execute('''
                INSERT INTO vendors (
                    code, name, phone, mobile, email, address, city, state,
                    pincode, gst, pan, contact_person, opening_balance,
                    current_balance, is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            ''', (
                code,
                data.get('name', ''),
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
                float(data.get('opening_balance', 0)),
                float(data.get('opening_balance', 0))  # current_balance starts as opening_balance
            ))
            
            vendor_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            print("✅ Vendor created with ID:", vendor_id)
            
            return jsonify({
                'id': vendor_id,
                'code': code,
                'message': 'Vendor created successfully'
            }), 201
            
        except Exception as e:
            print("❌ Error creating vendor:", str(e))
            return jsonify({'error': str(e)}), 500

@vendor_bp.route('/<int:vendor_id>', methods=['GET', 'PUT', 'DELETE'])
def vendor_detail(vendor_id):
    """Handle GET, PUT, DELETE for single vendor"""
    
    # GET - Get single vendor
    if request.method == 'GET':
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,))
        vendor = cursor.fetchone()
        conn.close()
        if vendor:
            return jsonify(dict(vendor))
        return jsonify({'error': 'Vendor not found'}), 404
    
    # PUT - Update vendor
    if request.method == 'PUT':
        try:
            data = request.json
            print("📝 Updating vendor ID", vendor_id, "with data:", data)
            
            conn = get_db()
            cursor = conn.cursor()
            
            # First get the current vendor data
            cursor.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,))
            current = cursor.fetchone()
            if not current:
                conn.close()
                return jsonify({'error': 'Vendor not found'}), 404
            
            # Update vendor with only the columns that exist in vendors table
            cursor.execute('''
                UPDATE vendors SET
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
                    opening_balance = ?,
                    current_balance = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                data.get('name', current['name']),
                data.get('phone', current['phone']),
                data.get('mobile', current['mobile']),
                data.get('email', current['email']),
                data.get('address', current['address']),
                data.get('city', current['city']),
                data.get('state', current['state']),
                data.get('pincode', current['pincode']),
                data.get('gst', current['gst']),
                data.get('pan', current['pan']),
                data.get('contact_person', current['contact_person']),
                float(data.get('opening_balance', current['opening_balance'] or 0)),
                float(data.get('opening_balance', current['opening_balance'] or 0)),  # Update current_balance
                vendor_id
            ))
            
            conn.commit()
            conn.close()
            
            print("✅ Vendor updated successfully")
            return jsonify({'message': 'Vendor updated successfully'})
            
        except Exception as e:
            print("❌ Error updating vendor:", str(e))
            return jsonify({'error': str(e)}), 500
    
    # DELETE - Delete vendor
    if request.method == 'DELETE':
        try:
            conn = get_db()
            cursor = conn.cursor()
            # Soft delete by setting is_active = 0
            cursor.execute('UPDATE vendors SET is_active = 0 WHERE id = ?', (vendor_id,))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Vendor deleted successfully'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@vendor_bp.route('/search', methods=['GET'])
def search_vendors():
    """Search vendors by name, code, phone, or email"""
    query = request.args.get('q', '')
    conn = get_db()
    cursor = conn.cursor()
    search_term = f"%{query}%"
    cursor.execute('''
        SELECT id, code, name, phone, email, gst, opening_balance 
        FROM vendors 
        WHERE is_active = 1 
        AND (name LIKE ? OR code LIKE ? OR phone LIKE ? OR email LIKE ?)
        ORDER BY name
        LIMIT 50
    ''', (search_term, search_term, search_term, search_term))
    vendors = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(vendors)