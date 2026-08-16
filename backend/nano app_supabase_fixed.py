from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime

# Load .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# ✅ ENV VARIABLES (SAFE CHECK)
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ ERROR: Missing SUPABASE_URL or SUPABASE_KEY in .env")
    exit()

print("\n🚀 Starting FOUR PLASTIC API with Supabase")
print(f"🔗 Supabase URL: {SUPABASE_URL}")

# ✅ INIT CLIENT
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase connected successfully")
except Exception as e:
    print(f"❌ Supabase connection failed: {e}")
    supabase = None


# ===============================
# HEALTH
# ===============================
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'database': 'supabase',
        'timestamp': datetime.now().isoformat()
    })


# ===============================
# TEST CONNECTION
# ===============================
@app.route('/api/test', methods=['GET'])
def test_connection():
    try:
        res = supabase.table('customers').select('*', count='exact').execute()
        return jsonify({
            'status': 'connected',
            'customers_count': res.count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===============================
# CUSTOMERS
# ===============================
@app.route('/api/customers', methods=['GET'])
def get_customers():
    try:
        res = supabase.table('customers') \
            .select('*') \
            .eq('is_active', 1) \
            .order('name') \
            .execute()

        return jsonify(res.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/customers/<customer_id>', methods=['GET'])
def get_customer(customer_id):
    try:
        res = supabase.table('customers') \
            .select('*') \
            .eq('id', customer_id) \
            .execute()

        if res.data:
            return jsonify(res.data[0])

        return jsonify({'error': 'Customer not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/customers', methods=['POST'])
def create_customer():
    try:
        data = request.json or {}

        # ✅ Prevent duplicate mobile
        if data.get('mobile'):
            existing = supabase.table('customers') \
                .select('*') \
                .eq('mobile', data['mobile']) \
                .execute()

            if existing.data:
                return jsonify({'error': 'Mobile already exists'}), 400

        # Generate code safely
        count_res = supabase.table('customers').select('*', count='exact').execute()
        code = f"CUST{count_res.count + 1}"

        customer = {
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

        res = supabase.table('customers').insert(customer).execute()

        return jsonify(res.data[0]), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===============================
# ITEMS
# ===============================
@app.route('/api/items', methods=['GET'])
def get_items():
    try:
        items = []

        fg = supabase.table('finished_goods').select('*').eq('is_active', 1).execute()
        for i in fg.data:
            i['type'] = 'finished_good'
            items.append(i)

        rm = supabase.table('raw_materials').select('*').eq('is_active', 1).execute()
        for i in rm.data:
            i['type'] = 'raw_material'
            items.append(i)

        return jsonify(items)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===============================
# SALES INVOICE
# ===============================
@app.route('/api/sales-invoices', methods=['POST'])
def create_invoice():
    try:
        data = request.json or {}
        invoice = data.get('invoice', {})
        items = data.get('items', [])

        count = supabase.table('sales_invoice').select('*', count='exact').execute()
        invoice_no = f"INV{datetime.now().strftime('%y%m%d')}{count.count + 1:04d}"

        invoice['invoice_no'] = invoice_no
        invoice['invoice_date'] = datetime.now().date().isoformat()

        inv_res = supabase.table('sales_invoice').insert(invoice).execute()

        if not inv_res.data:
            return jsonify({'error': 'Invoice failed'}), 500

        inv_id = inv_res.data[0]['id']

        for item in items:
            item['invoice_id'] = inv_id

        if items:
            supabase.table('sales_invoice_items').insert(items).execute()

        return jsonify(inv_res.data[0]), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===============================
# RUN SERVER
# ===============================
if __name__ == '__main__':
    print("\n🌐 Server running at http://localhost:5000\n")
    app.run(debug=True, port=5000, host='0.0.0.0')