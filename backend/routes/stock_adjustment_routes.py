from flask import Blueprint, request, jsonify
from config.database import get_db, dict_from_row
import sqlite3
import datetime
import traceback
from models.accounting_hook import AccountingHook

stock_adj_bp = Blueprint('stock_adjustments', __name__, url_prefix='/api/stock-adjustments')

@stock_adj_bp.route('', methods=['GET'])
def get_adjustments():
    """Get all stock adjustments"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT 
                sa.*,
                CASE 
                    WHEN sa.item_type = 'finished_good' THEN fg.name 
                    ELSE rm.name 
                END as item_name
            FROM stock_adjustments sa
            LEFT JOIN finished_goods fg ON sa.item_type = 'finished_good' AND sa.item_id = fg.id
            LEFT JOIN raw_materials rm ON sa.item_type = 'raw_material' AND sa.item_id = rm.id
            ORDER BY sa.id DESC
        ''')
        adjustments = [dict_from_row(row) for row in cursor.fetchall()]
        return jsonify(adjustments)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@stock_adj_bp.route('', methods=['POST'])
def create_adjustment():
    """Create a new stock adjustment"""
    data = request.json
    conn = get_db()
    
    try:
        cursor = conn.cursor()
        
        # 1. Generate Adjustment No
        date_str = datetime.datetime.now().strftime('%y%m')
        cursor.execute('SELECT COUNT(*) FROM stock_adjustments WHERE adjustment_no LIKE ?', (f'SA{date_str}%',))
        count = cursor.fetchone()[0] + 1
        adj_no = f'SA{date_str}{count:04d}'
        
        item_type = data.get('item_type')
        item_id = data.get('item_id')
        adj_type = data.get('adjustment_type') # ADDITION or DEDUCTION
        quantity = float(data.get('quantity', 0))
        rate = float(data.get('rate', 0))
        amount = quantity * rate
        
        # 2. Update Inventory
        table = 'finished_goods' if item_type == 'finished_good' else 'raw_materials'
        
        if adj_type == 'ADDITION':
            cursor.execute(f'''
                UPDATE {table} 
                SET current_stock = current_stock + ?, updated_at = datetime('now')
                WHERE id = ?
            ''', (quantity, item_id))
        elif adj_type == 'DEDUCTION':
            cursor.execute(f'''
                UPDATE {table} 
                SET current_stock = current_stock - ?, updated_at = datetime('now')
                WHERE id = ?
            ''', (quantity, item_id))
        else:
            raise ValueError(f"Invalid adjustment type: {adj_type}")
            
        # 3. Post Journal Entry
        is_addition = (adj_type == 'ADDITION')
        voucher_id = AccountingHook.post_stock_adjustment(cursor, adj_no, amount, is_addition)
        
        # 4. Save Adjustment Record
        cursor.execute('''
            INSERT INTO stock_adjustments (
                adjustment_no, adjustment_date, item_type, item_id,
                adjustment_type, quantity, rate, amount, reason, voucher_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            adj_no, 
            data.get('adjustment_date', datetime.date.today().isoformat()),
            item_type,
            item_id,
            adj_type,
            quantity,
            rate,
            amount,
            data.get('reason', ''),
            voucher_id
        ))
        
        adj_id = cursor.lastrowid
        conn.commit()
        
        return jsonify({
            'message': 'Stock adjustment created successfully',
            'id': adj_id,
            'adjustment_no': adj_no
        }), 201
        
    except Exception as e:
        conn.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
