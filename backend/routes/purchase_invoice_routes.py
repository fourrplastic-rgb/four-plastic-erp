"""
Purchase Invoice Routes - API endpoints for purchase invoices
"""
from flask import Blueprint, request, jsonify
from models.purchase_invoice_model import PurchaseInvoiceModel
import traceback

purchase_invoice_bp = Blueprint('purchase_invoice', __name__, url_prefix='/api/purchase-invoices')

@purchase_invoice_bp.route('', methods=['GET'])
def get_invoices():
    """Get all purchase invoices"""
    try:
        invoices = PurchaseInvoiceModel.get_all()
        return jsonify(invoices)
    except Exception as e:
        print(f"❌ Error fetching invoices: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@purchase_invoice_bp.route('/lots', methods=['GET'])
def get_lots():
    """Get all purchase items as lots for shortage monitoring"""
    try:
        lots = PurchaseInvoiceModel.get_lots()
        return jsonify(lots)
    except Exception as e:
        print(f"❌ Error fetching lots: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@purchase_invoice_bp.route('/lots/<int:lot_id>/payments', methods=['GET'])
def get_lot_payments(lot_id):
    try:
        payments = PurchaseInvoiceModel.get_lot_payments(lot_id)
        return jsonify(payments), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchase_invoice_bp.route('/lots/<int:lot_id>/payments', methods=['POST'])
def add_lot_payment(lot_id):
    try:
        data = request.json
        data['lot_id'] = lot_id
        if 'payment_date' not in data or 'amount' not in data:
            return jsonify({'error': 'Payment date and amount are required'})
        
        PurchaseInvoiceModel.add_lot_payment(data)
        return jsonify({'message': 'Lot payment added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchase_invoice_bp.route('/lots/payments/<int:payment_id>', methods=['DELETE'])
def delete_lot_payment(payment_id):
    try:
        PurchaseInvoiceModel.delete_lot_payment(payment_id)
        return jsonify({'message': 'Lot payment deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@purchase_invoice_bp.route('/<int:invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    """Get invoice by ID"""
    try:
        invoice = PurchaseInvoiceModel.get_by_id(invoice_id)
        if invoice:
            return jsonify(invoice)
        return jsonify({'error': 'Invoice not found'}), 404
    except Exception as e:
        print(f"❌ Error fetching invoice {invoice_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@purchase_invoice_bp.route('', methods=['POST', 'OPTIONS'])
def create_invoice():
    """Create new purchase invoice"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
        
    try:
        data = request.json
        print("="*60)
        print("📥 RECEIVED PURCHASE INVOICE DATA:")
        print("="*60)
        print(data)
        print("="*60)
        
        # Validate required fields
        if not data.get('vendor_id'):
            return jsonify({'error': 'Vendor is required'}), 400
            
        if not data.get('items') or len(data.get('items')) == 0:
            return jsonify({'error': 'At least one item is required'}), 400
        
        # Validate vendor_id is a number
        try:
            vendor_id = int(data.get('vendor_id'))
            data['vendor_id'] = vendor_id
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid vendor ID'}), 400
        
        print(f"✅ Creating/updating purchase invoice for vendor: {vendor_id}")
        print(f"✅ Number of items: {len(data.get('items'))}")
        
        # Check if purchase invoice with this number and vendor already exists to update it in-place
        existing_invoice = None
        if data.get('invoice_no'):
            existing_invoice = PurchaseInvoiceModel.get_by_invoice_no(str(data.get('invoice_no')).strip(), vendor_id)
            
        if existing_invoice:
            print(f"🔄 Purchase invoice {data.get('invoice_no')} already exists (ID: {existing_invoice['id']}). Overwriting/updating in-place...")
            result = PurchaseInvoiceModel.update(existing_invoice['id'], data)
            print(f"✅ Purchase invoice updated successfully: {result}")
            return jsonify(result), 200
        else:
            result = PurchaseInvoiceModel.create(data)
            print(f"✅ Invoice created successfully: {result}")
            return jsonify(result), 201
        
    except Exception as e:
        print("❌ ERROR CREATING PURCHASE INVOICE:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@purchase_invoice_bp.route('/<int:invoice_id>', methods=['PUT'])
def update_invoice(invoice_id):
    """Update existing purchase invoice"""
    try:
        data = request.json
        print("="*60)
        print("📥 UPDATING PURCHASE INVOICE:", invoice_id)
        print("="*60)
        print(data)
        print("="*60)
        
        # Validate required fields
        if not data.get('vendor_id'):
            return jsonify({'error': 'Vendor is required'}), 400
            
        if not data.get('items') or len(data.get('items')) == 0:
            return jsonify({'error': 'At least one item is required'}), 400
        
        # Let the model handle all database operations (including stock updates)
        result = PurchaseInvoiceModel.update(invoice_id, data)
        
        print(f"✅ Invoice updated successfully: {result}")
        return jsonify(result), 200
        
    except Exception as e:
        print("❌ ERROR UPDATING PURCHASE INVOICE:")
        print(f"Error message: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@purchase_invoice_bp.route('/<int:invoice_id>', methods=['DELETE'])
def delete_invoice(invoice_id):
    """Delete invoice"""
    try:
        result = PurchaseInvoiceModel.delete(invoice_id)
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Error deleting invoice {invoice_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@purchase_invoice_bp.route('/<int:invoice_id>/attachment', methods=['PUT'])
def update_invoice_attachment(invoice_id):
    """Update attachment path of a purchase invoice"""
    try:
        data = request.json
        attachment_path = data.get('attachment_path')
        result = PurchaseInvoiceModel.update_attachment(invoice_id, attachment_path)
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Error updating attachment for purchase invoice {invoice_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500