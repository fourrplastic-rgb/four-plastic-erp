"""
Sales Invoice Routes - API endpoints for sales invoices
"""
from flask import Blueprint, request, jsonify
from models.sales_invoice_model import SalesInvoiceModel
from config.database import get_db
import traceback
import json

sales_invoice_bp = Blueprint('sales_invoice', __name__, url_prefix='/api/sales-invoices')

@sales_invoice_bp.route('', methods=['GET'])
def get_invoices():
    """Get all sales invoices"""
    try:
        invoices = SalesInvoiceModel.get_all()
        return jsonify(invoices)
    except Exception as e:
        print(f"❌ Error fetching invoices: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@sales_invoice_bp.route('/<int:invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    """Get invoice by ID"""
    try:
        invoice = SalesInvoiceModel.get_by_id(invoice_id)
        if invoice:
            return jsonify(invoice)
        return jsonify({'error': 'Invoice not found'}), 404
    except Exception as e:
        print(f"❌ Error fetching invoice {invoice_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@sales_invoice_bp.route('', methods=['POST'])
def create_invoice():
    """Create new sales invoice"""
    try:
        data = request.json
        print("\n" + "="*80)
        print("📥 RECEIVED INVOICE DATA:")
        print("="*80)
        print(json.dumps(data, indent=2))
        print("="*80)
        
        # Validate required fields
        if not data.get('customer_id'):
            print("❌ Validation failed: Customer ID is required")
            return jsonify({'error': 'Customer is required'}), 400
            
        if not data.get('items') or len(data.get('items')) == 0:
            print("❌ Validation failed: No items")
            return jsonify({'error': 'At least one item is required'}), 400
        
        # Log data types for debugging
        print("\n🔍 DATA TYPE CHECK:")
        print(f"customer_id: {type(data.get('customer_id'))} - {data.get('customer_id')}")
        print(f"invoice_date: {type(data.get('invoice_date'))} - {data.get('invoice_date')}")
        print(f"subtotal: {type(data.get('subtotal'))} - {data.get('subtotal')}")
        print(f"grand_total: {type(data.get('grand_total'))} - {data.get('grand_total')}")
        print(f"items count: {len(data.get('items'))}")
        
        if len(data.get('items')) > 0:
            print(f"first item: {json.dumps(data.get('items')[0], indent=2)}")
        
        # Validate customer_id is a number
        try:
            customer_id = int(data.get('customer_id'))
            data['customer_id'] = customer_id
        except (TypeError, ValueError):
            print(f"❌ Invalid customer_id: {data.get('customer_id')}")
            return jsonify({'error': 'Invalid customer ID'}), 400
        
        print(f"\n✅ Creating/updating invoice for customer: {customer_id}")
        print(f"✅ Number of items: {len(data.get('items'))}")
        
        # Check if invoice with this number already exists to update it in-place (handle re-imports)
        existing_invoice = None
        if data.get('invoice_no'):
            existing_invoice = SalesInvoiceModel.get_by_invoice_no(str(data.get('invoice_no')).strip())
            
        if existing_invoice:
            print(f"🔄 Invoice {data.get('invoice_no')} already exists (ID: {existing_invoice['id']}). Overwriting/updating in-place...")
            result = SalesInvoiceModel.update(existing_invoice['id'], data)
            print(f"\n✅ Invoice updated successfully: {json.dumps(result, indent=2)}")
            return jsonify(result), 200
        else:
            result = SalesInvoiceModel.create(data)
            print(f"\n✅ Invoice created successfully: {json.dumps(result, indent=2)}")
            return jsonify(result), 201
        
    except Exception as e:
        print("\n❌ ERROR CREATING INVOICE:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@sales_invoice_bp.route('/<int:invoice_id>', methods=['DELETE'])
def delete_invoice(invoice_id):
    """Delete invoice"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM sales_invoice WHERE id = ?', (invoice_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Invoice deleted successfully'})
    except Exception as e:
        print(f"❌ Error deleting invoice {invoice_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@sales_invoice_bp.route('/<int:invoice_id>', methods=['PUT'])
def update_invoice(invoice_id):
    """Update existing invoice"""
    try:
        data = request.json
        print("="*60)
        print("📥 UPDATING INVOICE:", invoice_id)
        print("="*60)
        print(json.dumps(data, indent=2))
        print("="*60)
        
        # Validate required fields
        if not data.get('customer_id'):
            return jsonify({'error': 'Customer is required'}), 400
            
        if not data.get('items') or len(data.get('items')) == 0:
            return jsonify({'error': 'At least one item is required'}), 400
        
        # Validate customer_id is a number
        try:
            customer_id = int(data.get('customer_id'))
            data['customer_id'] = customer_id
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid customer ID'}), 400
        
        print(f"✅ Updating invoice for customer: {customer_id}")
        print(f"✅ Number of items: {len(data.get('items'))}")
        
        result = SalesInvoiceModel.update(invoice_id, data)
        print(f"✅ Invoice updated successfully: {result}")
        return jsonify(result), 200
        
    except Exception as e:
        print("❌ ERROR UPDATING INVOICE:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@sales_invoice_bp.route('/<int:invoice_id>/attachment', methods=['PUT'])
def update_invoice_attachment(invoice_id):
    """Update attachment path of an invoice"""
    try:
        data = request.json
        attachment_path = data.get('attachment_path')
        result = SalesInvoiceModel.update_attachment(invoice_id, attachment_path)
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Error updating attachment for invoice {invoice_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500