"""
Raw Material Model - Database operations for raw materials
"""
from config.database import get_db, dict_from_row

class RawMaterialModel:
    """Raw material database operations"""
    
    @staticmethod
    def get_all():
        """Get all active raw materials"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM raw_materials 
            WHERE is_active = 1 
            ORDER BY name
        ''')
        materials = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return materials
    
    @staticmethod
    def get_by_id(material_id):
        """Get raw material by ID"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM raw_materials WHERE id = ?', (material_id,))
        material = dict_from_row(cursor.fetchone())
        conn.close()
        return material
    
    @staticmethod
    def get_by_code(code):
        """Get raw material by code"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM raw_materials WHERE code = ? AND is_active = 1', (code,))
        material = dict_from_row(cursor.fetchone())
        conn.close()
        return material
    
    @staticmethod
    def create(data):
        """Create new raw material"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Generate material code
        cursor.execute("SELECT COUNT(*) as count FROM raw_materials")
        count = cursor.fetchone()['count'] + 1
        code = f"RM{count:04d}"
        
        cursor.execute('''
            INSERT INTO raw_materials (
                code, name, category, unit, hsn_code, gst_rate,
                purchase_rate, opening_stock, current_stock, min_stock,
                max_stock, location, is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
        ''', (
            code,
            data.get('name', ''),
            'Raw Material',
            data.get('unit', 'KG'),
            data.get('hsn_code', ''),
            float(data.get('gst_rate', 18)),
            float(data.get('purchase_rate', 0)),
            float(data.get('opening_stock', 0)),
            float(data.get('opening_stock', 0)),  # current_stock = opening_stock
            float(data.get('min_stock', 0)),
            float(data.get('max_stock', 0)),
            data.get('location', '')
        ))
        
        material_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {'id': material_id, 'code': code, 'message': 'Raw material created successfully'}
    
    @staticmethod
    def update(material_id, data):
        """Update raw material"""
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE raw_materials SET
                name = ?,
                unit = ?,
                hsn_code = ?,
                gst_rate = ?,
                purchase_rate = ?,
                min_stock = ?,
                max_stock = ?,
                location = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('name', ''),
            data.get('unit', 'KG'),
            data.get('hsn_code', ''),
            float(data.get('gst_rate', 18)),
            float(data.get('purchase_rate', 0)),
            float(data.get('min_stock', 0)),
            float(data.get('max_stock', 0)),
            data.get('location', ''),
            material_id
        ))
        
        conn.commit()
        conn.close()
        return {'message': 'Raw material updated successfully'}
    
    @staticmethod
    def delete(material_id):
        """Soft delete raw material"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE raw_materials SET is_active = 0 WHERE id = ?', (material_id,))
        conn.commit()
        conn.close()
        return {'message': 'Raw material deleted successfully'}
    
    @staticmethod
    def search(query):
        """Search raw materials by name, code, hsn"""
        conn = get_db()
        cursor = conn.cursor()
        search_term = f"%{query}%"
        cursor.execute('''
            SELECT * FROM raw_materials 
            WHERE is_active = 1 
            AND (name LIKE ? OR code LIKE ? OR hsn_code LIKE ?)
            ORDER BY name
            LIMIT 50
        ''', (search_term, search_term, search_term))
        materials = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return materials
    
    @staticmethod
    def update_stock(material_id, quantity, transaction_type, reference_no):
        """Update stock and record in stock ledger"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Get current stock
        cursor.execute('SELECT current_stock FROM raw_materials WHERE id = ?', (material_id,))
        current = cursor.fetchone()['current_stock']
        
        # Calculate new stock
        if transaction_type in ['PURCHASE', 'PRODUCTION_RETURN']:
            new_stock = current + quantity
        else:  # PRODUCTION_USED, ADJUSTMENT
            new_stock = current - quantity
        
        # Update stock
        cursor.execute('UPDATE raw_materials SET current_stock = ? WHERE id = ?', (new_stock, material_id))
        
        conn.commit()
        conn.close()
        return new_stock