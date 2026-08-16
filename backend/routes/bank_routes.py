"""
Bank Routes - Complete API endpoints for banks
"""
from flask import Blueprint, request, jsonify
from models.bank_model import BankModel

bank_bp = Blueprint('bank', __name__, url_prefix='/api/banks')

@bank_bp.route('', methods=['GET', 'POST'])
def banks():
    """Handle GET (list) and POST (create) for banks"""
    
    # GET - List all banks
    if request.method == 'GET':
        banks = BankModel.get_all()
        return jsonify(banks)
    
    # POST - Create new bank
    if request.method == 'POST':
        try:
            data = request.json
            print("📝 Creating bank with data:", data)
            
            result = BankModel.create(data)
            return jsonify(result), 201
            
        except Exception as e:
            print("❌ Error creating bank:", str(e))
            return jsonify({'error': str(e)}), 500

@bank_bp.route('/<int:bank_id>', methods=['GET', 'PUT', 'DELETE'])
def bank_detail(bank_id):
    """Handle GET, PUT, DELETE for single bank"""
    
    # GET - Get single bank
    if request.method == 'GET':
        bank = BankModel.get_by_id(bank_id)
        if bank:
            return jsonify(bank)
        return jsonify({'error': 'Bank not found'}), 404
    
    # PUT - Update bank
    if request.method == 'PUT':
        try:
            data = request.json
            result = BankModel.update(bank_id, data)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # DELETE - Delete bank
    if request.method == 'DELETE':
        try:
            result = BankModel.delete(bank_id)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@bank_bp.route('/search', methods=['GET'])
def search_banks():
    """Search banks"""
    query = request.args.get('q', '')
    banks = BankModel.search(query)
    return jsonify(banks)

@bank_bp.route('/<int:bank_id>/balance', methods=['GET'])
def get_bank_balance(bank_id):
    """Get calculated current bank balance"""
    try:
        balance = BankModel.get_balance(bank_id)
        if balance is not None:
            return jsonify({'balance': balance})
        return jsonify({'error': 'Bank not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500