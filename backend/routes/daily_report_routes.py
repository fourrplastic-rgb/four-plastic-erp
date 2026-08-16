from flask import Blueprint, request, jsonify
import sqlite3
import os

daily_report_bp = Blueprint('daily_report', __name__)

# Correct database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'database', 'manufacturing.db')

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@daily_report_bp.route('/api/daily-report', methods=['GET'])
def get_daily_report():
    try:
        date = request.args.get('date')
        
        if not date:
            return jsonify({'error': 'Date is required'}), 400
        
        print(f"📊 Fetching daily report for date: {date}")
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Fetch production entries - using finished_good_id and quantity_produced
        cursor.execute("""
            SELECT 
                pe.*,
                fg.name as item_name,
                fg.unit
            FROM production_entries pe
            LEFT JOIN finished_goods fg ON pe.finished_good_id = fg.id
            WHERE DATE(pe.production_date) = ?
        """, (date,))
        production = [dict(row) for row in cursor.fetchall()]
        
        # Fetch purchase invoices
        cursor.execute("""
            SELECT 
                pi.*,
                v.name as vendor_name,
                v.code as vendor_code
            FROM purchase_invoice pi
            LEFT JOIN vendors v ON pi.vendor_id = v.id
            WHERE DATE(pi.invoice_date) = ?
            ORDER BY pi.created_at DESC
        """, (date,))
        purchase_invoices = [dict(row) for row in cursor.fetchall()]
        
        # Fetch items for each purchase invoice
        for invoice in purchase_invoices:
            cursor.execute("""
                SELECT 
                    pii.*,
                    i.name as item_name,
                    i.unit
                FROM purchase_invoice_items pii
                LEFT JOIN items i ON pii.item_id = i.id
                WHERE pii.invoice_id = ?
            """, (invoice['id'],))
            invoice['items'] = [dict(row) for row in cursor.fetchall()]
        
        # Fetch delivery challans
        cursor.execute("""
            SELECT 
                dc.*,
                c.name as customer_name,
                c.code as customer_code
            FROM delivery_challan dc
            LEFT JOIN customers c ON dc.customer_id = c.id
            WHERE DATE(dc.challan_date) = ?
            ORDER BY dc.created_at DESC
        """, (date,))
        delivery_challans = [dict(row) for row in cursor.fetchall()]
        
        # Fetch items for each delivery challan
        for challan in delivery_challans:
            cursor.execute("""
                SELECT 
                    dci.*,
                    i.name as item_name,
                    i.unit
                FROM delivery_challan_items dci
                LEFT JOIN items i ON dci.item_id = i.id
                WHERE dci.challan_id = ?
            """, (challan['id'],))
            challan['items'] = [dict(row) for row in cursor.fetchall()]
        
        # Fetch customer payments (receipts - money coming IN)
        cursor.execute("""
            SELECT 
                cp.*,
                c.name as party_name,
                'customer' as party_type,
                cp.payment_mode,
                'receipt' as transaction_type,
                cp.amount as amount,
                cp.receipt_no as reference_no
            FROM customer_payments cp
            LEFT JOIN customers c ON cp.customer_id = c.id
            WHERE DATE(cp.payment_date) = ?
            ORDER BY cp.created_at DESC
        """, (date,))
        customer_receipts = [dict(row) for row in cursor.fetchall()]
        
        # Fetch vendor payments (payments - money going OUT)
        cursor.execute("""
            SELECT 
                vp.*,
                v.name as party_name,
                'vendor' as party_type,
                vp.payment_mode,
                'payment' as transaction_type,
                vp.amount as amount,
                vp.payment_no as reference_no
            FROM vendor_payments vp
            LEFT JOIN vendors v ON vp.vendor_id = v.id
            WHERE DATE(vp.payment_date) = ?
            ORDER BY vp.created_at DESC
        """, (date,))
        vendor_payments = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        # Calculate summaries
        total_production_qty = sum(float(p.get('quantity_produced', 0) or 0) for p in production)
        total_production_value = sum((float(p.get('quantity_produced', 0) or 0) * float(p.get('rate', 0) or 0)) for p in production)
        total_purchase_amount = sum(float(inv.get('grand_total', 0) or inv.get('total', 0) or 0) for inv in purchase_invoices)
        
        total_delivery_qty = 0
        for challan in delivery_challans:
            challan_total = sum(float(item.get('qty', 0) or float(item.get('quantity', 0) or 0)) for item in challan.get('items', []))
            total_delivery_qty += challan_total
        
        total_receipts = sum(float(p.get('amount', 0) or 0) for p in customer_receipts)
        total_payments = sum(float(p.get('amount', 0) or 0) for p in vendor_payments)
        
        print(f"✅ Found: Production: {len(production)}, Purchases: {len(purchase_invoices)}, Deliveries: {len(delivery_challans)}")
        print(f"💰 Receipts: {len(customer_receipts)} (₹{total_receipts}), Payments: {len(vendor_payments)} (₹{total_payments})")
        
        return jsonify({
            'date': date,
            'production': production,
            'purchaseInvoices': purchase_invoices,
            'deliveryChallans': delivery_challans,
            'customerReceipts': customer_receipts,
            'vendorPayments': vendor_payments,
            'summary': {
                'totalProductionQty': total_production_qty,
                'totalProductionValue': total_production_value,
                'totalPurchaseAmount': total_purchase_amount,
                'totalDeliveryQty': total_delivery_qty,
                'totalReceipts': total_receipts,
                'totalPayments': total_payments
            }
        })
        
    except Exception as e:
        print(f"❌ Error fetching daily report: {e}")
        return jsonify({'error': str(e)}), 500