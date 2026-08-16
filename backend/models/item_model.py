"""
Unified Item Model - Handles both Raw Materials and Finished Goods
"""
from config.database import get_db, dict_from_row

class ItemModel:
    """Unified item database operations for both raw materials and finished goods"""

    @staticmethod
    def get_all(item_type=None):
        """Get all active items, optionally filtered by type"""
        conn = get_db()
        cursor = conn.cursor()

        if item_type == 'raw_material':
            cursor.execute('''
                SELECT *, 'raw_material' as item_type FROM raw_materials
                WHERE is_active = 1
                ORDER BY name
            ''')
        elif item_type == 'finished_good':
            cursor.execute('''
                SELECT *, 'finished_good' as item_type FROM finished_goods
                WHERE is_active = 1
                ORDER BY name
            ''')
        else:
            # Get both raw materials and finished goods with all fields
            cursor.execute('''
                SELECT 
                    id, 
                    code, 
                    name, 
                    'raw_material' as item_type, 
                    category, 
                    unit, 
                    hsn_code, 
                    gst_rate,
                    purchase_rate, 
                    NULL as sales_rate, 
                    NULL as mrp,
                    opening_stock,
                    current_stock,
                    min_stock, 
                    max_stock, 
                    location,
                    created_at,
                    'RM_' || id as compound_id
                FROM raw_materials WHERE is_active = 1
                
                UNION ALL
                
                SELECT 
                    id, 
                    code, 
                    name, 
                    'finished_good' as item_type,
                    category, 
                    unit, 
                    hsn_code, 
                    gst_rate,
                    NULL as purchase_rate, 
                    sales_rate, 
                    mrp,
                    opening_stock,
                    current_stock,
                    min_stock, 
                    max_stock, 
                    location,
                    created_at,
                    'FG_' || id as compound_id
                FROM finished_goods WHERE is_active = 1
                
                ORDER BY name
            ''')
        
        items = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return items

    @staticmethod
    def get_by_id(item_id, item_type):
        """Get item by ID and type"""
        conn = get_db()
        cursor = conn.cursor()
        
        if item_type == 'raw_material':
            cursor.execute('SELECT * FROM raw_materials WHERE id = ?', (item_id,))
        else:
            cursor.execute('SELECT * FROM finished_goods WHERE id = ?', (item_id,))
        
        item = dict_from_row(cursor.fetchone())
        conn.close()
        return item

    @staticmethod
    def get_by_code(code):
        """Get item by code"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Try raw materials first
        cursor.execute('SELECT * FROM raw_materials WHERE code = ?', (code,))
        item = cursor.fetchone()
        
        if not item:
            cursor.execute('SELECT * FROM finished_goods WHERE code = ?', (code,))
            item = cursor.fetchone()
        
        conn.close()
        return dict_from_row(item) if item else None

    @staticmethod
    def create(data):
        """Create new item"""
        conn = get_db()
        cursor = conn.cursor()
        item_type = data.get('item_type')
        
        if item_type == 'raw_material':
            # Generate code
            cursor.execute("SELECT COUNT(*) as count FROM raw_materials")
            count = cursor.fetchone()[0] + 1
            code = f"RM{count:04d}"
            
            cursor.execute('''
                INSERT INTO raw_materials (
                    code, name, category, unit, hsn_code, gst_rate,
                    purchase_rate, opening_stock, current_stock, min_stock,
                    max_stock, location, is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            ''', (
                code,
                data.get('name'),
                data.get('category', ''),
                data.get('unit', 'KG'),
                data.get('hsn_code', ''),
                data.get('gst_rate', 18),
                data.get('purchase_rate', 0),
                data.get('opening_stock', 0),
                data.get('opening_stock', 0),  # current_stock starts as opening_stock
                data.get('min_stock', 0),
                data.get('max_stock', 0),
                data.get('location', '')
            ))
            
            item_id = cursor.lastrowid
            
        else:  # finished_good
            # Generate code
            cursor.execute("SELECT COUNT(*) as count FROM finished_goods")
            count = cursor.fetchone()[0] + 1
            code = f"FG{count:04d}"
            
            cursor.execute('''
                INSERT INTO finished_goods (
                    code, name, category, unit, hsn_code, gst_rate,
                    sales_rate, mrp, opening_stock, current_stock, min_stock,
                    max_stock, location, is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            ''', (
                code,
                data.get('name'),
                data.get('category', ''),
                data.get('unit', 'PCS'),
                data.get('hsn_code', ''),
                data.get('gst_rate', 18),
                data.get('sales_rate', 0),
                data.get('mrp', 0),
                data.get('opening_stock', 0),
                data.get('opening_stock', 0),  # current_stock starts as opening_stock
                data.get('min_stock', 0),
                data.get('max_stock', 0),
                data.get('location', '')
            ))
            
            item_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return {
            'id': item_id,
            'code': code,
            'item_type': item_type,
            'message': f'{item_type.replace("_", " ").title()} created successfully'
        }

    @staticmethod
    def update(item_id, item_type, data):
        """Update item - only updates opening_stock, preserves current_stock"""
        conn = get_db()
        cursor = conn.cursor()
        
        if item_type == 'raw_material':
            cursor.execute('''
                UPDATE raw_materials SET
                    name = ?,
                    category = ?,
                    unit = ?,
                    hsn_code = ?,
                    gst_rate = ?,
                    purchase_rate = ?,
                    opening_stock = ?,
                    min_stock = ?,
                    max_stock = ?,
                    location = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                data.get('name'),
                data.get('category'),
                data.get('unit'),
                data.get('hsn_code'),
                data.get('gst_rate'),
                data.get('purchase_rate'),
                data.get('opening_stock'),
                data.get('min_stock'),
                data.get('max_stock'),
                data.get('location'),
                item_id
            ))
        else:
            cursor.execute('''
                UPDATE finished_goods SET
                    name = ?,
                    category = ?,
                    unit = ?,
                    hsn_code = ?,
                    gst_rate = ?,
                    sales_rate = ?,
                    mrp = ?,
                    opening_stock = ?,
                    min_stock = ?,
                    max_stock = ?,
                    location = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (
                data.get('name'),
                data.get('category'),
                data.get('unit'),
                data.get('hsn_code'),
                data.get('gst_rate'),
                data.get('sales_rate'),
                data.get('mrp'),
                data.get('opening_stock'),
                data.get('min_stock'),
                data.get('max_stock'),
                data.get('location'),
                item_id
            ))
        
        conn.commit()
        conn.close()
        return {'message': f'{item_type.replace("_", " ").title()} updated successfully'}

    @staticmethod
    def delete(item_id, item_type):
        """Soft delete item"""
        conn = get_db()
        cursor = conn.cursor()
        
        if item_type == 'raw_material':
            cursor.execute('UPDATE raw_materials SET is_active = 0 WHERE id = ?', (item_id,))
        else:
            cursor.execute('UPDATE finished_goods SET is_active = 0 WHERE id = ?', (item_id,))
        
        conn.commit()
        conn.close()
        return {'message': f'{item_type.replace("_", " ").title()} deleted successfully'}

    @staticmethod
    def search(query):
        """Search items by name or code"""
        conn = get_db()
        cursor = conn.cursor()
        search_term = f'%{query}%'
        
        cursor.execute('''
            SELECT 
                id, 
                code, 
                name, 
                'raw_material' as item_type, 
                category, 
                unit, 
                hsn_code, 
                gst_rate,
                purchase_rate, 
                NULL as sales_rate, 
                NULL as mrp,
                opening_stock,
                current_stock,
                min_stock, 
                max_stock, 
                location,
                created_at,
                'RM_' || id as compound_id
            FROM raw_materials 
            WHERE is_active = 1 AND (name LIKE ? OR code LIKE ?)
            
            UNION ALL
            
            SELECT 
                id, 
                code, 
                name, 
                'finished_good' as item_type,
                category, 
                unit, 
                hsn_code, 
                gst_rate,
                NULL as purchase_rate, 
                sales_rate, 
                mrp,
                opening_stock,
                current_stock,
                min_stock, 
                max_stock, 
                location,
                created_at,
                'FG_' || id as compound_id
            FROM finished_goods 
            WHERE is_active = 1 AND (name LIKE ? OR code LIKE ?)
            
            ORDER BY name
            LIMIT 50
        ''', (search_term, search_term, search_term, search_term))
        
        items = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return items