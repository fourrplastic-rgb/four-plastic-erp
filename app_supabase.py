# app_supabase.py
from flask import Flask, jsonify, g, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
DB_MODE = os.getenv('DB_MODE', 'sqlite')

# Initialize Supabase client
supabase = None
pg_pool = None

print(f"🔧 Database Mode: {DB_MODE}")
print(f"🔗 Supabase URL: {SUPABASE_URL}")

if DB_MODE == 'supabase' and SUPABASE_URL and SUPABASE_KEY:
    try:
        # Initialize Supabase client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized")
        
        # Initialize PostgreSQL connection pool
        pg_pool = ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=os.getenv('SUPABASE_DB_URL')
        )
        print("✅ PostgreSQL connection pool initialized")
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        DB_MODE = 'sqlite'
        print("⚠️  Falling back to SQLite mode")
else:
    print("⚠️  Supabase not configured, using SQLite mode")

# Database connection helper
def get_db():
    """Get database connection based on mode"""
    if DB_MODE == 'supabase':
        if not hasattr(g, 'pg_conn'):
            g.pg_conn = pg_pool.getconn()
            g.pg_conn.cursor_factory = RealDictCursor
        return g.pg_conn
    else:
        # SQLite fallback
        import sqlite3
        if not hasattr(g, 'sqlite_db'):
            sqlite_path = os.getenv('SQLITE_DB_PATH', 'database/manufacturing.db')
            os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
            g.sqlite_db = sqlite3.connect(sqlite_path)
            g.sqlite_db.row_factory = sqlite3.Row
        return g.sqlite_db

@app.teardown_appcontext
def close_db(error):
    """Close database connections"""
    if DB_MODE == 'supabase':
        if hasattr(g, 'pg_conn'):
            pg_pool.putconn(g.pg_conn)
    else:
        if hasattr(g, 'sqlite_db'):
            g.sqlite_db.close()

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'database_mode': DB_MODE,
        'message': 'FOUR PLASTIC API',
        'version': '1.0.0'
    })

# Test Supabase connection
@app.route('/api/test-supabase', methods=['GET'])
def test_supabase():
    try:
        if DB_MODE != 'supabase':
            return jsonify({'error': 'Not in Supabase mode', 'mode': DB_MODE}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Test if tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            LIMIT 5
        """)
        tables = cursor.fetchall()
        
        return jsonify({
            'status': 'connected',
            'database_mode': DB_MODE,
            'tables': tables
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Customers endpoint
@app.route('/api/customers', methods=['GET'])
def get_customers():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM customers 
            WHERE is_active = 1 
            ORDER BY name
            LIMIT 100
        """)
        
        customers = cursor.fetchall()
        return jsonify(customers)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM customers WHERE id = %s
        """, (customer_id,))
        
        customer = cursor.fetchone()
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        
        return jsonify(customer)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers', methods=['POST'])
def create_customer():
    try:
        data = request.json
        conn = get_db()
        cursor = conn.cursor()
        
        # Generate customer code
        cursor.execute("SELECT COUNT(*) as count FROM customers")
        count = cursor.fetchone()['count']
        code = f"CUST{count + 1}"
        
        cursor.execute("""
            INSERT INTO customers (
                code, name, phone, mobile, email, address, 
                city, state, pincode, gst, pan, contact_person,
                credit_limit, credit_days, opening_balance, 
                current_balance, is_active, company_id
            ) VALUES (
                %s, %s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            ) RETURNING *
        """, (
            code, 
            data.get('name'), 
            data.get('phone'), 
            data.get('mobile'),
            data.get('email'), 
            data.get('address'), 
            data.get('city'),
            data.get('state'), 
            data.get('pincode'), 
            data.get('gst'),
            data.get('pan'), 
            data.get('contact_person'), 
            data.get('credit_limit', 0),
            data.get('credit_days', 30), 
            data.get('opening_balance', 0),
            data.get('opening_balance', 0), 
            1, 
            data.get('company_id', 1)
        ))
        
        conn.commit()
        new_customer = cursor.fetchone()
        return jsonify(new_customer), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Sales Invoices endpoint
@app.route('/api/sales-invoices', methods=['GET'])
def get_sales_invoices():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                si.*,
                c.name as customer_name,
                c.mobile as customer_mobile
            FROM sales_invoice si
            LEFT JOIN customers c ON si.customer_id = c.id
            ORDER BY si.invoice_date DESC
            LIMIT 100
        """)
        
        invoices = cursor.fetchall()
        return jsonify(invoices)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Items endpoint
@app.route('/api/items', methods=['GET'])
def get_items():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get finished goods
        cursor.execute("""
            SELECT 
                id, 'finished_good' as type, code, name, unit,
                current_stock, gst_rate, sales_rate as rate
            FROM finished_goods
            WHERE is_active = 1
            
            UNION ALL
            
            SELECT 
                id, 'raw_material' as type, code, name, unit,
                current_stock, gst_rate, purchase_rate as rate
            FROM raw_materials
            WHERE is_active = 1
            
            ORDER BY name
        """)
        
        items = cursor.fetchall()
        return jsonify(items)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the app
if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 FOUR PLASTIC - Backend Server")
    print("="*70)
    print(f"📊 Database Mode: {DB_MODE.upper()}")
    
    if DB_MODE == 'supabase':
        print(f"🔗 Supabase URL: {SUPABASE_URL}")
        print("✅ Using PostgreSQL database")
    else:
        print("⚠️  Using SQLite database")
        print(f"📁 SQLite Path: {os.getenv('SQLITE_DB_PATH')}")
    
    print(f"📍 Server: http://localhost:5000")
    print("\n📌 API Endpoints:")
    print("   ├─ GET  /api/health - Health check")
    print("   ├─ GET  /api/test-supabase - Test Supabase connection")
    print("   ├─ GET  /api/customers - List customers")
    print("   ├─ POST /api/customers - Create customer")
    print("   ├─ GET  /api/sales-invoices - List invoices")
    print("   └─ GET  /api/items - List items")
    print("\n" + "="*70 + "\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
