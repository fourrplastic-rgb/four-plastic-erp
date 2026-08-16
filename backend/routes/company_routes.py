"""
Company Settings Routes - API endpoints for company settings
"""
from flask import Blueprint, request, jsonify
from config.database import get_db, dict_from_row
import traceback

company_bp = Blueprint('company', __name__, url_prefix='/api/company')

@company_bp.route('', methods=['GET'])
def get_company():
    """Get company settings"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM company_settings WHERE id = 1')
        company = dict_from_row(cursor.fetchone())
        conn.close()
        
        if company:
            return jsonify(company)
        else:
            # Return default empty object if no settings found
            return jsonify({
                'company_name': 'FOUR® PLASTIC',
                'address': '',
                'city': '',
                'state': '',
                'pincode': '',
                'gst': '',
                'phone': '',
                'email': ''
            })
    except Exception as e:
        print(f"❌ Error fetching company settings: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@company_bp.route('', methods=['PUT'])
def update_company():
    """Update company settings"""
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if settings exist
        cursor.execute('SELECT id FROM company_settings WHERE id = 1')
        exists = cursor.fetchone()
        
        if exists:
            cursor.execute('''
                UPDATE company_settings SET
                    company_name = ?,
                    address = ?,
                    phone = ?,
                    email = ?,
                    gst = ?,
                    pan = ?,
                    cin = ?,
                    state = ?,
                    state_code = ?,
                    logo_path = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = 1
            ''', (
                data.get('company_name'),
                data.get('address'),
                data.get('phone'),
                data.get('email'),
                data.get('gst'),
                data.get('pan'),
                data.get('cin'),
                data.get('state'),
                data.get('state_code'),
                data.get('logo_path')
            ))
        else:
            cursor.execute('''
                INSERT INTO company_settings (
                    id, company_name, address, phone, email,
                    gst, pan, cin, state, state_code, logo_path
                ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get('company_name'),
                data.get('address'),
                data.get('phone'),
                data.get('email'),
                data.get('gst'),
                data.get('pan'),
                data.get('cin'),
                data.get('state'),
                data.get('state_code'),
                data.get('logo_path')
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Company settings updated successfully'})
        
    except Exception as e:
        print(f"❌ Error updating company settings: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@company_bp.route('/default', methods=['GET'])
def get_default_company():
    """Get default company settings from config"""
    try:
        # Return default values from your config
        return jsonify({
            'company_name': 'FOUR® PLASTIC',
            'address': '90 FEET ROAD, WIRE GALI, KHADI NO.3, ANISH COMPOUND, SAKINAKA',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'pincode': '400078',
            'gst': '27ABTPV9432F1ZX',
            'pan': 'AAAAA0000A',
            'phone': '9876543210',
            'email': 'info@fourplastic.com'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@company_bp.route('/list', methods=['GET'])
def list_companies():
    """List all active companies"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, address, phone, email, gst_no FROM companies WHERE is_active = 1')
        companies = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(companies)
    except Exception as e:
        print(f"❌ Error fetching companies list: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500