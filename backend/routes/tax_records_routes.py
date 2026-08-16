import sqlite3
from flask import Blueprint, request, jsonify

tax_records_bp = Blueprint('tax_records', __name__)
DB_PATH = '/Users/rajeshkumarvarma/Desktop/FOUR_ (R)_PLASTIC/database/manufacturing.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@tax_records_bp.route('/tax-records', methods=['GET'])
def get_tax_records():
    company_id = request.headers.get('Company-Id', 1)
    category = request.args.get('category')
    status = request.args.get('status')
    
    query = 'SELECT * FROM tax_records WHERE company_id = ?'
    params = [company_id]
    
    if category and category != 'All':
        query += ' AND tax_category = ?'
        params.append(category)
        
    if status and status != 'All':
        query += ' AND status = ?'
        params.append(status)
        
    query += ' ORDER BY created_at DESC'
    
    try:
        conn = get_db_connection()
        records = conn.execute(query, params).fetchall()
        conn.close()
        return jsonify([dict(row) for row in records])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tax_records_bp.route('/tax-records', methods=['POST'])
def create_tax_record():
    data = request.json
    company_id = request.headers.get('Company-Id', 1)
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO tax_records (
                company_id, tax_category, tax_type, period_start, period_end,
                amount, payment_date, challan_no, bank_id, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            company_id,
            data.get('tax_category'),
            data.get('tax_type'),
            data.get('period_start'),
            data.get('period_end'),
            data.get('amount', 0),
            data.get('payment_date'),
            data.get('challan_no'),
            data.get('bank_id'),
            data.get('status', 'pending'),
            data.get('notes')
        ))
        
        conn.commit()
        record_id = cursor.lastrowid
        conn.close()
        
        return jsonify({'message': 'Tax record created successfully', 'id': record_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tax_records_bp.route('/tax-records/<int:id>', methods=['PUT'])
def update_tax_record(id):
    data = request.json
    company_id = request.headers.get('Company-Id', 1)
    
    try:
        conn = get_db_connection()
        
        # Verify ownership
        record = conn.execute('SELECT * FROM tax_records WHERE id = ? AND company_id = ?', (id, company_id)).fetchone()
        if not record:
            conn.close()
            return jsonify({'error': 'Record not found'}), 404
            
        conn.execute('''
            UPDATE tax_records 
            SET tax_category = ?, tax_type = ?, period_start = ?, period_end = ?,
                amount = ?, payment_date = ?, challan_no = ?, bank_id = ?, status = ?, notes = ?
            WHERE id = ? AND company_id = ?
        ''', (
            data.get('tax_category', record['tax_category']),
            data.get('tax_type', record['tax_type']),
            data.get('period_start', record['period_start']),
            data.get('period_end', record['period_end']),
            data.get('amount', record['amount']),
            data.get('payment_date', record['payment_date']),
            data.get('challan_no', record['challan_no']),
            data.get('bank_id', record['bank_id']),
            data.get('status', record['status']),
            data.get('notes', record['notes']),
            id, company_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Tax record updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tax_records_bp.route('/tax-records/<int:id>', methods=['DELETE'])
def delete_tax_record(id):
    company_id = request.headers.get('Company-Id', 1)
    
    try:
        conn = get_db_connection()
        
        # Verify ownership
        record = conn.execute('SELECT * FROM tax_records WHERE id = ? AND company_id = ?', (id, company_id)).fetchone()
        if not record:
            conn.close()
            return jsonify({'error': 'Record not found'}), 404
            
        conn.execute('DELETE FROM tax_records WHERE id = ? AND company_id = ?', (id, company_id))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Tax record deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
