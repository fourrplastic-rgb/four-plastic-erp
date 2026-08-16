from flask import Blueprint, request, jsonify
import sqlite3
import os
import uuid
import datetime

# Setup DB Path similar to other routes
# __file__ is backend/routes/accounting_routes.py. Need to go up 3 levels to reach project root
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "database", "manufacturing.db")

accounting_bp = Blueprint('accounting', __name__, url_prefix='/api/accounting')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ==================== LEDGER GROUPS ====================

@accounting_bp.route('/groups', methods=['GET'])
def get_groups():
    conn = get_db_connection()
    groups = conn.execute('SELECT * FROM ledger_groups ORDER BY type, name').fetchall()
    conn.close()
    return jsonify([dict(g) for g in groups])

# ==================== LEDGERS ====================

@accounting_bp.route('/ledgers', methods=['GET'])
def get_ledgers():
    conn = get_db_connection()
    query = '''
        SELECT l.*, g.name as group_name, g.type as group_type 
        FROM ledgers l
        JOIN ledger_groups g ON l.group_id = g.id
        ORDER BY g.type, l.name
    '''
    ledgers = conn.execute(query).fetchall()
    conn.close()
    return jsonify([dict(l) for l in ledgers])

@accounting_bp.route('/ledgers', methods=['POST'])
def create_ledger():
    data = request.json
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO ledgers (name, group_id, balance_type) VALUES (?, ?, ?)',
            (data['name'], data['group_id'], data.get('balance_type', 'DR'))
        )
        conn.commit()
        new_id = cursor.lastrowid
        return jsonify({'message': 'Ledger created', 'id': new_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Ledger name already exists'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ==================== JOURNAL VOUCHERS ====================

@accounting_bp.route('/journal', methods=['GET'])
def get_journals():
    conn = get_db_connection()
    vouchers = conn.execute('''
        SELECT * FROM journal_vouchers ORDER BY voucher_date DESC, id DESC LIMIT 50
    ''').fetchall()
    
    result = []
    for v in vouchers:
        vd = dict(v)
        # Fetch entries
        entries = conn.execute('''
            SELECT je.*, l.name as ledger_name 
            FROM journal_entries je
            JOIN ledgers l ON je.ledger_id = l.id
            WHERE je.voucher_id = ?
        ''', (v['id'],)).fetchall()
        vd['entries'] = [dict(e) for e in entries]
        result.append(vd)
    
    conn.close()
    return jsonify(result)

@accounting_bp.route('/journal', methods=['POST'])
def create_journal():
    data = request.json
    entries = data.get('entries', [])
    
    # Helper to convert to float safely
    def to_float(val):
        try:
            if not val:
                return 0.0
            return float(val)
        except ValueError:
            return 0.0

    # 1. Validation: Debit == Credit
    total_debit = sum([to_float(e.get('debit')) for e in entries])
    total_credit = sum([to_float(e.get('credit')) for e in entries])
    
    if abs(total_debit - total_credit) > 0.01:
        return jsonify({'error': f'Journal unbalanced! Debits ({total_debit}) != Credits ({total_credit})'}), 400
        
    if len(entries) < 2:
        return jsonify({'error': 'Journal must have at least two entries (one debit, one credit).'}), 400

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Generate Voucher No if not provided
        voucher_no = data.get('voucher_no')
        if not voucher_no:
            date_str = datetime.datetime.now().strftime('%y%m')
            cursor.execute('SELECT COUNT(*) FROM journal_vouchers WHERE voucher_no LIKE ?', (f'JV{date_str}%',))
            count = cursor.fetchone()[0] + 1
            voucher_no = f'JV{date_str}{count:04d}'

        # Insert Header
        cursor.execute('''
            INSERT INTO journal_vouchers (voucher_no, voucher_date, reference_no, notes)
            VALUES (?, ?, ?, ?)
        ''', (voucher_no, data.get('voucher_date', datetime.date.today().isoformat()), 
              data.get('reference_no', ''), data.get('notes', '')))
        
        voucher_id = cursor.lastrowid
        
        # Insert Entries
        for entry in entries:
            cursor.execute('''
                INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit, notes, party_type, party_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                voucher_id, 
                entry['ledger_id'], 
                to_float(entry.get('debit')), 
                to_float(entry.get('credit')), 
                entry.get('notes', ''),
                entry.get('party_type', None),
                entry.get('party_id', None)
            ))
            
            # Update Party Ledgers if applicable
            party_type = entry.get('party_type')
            party_id = entry.get('party_id')
            debit_amt = to_float(entry.get('debit'))
            credit_amt = to_float(entry.get('credit'))
            
            if party_type == 'customer' and party_id:
                # For customers: Debit increases balance, Credit decreases balance
                cursor.execute('''
                    UPDATE customers 
                    SET current_balance = current_balance + ? - ?
                    WHERE id = ?
                ''', (debit_amt, credit_amt, party_id))
            elif party_type == 'vendor' and party_id:
                # For vendors: Credit increases balance, Debit decreases balance
                cursor.execute('''
                    UPDATE vendors 
                    SET current_balance = current_balance + ? - ?
                    WHERE id = ?
                ''', (credit_amt, debit_amt, party_id))
            
        conn.commit()
        return jsonify({'message': 'Journal posted successfully', 'voucher_no': voucher_no}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ==================== REPORTS ====================

@accounting_bp.route('/trial-balance', methods=['GET'])
def trial_balance():
    from_date = request.args.get('from_date', '2000-01-01')
    to_date = request.args.get('to_date', datetime.date.today().isoformat())
    
    conn = get_db_connection()
    # Trial Balance: Sum of all entries up to to_date
    query = '''
        SELECT 
            l.id, l.name as ledger_name, 
            g.name as group_name, g.type as group_type,
            SUM(je.debit) as total_debit, 
            SUM(je.credit) as total_credit
        FROM journal_entries je
        JOIN ledgers l ON je.ledger_id = l.id
        JOIN ledger_groups g ON l.group_id = g.id
        JOIN journal_vouchers jv ON je.voucher_id = jv.id
        WHERE jv.voucher_date <= ?
        GROUP BY l.id
        ORDER BY g.type, g.name, l.name
    '''
    results = conn.execute(query, (to_date,)).fetchall()
    conn.close()
    
    tb = []
    total_dr = 0
    total_cr = 0
    for r in results:
        dr = float(r['total_debit'] or 0)
        cr = float(r['total_credit'] or 0)
        
        # Determine net balance
        net = dr - cr
        if net > 0:
            final_dr = net
            final_cr = 0
        else:
            final_dr = 0
            final_cr = abs(net)
            
        total_dr += final_dr
        total_cr += final_cr
            
        tb.append({
            'ledger_id': r['id'],
            'ledger_name': r['ledger_name'],
            'group_name': r['group_name'],
            'group_type': r['group_type'],
            'debit_balance': final_dr,
            'credit_balance': final_cr
        })
        
    return jsonify({
        'data': tb,
        'totals': {
            'total_debit': total_dr,
            'total_credit': total_cr
        }
    })

@accounting_bp.route('/profit-loss', methods=['GET'])
def profit_loss():
    from_date = request.args.get('from_date', '2000-01-01')
    to_date = request.args.get('to_date', datetime.date.today().isoformat())
    
    conn = get_db_connection()
    # Income & Expense for the specific Financial Year Period
    query = '''
        SELECT 
            l.id, l.name as ledger_name, 
            g.name as group_name, g.type as group_type,
            SUM(je.debit) as total_debit, 
            SUM(je.credit) as total_credit
        FROM journal_entries je
        JOIN ledgers l ON je.ledger_id = l.id
        JOIN ledger_groups g ON l.group_id = g.id
        JOIN journal_vouchers jv ON je.voucher_id = jv.id
        WHERE g.type IN ('Income', 'Expense')
          AND jv.voucher_date BETWEEN ? AND ?
        GROUP BY l.id
        ORDER BY g.type, g.name, l.name
    '''
    results = conn.execute(query, (from_date, to_date)).fetchall()
    conn.close()
    
    incomes = []
    expenses = []
    total_income = 0
    total_expense = 0
    
    for r in results:
        dr = float(r['total_debit'] or 0)
        cr = float(r['total_credit'] or 0)
        net = cr - dr if r['group_type'] == 'Income' else dr - cr
        
        item = {
            'ledger_name': r['ledger_name'],
            'group_name': r['group_name'],
            'amount': abs(net),
            'balance_type': 'CR' if r['group_type'] == 'Income' else 'DR'
        }
        
        if r['group_type'] == 'Income':
            incomes.append(item)
            total_income += net
        else:
            expenses.append(item)
            total_expense += net
            
    net_profit = total_income - total_expense
            
    return jsonify({
        'incomes': incomes,
        'expenses': expenses,
        'total_income': total_income,
        'total_expense': total_expense,
        'net_profit': net_profit
    })
