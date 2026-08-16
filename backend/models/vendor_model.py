"""
Vendor Model - Database operations for vendors
"""
from config.database import get_db, dict_from_row

class VendorModel:
    """Vendor database operations"""
    
    @staticmethod
    def get_all():
        """Get all active vendors"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM vendors 
            WHERE is_active = 1 
            ORDER BY name
        ''')
        vendors = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return vendors
    
    @staticmethod
    def get_by_id(vendor_id):
        """Get vendor by ID"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,))
        vendor = dict_from_row(cursor.fetchone())
        conn.close()
        return vendor
    
    @staticmethod
    def create(data):
        """Create new vendor"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Generate vendor code
        cursor.execute("SELECT COUNT(*) as count FROM vendors")
        count = cursor.fetchone()['count'] + 1
        code = f"VEN{count:04d}"
        
        cursor.execute('''
            INSERT INTO vendors (
                code, name, phone, mobile, email, address, city, state,
                pincode, gst, pan, contact_person, opening_balance,
                current_balance, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            code,
            data['name'],
            data.get('phone', ''),
            data.get('mobile', ''),
            data.get('email', ''),
            data.get('address', ''),
            data.get('city', ''),
            data.get('state', ''),
            data.get('pincode', ''),
            data.get('gst', ''),
            data.get('pan', ''),
            data.get('contact_person', ''),
            data.get('opening_balance', 0),
            data.get('opening_balance', 0),  # current_balance = opening_balance
            1  # created_by (default admin)
        ))
        
        vendor_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {'id': vendor_id, 'code': code, 'message': 'Vendor created successfully'}
    
    @staticmethod
    def update(vendor_id, data):
        """Update vendor"""
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE vendors SET
                name = ?, phone = ?, mobile = ?, email = ?, address = ?,
                city = ?, state = ?, pincode = ?, gst = ?, pan = ?,
                contact_person = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data['name'],
            data.get('phone', ''),
            data.get('mobile', ''),
            data.get('email', ''),
            data.get('address', ''),
            data.get('city', ''),
            data.get('state', ''),
            data.get('pincode', ''),
            data.get('gst', ''),
            data.get('pan', ''),
            data.get('contact_person', ''),
            vendor_id
        ))
        
        conn.commit()
        conn.close()
        return {'message': 'Vendor updated successfully'}
    
    @staticmethod
    def delete(vendor_id):
        """Soft delete vendor"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE vendors SET is_active = 0 WHERE id = ?', (vendor_id,))
        conn.commit()
        conn.close()
        return {'message': 'Vendor deleted successfully'}
    
    @staticmethod
    def search(query):
        """Search vendors by name, code, phone"""
        conn = get_db()
        cursor = conn.cursor()
        search_term = f"%{query}%"
        cursor.execute('''
            SELECT * FROM vendors 
            WHERE is_active = 1 
            AND (name LIKE ? OR code LIKE ? OR phone LIKE ? OR mobile LIKE ?)
            ORDER BY name
            LIMIT 50
        ''', (search_term, search_term, search_term, search_term))
        vendors = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return vendors