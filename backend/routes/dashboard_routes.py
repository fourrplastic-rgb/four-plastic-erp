from flask import Blueprint, jsonify, request
from database_config import get_db
from datetime import datetime, timedelta
import calendar

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/charts', methods=['GET'])
def get_dashboard_charts():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Monthly Sales vs Purchases for the last 6 months
    today = datetime.now()
    six_months_ago = today.replace(day=1) - timedelta(days=5*30)
    # We will generate labels from python and group by month
    
    # Calculate months
    months = []
    for i in range(5, -1, -1):
        d = today - timedelta(days=i*30)
        months.append(d.strftime('%Y-%m')) # e.g. 2026-05
    
    # Query sales invoices
    cursor.execute('''
        SELECT strftime('%Y-%m', invoice_date) as month, SUM(grand_total) as total_sales
        FROM sales_invoice
        WHERE invoice_date >= ?
        GROUP BY month
    ''', (six_months_ago.strftime('%Y-%m-%d'),))
    sales_data = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Query purchase invoices
    cursor.execute('''
        SELECT strftime('%Y-%m', invoice_date) as month, SUM(grand_total) as total_purchases
        FROM purchase_invoice
        WHERE invoice_date >= ?
        GROUP BY month
    ''', (six_months_ago.strftime('%Y-%m-%d'),))
    purchases_data = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Format monthly data
    monthly_data = []
    for m in months:
        y, mn = m.split('-')
        month_name = calendar.month_abbr[int(mn)]
        monthly_data.append({
            'name': f"{month_name} {y}",
            'sales': sales_data.get(m, 0),
            'purchases': purchases_data.get(m, 0)
        })
        
    # 2. Top 5 Customers by Sales
    cursor.execute('''
        SELECT c.name, SUM(s.grand_total) as total
        FROM sales_invoice s
        JOIN customers c ON s.customer_id = c.id
        GROUP BY c.id
        ORDER BY total DESC
        LIMIT 5
    ''')
    top_customers = [{'name': row[0], 'value': row[1]} for row in cursor.fetchall()]
    
    return jsonify({
        'monthly_revenue': monthly_data,
        'top_customers': top_customers
    })
