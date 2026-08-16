from flask import Blueprint, request, jsonify
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "database", "manufacturing.db")

financial_year_bp = Blueprint('financial_year', __name__, url_prefix='/api/financial-years')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@financial_year_bp.route('', methods=['GET'])
def get_financial_years():
    try:
        conn = get_db_connection()
        years = conn.execute('SELECT * FROM financial_years ORDER BY start_date DESC').fetchall()
        return jsonify([dict(y) for y in years])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@financial_year_bp.route('/active', methods=['GET'])
def get_active_year():
    try:
        conn = get_db_connection()
        year = conn.execute('SELECT * FROM financial_years WHERE is_active = 1 LIMIT 1').fetchone()
        if year:
            return jsonify(dict(year))
        return jsonify({'error': 'No active financial year found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@financial_year_bp.route('/<int:id>/activate', methods=['POST'])
def activate_year(id):
    try:
        conn = get_db_connection()
        conn.execute('UPDATE financial_years SET is_active = 0')
        conn.execute('UPDATE financial_years SET is_active = 1 WHERE id = ?', (id,))
        conn.commit()
        return jsonify({'message': 'Financial year activated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()
