from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print(f"\n🚀 Starting FOUR PLASTIC API")
print(f"🔗 Supabase URL: {SUPABASE_URL}")
print(f"✅ Supabase client initialized")

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'database': 'supabase',
        'message': 'FOUR PLASTIC API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/customers', methods=['GET'])
def get_customers():
    try:
        response = supabase.table('customers').select('*').eq('is_active', 1).order('name').execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    try:
        response = supabase.table('customers').select('*').eq('id', customer_id).execute()
        if response.data:
            return jsonify(response.data[0])
        return jsonify({'error': 'Customer not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers', methods=['POST'])
def create_customer():
    try:
        data = request.json
        
        # Get count for code
        count_response = supabase.table('customers').select('*', count='exact').execute()
        count = count_response.count
        code = f"CUST{count + 1}"
        
        # Insert customer
        customer_data = {
            'code': code,
            'name': data.get('name'),
            'mobile': data.get('mobile'),
            'email': data.get('email'),
            'address': data.get('address'),
            'city': data.get('city'),
            'state': data.get('state'),
            'pincode': data.get('pincode'),
            'gst': data.get('gst'),
            'contact_person': data.get('contact_person'),
            'credit_limit': data.get('credit_limit', 0),
            'credit_days': data.get('credit_days', 30),
            'company_id': data.get('company_id', 1),
            'is_active': 1
        }
        
        response = supabase.table('customers').insert(customer_data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/items', methods=['GET'])
def get_items():
    try:
        # Get finished goods
        fg_response = supabase.table('finished_goods').select('*').eq('is_active', 1).execute()
        
        # Get raw materials
        rm_response = supabase.table('raw_materials').select('*').eq('is_active', 1).execute()
        
        # Combine and add type
        items = []
        for item in fg_response.data:
            item['type'] = 'finished_good'
            items.append(item)
        
        for item in rm_response.data:
            item['type'] = 'raw_material'
            items.append(item)
        
        return jsonify(items)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sales-invoices', methods=['GET'])
def get_sales_invoices():
    try:
        response = supabase.table('sales_invoice').select('*, customers(name, mobile)').order('invoice_date', desc=True).limit(100).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sales-invoices', methods=['POST'])
def create_sales_invoice():
    try:
        data = request.json
        invoice_data = data.get('invoice')
        items_data = data.get('items')
        
        # Generate invoice number
        invoice_count = supabase.table('sales_invoice').select('*', count='exact').execute()
        invoice_no = f"INV{datetime.now().strftime('%y%m%d')}{invoice_count.count + 1:04d}"
        
        # Insert invoice
        invoice_data['invoice_no'] = invoice_no
        invoice_data['invoice_date'] = datetime.now().date().isoformat()
        
        invoice_response = supabase.table('sales_invoice').insert(invoice_data).execute()
        invoice_id = invoice_response.data[0]['id']
        
        # Insert items
        for item in items_data:
            item['invoice_id'] = invoice_id
            supabase.table('sales_invoice_items').insert(item).execute()
        
        return jsonify(invoice_response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test():
    try:
        # Test connection by getting count of customers
        response = supabase.table('customers').select('*', count='exact').execute()
        return jsonify({
            'status': 'connected',
            'customers_count': response.count,
            'message': 'Supabase connection successful!'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*70)
    print("📍 Server: http://localhost:5000")
    print("\n📌 API Endpoints:")
    print("   ├─ GET  /api/health - Health check")
    print("   ├─ GET  /api/test - Test Supabase connection")
    print("   ├─ GET  /api/customers - List customers")
    print("   ├─ POST /api/customers - Create customer")
    print("   ├─ GET  /api/items - List items")
    print("   └─ GET  /api/sales-invoices - List invoices")
    print("="*70 + "\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')