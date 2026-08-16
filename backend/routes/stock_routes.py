"""
Stock Report Routes - API endpoints for inventory reports
"""
from flask import Blueprint, request, jsonify
from config.database import get_db, dict_from_row
import traceback

stock_bp = Blueprint('stock', __name__, url_prefix='/api/stock')

@stock_bp.route('/raw-materials', methods=['GET'])
def get_raw_materials_stock():
    """Get all raw materials with stock levels"""
    try:
        print("\n=== FETCHING RAW MATERIALS STOCK ===")
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                id, 
                code,
                name, 
                category, 
                unit, 
                hsn_code,
                purchase_rate, 
                opening_stock, 
                current_stock,
                min_stock, 
                max_stock, 
                location,
                is_active,
                CASE 
                    WHEN current_stock <= min_stock AND min_stock > 0 THEN 'Low Stock'
                    WHEN min_stock > 0 AND current_stock <= (min_stock * 1.5) THEN 'Reorder Level'
                    ELSE 'Normal'
                END as stock_status,
                CASE
                    WHEN current_stock <= 0 THEN 'Critical'
                    WHEN min_stock > 0 AND current_stock <= min_stock THEN 'Low Stock'
                    WHEN min_stock > 0 AND current_stock <= (min_stock * 1.5) THEN 'Warning'
                    ELSE 'Good'
                END as alert_level,
                (current_stock * purchase_rate) as stock_value
            FROM raw_materials 
            WHERE is_active = 1
            ORDER BY 
                CASE 
                    WHEN min_stock > 0 AND current_stock <= min_stock THEN 1
                    WHEN min_stock > 0 AND current_stock <= (min_stock * 1.5) THEN 2
                    ELSE 3
                END,
                name
        ''')
        
        materials = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        
        print(f"✅ Found {len(materials)} raw materials")
        return jsonify(materials)
        
    except Exception as e:
        print(f"❌ Error fetching raw materials stock: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@stock_bp.route('/finished-goods', methods=['GET'])
def get_finished_goods_stock():
    """Get all finished goods with stock levels"""
    try:
        print("\n=== FETCHING FINISHED GOODS STOCK ===")
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                id,
                code,
                name, 
                category, 
                unit, 
                hsn_code,
                sales_rate, 
                mrp, 
                opening_stock, 
                current_stock,
                min_stock, 
                max_stock, 
                location,
                is_active,
                CASE 
                    WHEN current_stock <= min_stock AND min_stock > 0 THEN 'Low Stock'
                    WHEN min_stock > 0 AND current_stock <= (min_stock * 1.5) THEN 'Reorder Level'
                    ELSE 'Normal'
                END as stock_status,
                CASE
                    WHEN current_stock <= 0 THEN 'Critical'
                    WHEN min_stock > 0 AND current_stock <= min_stock THEN 'Low Stock'
                    WHEN min_stock > 0 AND current_stock <= (min_stock * 1.5) THEN 'Warning'
                    ELSE 'Good'
                END as alert_level,
                (current_stock * sales_rate) as stock_value
            FROM finished_goods 
            WHERE is_active = 1
            ORDER BY 
                CASE 
                    WHEN min_stock > 0 AND current_stock <= min_stock THEN 1
                    WHEN min_stock > 0 AND current_stock <= (min_stock * 1.5) THEN 2
                    ELSE 3
                END,
                name
        ''')
        
        goods = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        
        print(f"✅ Found {len(goods)} finished goods")
        return jsonify(goods)
        
    except Exception as e:
        print(f"❌ Error fetching finished goods stock: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@stock_bp.route('/all', methods=['GET'])
def get_all_stock():
    """Get all stock items with summary"""
    try:
        print("\n=== FETCHING ALL STOCK SUMMARY ===")
        conn = get_db()
        cursor = conn.cursor()
        
        # Get raw materials
        cursor.execute('''
            SELECT 
                id,
                'raw_material' as type,
                code,
                name,
                unit,
                purchase_rate as rate,
                current_stock,
                min_stock,
                location,
                CASE 
                    WHEN min_stock > 0 AND current_stock <= min_stock THEN 'Low Stock'
                    WHEN min_stock > 0 AND current_stock <= (min_stock * 1.5) THEN 'Reorder Level'
                    ELSE 'Normal'
                END as status,
                (current_stock * purchase_rate) as value
            FROM raw_materials 
            WHERE is_active = 1
        ''')
        raw_materials = [dict_from_row(row) for row in cursor.fetchall()]
        
        # Get finished goods
        cursor.execute('''
            SELECT 
                id,
                'finished_good' as type,
                code,
                name,
                unit,
                sales_rate as rate,
                current_stock,
                min_stock,
                location,
                CASE 
                    WHEN min_stock > 0 AND current_stock <= min_stock THEN 'Low Stock'
                    WHEN min_stock > 0 AND current_stock <= (min_stock * 1.5) THEN 'Reorder Level'
                    ELSE 'Normal'
                END as status,
                (current_stock * sales_rate) as value
            FROM finished_goods 
            WHERE is_active = 1
        ''')
        finished_goods = [dict_from_row(row) for row in cursor.fetchall()]
        
        # Combine all items
        all_items = raw_materials + finished_goods
        
        # Calculate summary
        total_items = len(all_items)
        low_stock_items = sum(1 for item in all_items if item['status'] == 'Low Stock')
        total_value = sum(item['value'] or 0 for item in all_items)
        
        summary = {
            'total_items': total_items,
            'low_stock_items': low_stock_items,
            'total_value': total_value,
            'raw_materials': raw_materials,
            'finished_goods': finished_goods
        }
        
        conn.close()
        print(f"✅ Found {len(raw_materials)} raw materials and {len(finished_goods)} finished goods")
        return jsonify(summary)
        
    except Exception as e:
        print(f"❌ Error fetching stock summary: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@stock_bp.route('/low-stock', methods=['GET'])
def get_low_stock():
    """Get all items with low stock"""
    try:
        print("\n=== FETCHING LOW STOCK ITEMS ===")
        conn = get_db()
        cursor = conn.cursor()
        
        # Get low stock raw materials
        cursor.execute('''
            SELECT 
                'raw_material' as type,
                id,
                code,
                name,
                unit,
                purchase_rate as rate,
                current_stock,
                min_stock,
                location,
                (current_stock * purchase_rate) as value
            FROM raw_materials 
            WHERE is_active = 1 
                AND min_stock > 0 
                AND current_stock <= min_stock
            ORDER BY (current_stock * 1.0 / min_stock), name
        ''')
        low_raw = [dict_from_row(row) for row in cursor.fetchall()]
        
        # Get low stock finished goods
        cursor.execute('''
            SELECT 
                'finished_good' as type,
                id,
                code,
                name,
                unit,
                sales_rate as rate,
                current_stock,
                min_stock,
                location,
                (current_stock * sales_rate) as value
            FROM finished_goods 
            WHERE is_active = 1 
                AND min_stock > 0 
                AND current_stock <= min_stock
            ORDER BY (current_stock * 1.0 / min_stock), name
        ''')
        low_finished = [dict_from_row(row) for row in cursor.fetchall()]
        
        conn.close()
        
        print(f"✅ Found {len(low_raw)} low stock raw materials and {len(low_finished)} low stock finished goods")
        
        return jsonify({
            'raw_materials': low_raw,
            'finished_goods': low_finished,
            'total': len(low_raw) + len(low_finished)
        })
        
    except Exception as e:
        print(f"❌ Error fetching low stock: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500