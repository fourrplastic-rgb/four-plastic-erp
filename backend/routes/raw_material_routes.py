"""
Raw Material Routes - API endpoints for raw materials
"""
from flask import Blueprint, request, jsonify
from models.raw_material_model import RawMaterialModel

raw_material_bp = Blueprint('raw_material', __name__, url_prefix='/api/raw-materials')

@raw_material_bp.route('', methods=['GET', 'POST'])
def raw_materials():
    """Handle GET (list) and POST (create) for raw materials"""
    
    # GET - List all raw materials
    if request.method == 'GET':
        materials = RawMaterialModel.get_all()
        return jsonify(materials)
    
    # POST - Create new raw material
    if request.method == 'POST':
        try:
            data = request.json
            print("📝 Creating raw material with data:", data)
            
            result = RawMaterialModel.create(data)
            return jsonify(result), 201
            
        except Exception as e:
            print("❌ Error creating raw material:", str(e))
            return jsonify({'error': str(e)}), 500

@raw_material_bp.route('/<int:material_id>', methods=['GET', 'PUT', 'DELETE'])
def raw_material_detail(material_id):
    """Handle GET, PUT, DELETE for single raw material"""
    
    # GET - Get single raw material
    if request.method == 'GET':
        material = RawMaterialModel.get_by_id(material_id)
        if material:
            return jsonify(material)
        return jsonify({'error': 'Raw material not found'}), 404
    
    # PUT - Update raw material
    if request.method == 'PUT':
        try:
            data = request.json
            result = RawMaterialModel.update(material_id, data)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # DELETE - Delete raw material
    if request.method == 'DELETE':
        try:
            result = RawMaterialModel.delete(material_id)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@raw_material_bp.route('/search', methods=['GET'])
def search_raw_materials():
    """Search raw materials"""
    query = request.args.get('q', '')
    materials = RawMaterialModel.search(query)
    return jsonify(materials)

@raw_material_bp.route('/<int:material_id>/stock', methods=['GET'])
def get_stock(material_id):
    """Get current stock of raw material"""
    material = RawMaterialModel.get_by_id(material_id)
    if material:
        return jsonify({'current_stock': material.get('current_stock', 0)})
    return jsonify({'error': 'Material not found'}), 404