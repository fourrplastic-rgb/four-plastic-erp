"""
Customer Model - Database operations for customers
"""
from config.database import get_db, dict_from_row

class CustomerModel:
    """Customer database operations"""
    
    @staticmethod
    def get_all():
        """Get all active customers"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM customers 
            WHERE is_active = 1 
            ORDER BY name
        ''')
        customers = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return customers
    
    @staticmethod
    def get_by_id(customer_id):
        """Get customer by ID"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
        customer = dict_from_row(cursor.fetchone())
        conn.close()
        return customer
    
    @staticmethod
    def create(data):
        """Create new customer"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Generate customer code
        cursor.execute("SELECT COUNT(*) as count FROM customers")
        count = cursor.fetchone()['count'] + 1
        code = f"CUST{count:04d}"
        
        cursor.execute('''
            INSERT INTO customers (
                code, name, phone, mobile, email, address, city, state,
                pincode, gst, pan, contact_person, credit_limit, credit_days,
                opening_balance, current_balance, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            data.get('credit_limit', 0),
            data.get('credit_days', 30),
            data.get('opening_balance', 0),
            data.get('opening_balance', 0),  # current_balance = opening_balance
            1  # created_by (default admin)
        ))
        
        customer_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {'id': customer_id, 'code': code, 'message': 'Customer created successfully'}
    
    @staticmethod
    def update(customer_id, data):
        """Update customer"""
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE customers SET
                name = ?, phone = ?, mobile = ?, email = ?, address = ?,
                city = ?, state = ?, pincode = ?, gst = ?, pan = ?,
                contact_person = ?, credit_limit = ?, credit_days = ?,
                updated_at = CURRENT_TIMESTAMP
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
            data.get('credit_limit', 0),
            data.get('credit_days', 30),
            customer_id
        ))
        
        conn.commit()
        conn.close()
        return {'message': 'Customer updated successfully'}
    
    @staticmethod
    def delete(customer_id):
        """Soft delete customer"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE customers SET is_active = 0 WHERE id = ?', (customer_id,))
        conn.commit()
        conn.close()
        return {'message': 'Customer deleted successfully'}
    
    @staticmethod
    def search(query):
        """Search customers by name, code, phone"""
        conn = get_db()
        cursor = conn.cursor()
        search_term = f"%{query}%"
        cursor.execute('''
            SELECT * FROM customers 
            WHERE is_active = 1 
            AND (name LIKE ? OR code LIKE ? OR phone LIKE ? OR mobile LIKE ?)
            ORDER BY name
            LIMIT 50
        ''', (search_term, search_term, search_term, search_term))
        customers = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return customers