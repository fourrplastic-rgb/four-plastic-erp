from flask import Flask, jsonify, send_from_directory, g, request
from flask_cors import CORS
import os
import sqlite3
import time

# Import existing blueprints
from routes.customer_routes import customer_bp
from routes.vendor_routes import vendor_bp
from routes.bank_routes import bank_bp
from routes.item_routes import item_bp
from routes.sales_invoice_routes import sales_invoice_bp
from routes.purchase_invoice_routes import purchase_invoice_bp
from routes.stock_routes import stock_bp
from routes.customer_ledger_routes import customer_ledger_bp
from routes.vendor_ledger_routes import vendor_ledger_bp
from routes.customer_payments_routes import customer_payments_bp
from routes.vendor_payments_routes import vendor_payments_bp
from routes.delivery_challan_routes import delivery_challan_bp
from routes.company_routes import company_bp
from routes.production_routes import production_bp
from routes.cost_center_routes import cost_center_bp

# Import PAYROLL blueprints
from routes.employee_routes import employee_bp
from routes.attendance_routes import attendance_bp
from routes.advance_routes import advance_bp
from routes.accounting_routes import accounting_bp
from routes.tax_routes import tax_bp
from routes.tax_records_routes import tax_records_bp
from routes.tax_advisor_routes import tax_advisor_bp
from routes.payout_routes import payout_bp
from routes.payslip_routes import payslip_bp

# Import DAILY REPORT blueprint
from routes.daily_report_routes import daily_report_bp

# Import BACKUP blueprint
from routes.backup_routes import backup_bp
from routes.dashboard_routes import dashboard_bp

# Import FINANCIAL YEAR blueprint
from routes.financial_year_routes import financial_year_bp

# Import STANDALONE LOT blueprint
from routes.standalone_lot_routes import standalone_lot_bp

# Import STOCK ADJUSTMENT blueprint
from routes.stock_adjustment_routes import stock_adj_bp

# Import UPLOADS blueprint
from routes.upload_routes import upload_bp

# Import AUTH blueprint
from routes.auth_routes import auth_bp

# Import BANK STATEMENT CONVERTER
from routes.bank_statement_routes import bank_statement_bp

# Import TALLY PARSER blueprint
from routes.tally_parser_routes import tally_parser_bp
from supabase_sync import download_db, upload_db_async

app = Flask(__name__, 
            static_folder='../frontend/out',  # For production build
            static_url_path='')

# Download the database from Supabase Storage on startup
download_db()

@app.after_request
def after_request_callback(response):
    # Upload local database changes back to the cloud asynchronously in a background thread
    if request.method in ['POST', 'PUT', 'DELETE', 'PATCH'] and response.status_code < 400:
        try:
            upload_db_async()
        except Exception as e:
            print(f"⚠️ Failed to auto-upload database changes: {e}")
    return response

# Disable strict slashes globally to prevent 308 redirects that strip Authorization headers
app.url_map.strict_slashes = False

# Configure CORS properly to allow local network IPs on port 3000
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", r"http://.*:3000", r"https://.*:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     supports_credentials=True,
     max_age=3600)

