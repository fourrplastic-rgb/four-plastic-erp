"""
Tax Routes - API endpoints for GST processing (GSTR1, GSTR2, GSTR3B)
"""
from flask import Blueprint, request, jsonify
from config.database import get_db, dict_from_row
import traceback

tax_bp = Blueprint('tax', __name__, url_prefix='/api/taxes')

@tax_bp.route('/gstr1', methods=['GET'])
def get_gstr1():
    """Generates GSTR-1 Sales Register (B2B vs B2C) for a given month"""
    try:
        month = request.args.get('month') # Format YYYY-MM
        if not month:
            return jsonify({'error': 'Month parameter (YYYY-MM) is required'}), 400
            
        conn = get_db()
        cursor = conn.cursor()
        
        # B2B Sales (Registered Customers with GST No)
        cursor.execute('''
            SELECT 
                si.invoice_no, si.invoice_date, si.subtotal, si.grand_total,
                si.cgst_total, si.sgst_total, si.igst_total,
                c.name as customer_name, c.gst as customer_gst, c.state as pos_state
            FROM sales_invoice si
            JOIN customers c ON si.customer_id = c.id
            WHERE strftime('%Y-%m', si.invoice_date) = ?
            AND c.gst IS NOT NULL AND c.gst != ''
        ''', (month,))
        b2b_invoices = [dict_from_row(row) for row in cursor.fetchall()]
        
        # B2C Sales (Unregistered Customers)
        cursor.execute('''
            SELECT 
                si.invoice_no, si.invoice_date, si.subtotal, si.grand_total,
                si.cgst_total, si.sgst_total, si.igst_total,
                c.name as customer_name, c.state as pos_state
            FROM sales_invoice si
            JOIN customers c ON si.customer_id = c.id
            WHERE strftime('%Y-%m', si.invoice_date) = ?
            AND (c.gst IS NULL OR c.gst = '')
        ''', (month,))
        b2c_invoices = [dict_from_row(row) for row in cursor.fetchall()]
        
        # HSN Summary
        cursor.execute('''
            SELECT 
                COALESCE(fg.hsn_code, rm.hsn_code) as hsn,
                SUM(sii.quantity) as total_qty,
                SUM(sii.taxable_value) as total_value,
                SUM(sii.cgst_amount) as cgst,
                SUM(sii.sgst_amount) as sgst,
                SUM(sii.igst_amount) as igst
            FROM sales_invoice_items sii
            JOIN sales_invoice si ON sii.invoice_id = si.id
            LEFT JOIN finished_goods fg ON sii.item_type = 'finished_good' AND sii.item_id = fg.id
            LEFT JOIN raw_materials rm ON sii.item_type = 'raw_material' AND sii.item_id = rm.id
            WHERE strftime('%Y-%m', si.invoice_date) = ? AND COALESCE(fg.hsn_code, rm.hsn_code) IS NOT NULL
            GROUP BY COALESCE(fg.hsn_code, rm.hsn_code)
        ''', (month,))
        hsn_summary = [dict_from_row(row) for row in cursor.fetchall()]
        
        conn.close()
        return jsonify({
            'month': month,
            'b2b': b2b_invoices,
            'b2c': b2c_invoices,
            'hsn_summary': hsn_summary,
            'b2b_total': sum([x['grand_total'] for x in b2b_invoices]),
            'b2c_total': sum([x['grand_total'] for x in b2c_invoices]),
        })
        
    except Exception as e:
        print(f"❌ Error generating GSTR-1: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@tax_bp.route('/gstr2', methods=['GET'])
def get_gstr2():
    """Generates GSTR-2 Purchase Register for a given month"""
    try:
        month = request.args.get('month')
        if not month:
            return jsonify({'error': 'Month parameter (YYYY-MM) is required'}), 400
            
        conn = get_db()
        cursor = conn.cursor()
        
        # B2B Purchases
        cursor.execute('''
            SELECT 
                pi.invoice_no, pi.invoice_date, pi.subtotal as taxable_amount, pi.grand_total,
                pi.cgst_total, pi.sgst_total, pi.igst_total,
                v.name as vendor_name, v.gst as vendor_gst
            FROM purchase_invoice pi
            JOIN vendors v ON pi.vendor_id = v.id
            WHERE strftime('%Y-%m', pi.invoice_date) = ?
        ''', (month,))
        purchases = [dict_from_row(row) for row in cursor.fetchall()]
        
        conn.close()
        return jsonify({
            'month': month,
            'purchases': purchases,
            'total_taxable': sum([x['taxable_amount'] for x in purchases]),
            'total_itc': sum([x['cgst_total'] + x['sgst_total'] + x['igst_total'] for x in purchases])
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
