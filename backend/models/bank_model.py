"""
Bank Model - Database operations for banks
"""
from config.database import get_db, dict_from_row

class BankModel:
    """Bank database operations"""

    @staticmethod
    def get_all():
        """Get all active banks"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM banks
            WHERE is_active = 1
            ORDER BY name
        ''')
        banks = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return banks

    @staticmethod
    def get_by_id(bank_id):
        """Get bank by ID"""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM banks WHERE id = ? AND is_active = 1', (bank_id,))
        bank = dict_from_row(cursor.fetchone())
        conn.close()
        return bank

    @staticmethod
    def create(data):
        """Create new bank"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Generate bank code
        cursor.execute("SELECT COUNT(*) as count FROM banks")
        count = cursor.fetchone()[0] + 1
        code = f"BNK{count:04d}"
        
        cursor.execute('''
            INSERT INTO banks (
                code, name, account_no, ifsc_code, branch,
                opening_balance, current_balance, is_active, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
        ''', (
            code,
            data.get('name'),
            data.get('account_no'),
            data.get('ifsc_code'),
            data.get('branch'),
            float(data.get('opening_balance', 0)),
            float(data.get('opening_balance', 0)),  # current_balance starts as opening_balance
        ))
        
        bank_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            'id': bank_id,
            'code': code,
            'message': 'Bank created successfully'
        }

    @staticmethod
    def update(bank_id, data):
        """Update bank"""
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if bank exists
        cursor.execute('SELECT * FROM banks WHERE id = ? AND is_active = 1', (bank_id,))
        bank = cursor.fetchone()
        if not bank:
            conn.close()
            return {'error': 'Bank not found'}, 404
        
        cursor.execute('''
            UPDATE banks SET
                name = ?,
                account_no = ?,
                ifsc_code = ?,
                branch = ?,
                opening_balance = ?,
                current_balance = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            data.get('name'),
            data.get('account_no'),
            data.get('ifsc_code'),
            data.get('branch'),
            float(data.get('opening_balance', 0)),
            float(data.get('opening_balance', 0)),  # Update current_balance as well
            bank_id
        ))
        
        conn.commit()
        conn.close()
        return {'message': 'Bank updated successfully'}

    @staticmethod
    def delete(bank_id):
        """Soft delete bank"""
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE banks SET is_active = 0 WHERE id = ?', (bank_id,))
        conn.commit()
        conn.close()
        return {'message': 'Bank deleted successfully'}

    @staticmethod
    def search(query):
        """Search banks by name, code, or account number"""
        conn = get_db()
        cursor = conn.cursor()
        search_term = f'%{query}%'
        
        cursor.execute('''
            SELECT * FROM banks 
            WHERE is_active = 1 
            AND (name LIKE ? OR code LIKE ? OR account_no LIKE ?)
            ORDER BY name
            LIMIT 50
        ''', (search_term, search_term, search_term))
        
        banks = [dict_from_row(row) for row in cursor.fetchall()]
        conn.close()
        return banks

    @staticmethod
    def get_balance(bank_id):
        """Calculate live bank balance dynamically"""
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT opening_balance FROM banks WHERE id = ? AND is_active = 1', (bank_id,))
        bank = cursor.fetchone()
        if not bank:
            conn.close()
            return None
            
        opening_balance = bank['opening_balance'] or 0
        
        cursor.execute('SELECT SUM(amount) as total FROM customer_payments WHERE bank_id = ? AND status = "completed"', (bank_id,))
        receipts_row = cursor.fetchone()
        receipts = receipts_row['total'] if receipts_row and receipts_row['total'] else 0
        
        cursor.execute('SELECT SUM(amount) as total FROM vendor_payments WHERE bank_id = ? AND status = "completed"', (bank_id,))
        payments_row = cursor.fetchone()
        payments = payments_row['total'] if payments_row and payments_row['total'] else 0
        
        conn.close()
        return opening_balance + receipts - payments