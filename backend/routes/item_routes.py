"""
Unified Item Routes - API endpoints for both raw materials and finished goods
"""
from flask import Blueprint, request, jsonify
from models.item_model import ItemModel

item_bp = Blueprint('item', __name__, url_prefix='/api/items')

@item_bp.route('', methods=['GET'])
def get_items():
    """Get all items, optionally filtered by type"""
    item_type = request.args.get('type')
    items = ItemModel.get_all(item_type)
    return jsonify(items)

@item_bp.route('/<string:item_type>/<int:item_id>', methods=['GET'])
def get_item(item_type, item_id):
    """Get single item by ID and type"""
    item = ItemModel.get_by_id(item_id, item_type)
    if item:
        return jsonify(item)
    return jsonify({'error': 'Item not found'}), 404

@item_bp.route('/code/<string:code>', methods=['GET'])
def get_item_by_code(code):
    """Get item by code"""
    item = ItemModel.get_by_code(code)
    if item:
        return jsonify(item)
    return jsonify({'error': 'Item not found'}), 404

@item_bp.route('', methods=['POST'])
def create_item():
    """Create new item (raw material or finished good)"""
    try:
        data = request.json
        print("📝 Creating item with data:", data)
        
        result = ItemModel.create(data)
        return jsonify(result), 201
        
    except Exception as e:
        print("❌ Error creating item:", str(e))
        return jsonify({'error': str(e)}), 500

@item_bp.route('/<string:item_type>/<int:item_id>', methods=['PUT'])
def update_item(item_type, item_id):
    """Update item"""
    try:
        data = request.json
        result = ItemModel.update(item_id, item_type, data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@item_bp.route('/<string:item_type>/<int:item_id>', methods=['DELETE'])
def delete_item(item_type, item_id):
    """Delete item"""
    try:
        result = ItemModel.delete(item_id, item_type)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@item_bp.route('/search', methods=['GET'])
def search_items():
    """Search items"""
    query = request.args.get('q', '')
    item_type = request.args.get('type')
    items = ItemModel.search(query, item_type)
    return jsonify(items)