from flask import Blueprint, request, jsonify
from database_config import get_db
import traceback

cost_center_bp = Blueprint('cost_center', __name__, url_prefix='/api')

@cost_center_bp.route('/cost-centers', methods=['GET'])
def get_cost_centers():
    try:
        db = get_db()
        centers = db.execute('''
            SELECT * FROM cost_centers WHERE is_active = 1 ORDER BY name ASC
        ''').fetchall()
        
        return jsonify([dict(c) for c in centers])
    except Exception as e:
        print(f"Error fetching cost centers: {e}")
        return jsonify({'error': str(e)}), 500

@cost_center_bp.route('/cost-centers/<int:id>', methods=['GET'])
def get_cost_center(id):
    try:
        db = get_db()
        center = db.execute('SELECT * FROM cost_centers WHERE id = ?', (id,)).fetchone()
        if not center:
            return jsonify({'error': 'Cost center not found'}), 404
        return jsonify(dict(center))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cost_center_bp.route('/cost-centers', methods=['POST'])
def create_cost_center():
    try:
        data = request.json
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
            
        db = get_db()
        cursor = db.execute('''
            INSERT INTO cost_centers (name, description, hourly_rate, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        ''', (
            data['name'],
            data.get('description', ''),
            float(data.get('hourly_rate', 0)),
            data.get('is_active', 1)
        ))
        db.commit()
        return jsonify({'id': cursor.lastrowid, 'message': 'Cost center created successfully'}), 201
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': str(e)}), 500

@cost_center_bp.route('/cost-centers/<int:id>', methods=['PUT'])
def update_cost_center(id):
    try:
        data = request.json
        db = get_db()
        
        center = db.execute('SELECT * FROM cost_centers WHERE id = ?', (id,)).fetchone()
        if not center:
            return jsonify({'error': 'Cost center not found'}), 404
            
        db.execute('''
            UPDATE cost_centers 
            SET name = ?, description = ?, hourly_rate = ?, is_active = ?, updated_at = datetime('now')
            WHERE id = ?
        ''', (
            data.get('name', center['name']),
            data.get('description', center['description']),
            float(data.get('hourly_rate', center['hourly_rate'])),
            data.get('is_active', center['is_active']),
            id
        ))
        db.commit()
        return jsonify({'message': 'Cost center updated successfully'})
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': str(e)}), 500

@cost_center_bp.route('/cost-centers/<int:id>', methods=['DELETE'])
def delete_cost_center(id):
    try:
        db = get_db()
        # Soft delete
        db.execute('UPDATE cost_centers SET is_active = 0, updated_at = datetime("now") WHERE id = ?', (id,))
        db.commit()
        return jsonify({'message': 'Cost center deleted successfully'})
    except Exception as e:
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': str(e)}), 500