# Database helper function
def get_db():
    """Get database connection with retry on lock"""
    if 'db' not in g:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                manufacturing_db = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'manufacturing.db')
                g.db = sqlite3.connect(manufacturing_db, timeout=30)
                g.db.row_factory = sqlite3.Row
                
                # Enable WAL mode
                cursor = g.db.cursor()
                cursor.execute('PRAGMA journal_mode=WAL')
                cursor.execute('PRAGMA synchronous=NORMAL')
                cursor.execute('PRAGMA busy_timeout=30000')
                g.db.commit()
                break
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e) and attempt < max_retries - 1:
                    print(f"⚠️ Database locked, retrying connection... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(1)
                else:
                    raise e
    return g.db

# Database teardown - close connection after each request
@app.teardown_appcontext
def close_connection(exception):
    """Close database connection"""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Security Hook - Verify Token
@app.before_request
def verify_token():
    # Allow CORS preflight requests
    if request.method == 'OPTIONS':
        return
        
    # Public endpoints
    if not request.path.startswith('/api/') or request.path == '/api/login' or request.path == '/api/health':
        return
        
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized - Missing or invalid token'}), 401
        
    token = auth_header.split(' ')[1]
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, auth_token FROM users WHERE auth_token LIKE ?", (f"%{token}%",))
        user = cursor.fetchone()
        
        valid = False
        if user:
            tokens = [t.strip() for t in (user['auth_token'] or '').split(',') if t.strip()]
            if token in tokens:
                valid = True
                
        if not valid:
            return jsonify({'error': 'Unauthorized - Invalid token'}), 401
            
    except Exception as e:
        print(f"❌ Auth error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Register existing blueprints
app.register_blueprint(customer_bp)
app.register_blueprint(vendor_bp)
app.register_blueprint(bank_bp)
app.register_blueprint(item_bp)
app.register_blueprint(sales_invoice_bp)
app.register_blueprint(purchase_invoice_bp)
app.register_blueprint(stock_bp)
app.register_blueprint(customer_ledger_bp)
app.register_blueprint(vendor_ledger_bp)
app.register_blueprint(customer_payments_bp)
app.register_blueprint(vendor_payments_bp)
app.register_blueprint(delivery_challan_bp)
app.register_blueprint(company_bp)
app.register_blueprint(production_bp)
app.register_blueprint(cost_center_bp)

# Register PAYROLL blueprints
app.register_blueprint(employee_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(advance_bp)
app.register_blueprint(accounting_bp)
app.register_blueprint(tax_bp)
app.register_blueprint(tax_records_bp, url_prefix='/api')
app.register_blueprint(tax_advisor_bp, url_prefix='/api')
app.register_blueprint(payout_bp)
app.register_blueprint(payslip_bp)

# Register DAILY REPORT blueprint
app.register_blueprint(daily_report_bp)

# Register BACKUP blueprint
app.register_blueprint(backup_bp)
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

# Register FINANCIAL YEAR blueprint
app.register_blueprint(financial_year_bp, url_prefix='/api/financial-years')

# Register STANDALONE LOT blueprint
app.register_blueprint(standalone_lot_bp, url_prefix='/api/standalone-lots')

# Register STOCK ADJUSTMENT blueprint
app.register_blueprint(stock_adj_bp, url_prefix='/api/stock-adjustments')

# Register UPLOADS blueprint
app.register_blueprint(upload_bp, url_prefix='/api/upload')
app.register_blueprint(tally_parser_bp, url_prefix='/api/upload')

# Register AUTH blueprint
app.register_blueprint(auth_bp)

# Register BANK STATEMENT blueprint
app.register_blueprint(bank_statement_bp, url_prefix='/api/utilities/bank-statement')

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    backend_uploads = os.path.join(os.path.dirname(__file__), 'uploads')
    if os.path.exists(os.path.join(backend_uploads, filename)):
        return send_from_directory(backend_uploads, filename)
    return send_from_directory('../uploads', filename)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'online',
        'message': 'FOUR PLASTIC API',
        'version': '1.0.0'
    })

# Add routes listing endpoint for debugging
@app.route('/api/routes', methods=['GET'])
def list_routes():
    """List all registered routes"""
    routes = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':
            methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
            routes.append({
                'endpoint': rule.endpoint,
                'methods': methods,
                'url': str(rule)
            })
    return jsonify(sorted(routes, key=lambda x: x['url']))

# Serve frontend in production
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Get the path to manufacturing database
    manufacturing_db = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'manufacturing.db')
    
    print("\n" + "="*70)
    print("🚀 FOUR PLASTIC - Backend Server")
    print("="*70)
    print(f"📁 Database path: {manufacturing_db}")
    print(f"📍 Server: http://localhost:5001")
    print("\n📌 API ROUTES (all prefixed with /api):")
    print("   ├─ /api/customers")
    print("   ├─ /api/vendors")
    print("   ├─ /api/banks")
    print("   ├─ /api/items")
    print("   ├─ /api/sales-invoices")
    print("   ├─ /api/purchase-invoices")
    print("   ├─ /api/stock")
    print("   ├─ /api/customer-ledger")
    print("   ├─ /api/vendor-ledger")
    print("   ├─ /api/customer-payments")
    print("   ├─ /api/vendor-payments")
    print("   ├─ /api/delivery-challans")
    print("   ├─ /api/company")
    print("   ├─ /api/production")
    print("   ├─ /api/employees")
    print("   ├─ /api/attendance")
    print("   ├─ /api/advances")
    print("   ├─ /api/payouts")
    print("   ├─ /api/payslips")
    print("   ├─ /api/daily-report")
    print("   ├─ /api/accounting/*")
    print("   ├─ /api/backup/*")
    print("   ├─ /api/standalone-lots")
    print("   └─ /api/stock-adjustments")
    print("\n📌 DEBUG ROUTES:")
    print("   └─ /api/routes - List all registered endpoints")
    print("\n" + "="*70)
    print("✅ Health check: http://localhost:5001/api/health")
    print("🔍 Routes list: http://localhost:5001/api/routes")
    print("⚠️  Frontend runs on http://localhost:3000")
    print("="*70 + "\n")
    
    app.run(debug=True, port=5001, host='::')