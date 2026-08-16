from flask import Blueprint, request, jsonify
from database_config import get_db
from datetime import datetime
import traceback
import json

production_bp = Blueprint('production', __name__, url_prefix='/api')

# ==============================================
# GET: Fetch all production entries
# ==============================================
@production_bp.route('/production', methods=['GET'])
def get_productions():
    try:
        print("\n=== FETCHING PRODUCTION ENTRIES ===")
        db = get_db()

        # Get query parameters
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        status = request.args.get('status')

        query = """
            SELECT
                pe.*,
                fg.name as finished_good_name,
                fg.code as finished_good_code,
                fg.unit,
                (SELECT SUM(quantity_used) FROM production_consumption WHERE production_entry_id = pe.id) as total_material_used
            FROM production_entries pe
            LEFT JOIN finished_goods fg ON pe.finished_good_id = fg.id
            WHERE 1=1
        """
        params = []

        if from_date:
            query += " AND pe.production_date >= ?"
            params.append(from_date)

        if to_date:
            query += " AND pe.production_date <= ?"
            params.append(to_date)

        if status:
            query += " AND pe.status = ?"
            params.append(status)

        query += " ORDER BY pe.production_date DESC, pe.id DESC"
        
        productions = db.execute(query, params).fetchall()
        print(f"Found {len(productions)} productions")

        result = []
        for p in productions:
            # Get consumption details using production_entry_id
            consumption = db.execute('''
                SELECT
                    pc.*,
                    rm.name as raw_material_name,
                    rm.code as raw_material_code,
                    rm.unit
                FROM production_consumption pc
                LEFT JOIN raw_materials rm ON pc.raw_material_id = rm.id
                WHERE pc.production_entry_id = ?
            ''', (p['id'],)).fetchall()
            
            consumption_list = []
            for c in consumption:
                consumption_list.append({
                    'id': c['id'],
                    'raw_material_id': c['raw_material_id'],
                    'raw_material_name': c['raw_material_name'],
                    'raw_material_code': c['raw_material_code'],
                    'quantity_used': c['quantity_used'],
                    'rate': c['rate'],
                    'total_cost': c['total_cost'],
                    'batch_no': c['batch_no'],
                    'unit': c['unit']
                })

            result.append({
                'id': p['id'],
                'production_no': p['production_no'],
                'production_date': p['production_date'],
                'shift': p['shift'],
                'finished_good_id': p['finished_good_id'],
                'finished_good_name': p['finished_good_name'],
                'finished_good_code': p['finished_good_code'],
                'quantity_produced': p['quantity_produced'],
                'good_quantity': p['good_quantity'],
                'rejected_quantity': p['rejected_quantity'],
                'rejection_reason': p['rejection_reason'],
                'batch_no': p['batch_no'],
                'machine_no': p['machine_no'],
                'operator_name': p['operator_name'],
                'supervisor_name': p['supervisor_name'],
                'start_time': p['start_time'],
                'end_time': p['end_time'],
                'notes': p['notes'],
                'status': p['status'],
                'cost_center_name': p['cost_center_name'],
                'overhead_hourly_rate': p['overhead_hourly_rate'],
                'total_material_cost': p['total_material_cost'],
                'total_overhead_cost': p['total_overhead_cost'],
                'actual_cost': p['actual_cost'],
                'per_unit_cost': p['per_unit_cost'],
                'total_material_used': p['total_material_used'] or 0,
                'consumptions': consumption_list,
                'created_at': p['created_at'],
                'updated_at': p['updated_at']
            })

        return jsonify(result)
    except Exception as e:
        print(f"ERROR in get_productions: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==============================================
# GET: Fetch single production entry by ID
# ==============================================
@production_bp.route('/production/<int:id>', methods=['GET'])
def get_production(id):
    try:
        print(f"\n=== FETCHING PRODUCTION ID: {id} ===")
        db = get_db()
        
        production = db.execute('''
            SELECT
                pe.*,
                fg.name as finished_good_name,
                fg.code as finished_good_code,
                fg.unit
            FROM production_entries pe
            LEFT JOIN finished_goods fg ON pe.finished_good_id = fg.id
            WHERE pe.id = ?
        ''', (id,)).fetchone()

        if production is None:
            return jsonify({'error': 'Production not found'}), 404

        # Get consumption details using production_entry_id
        consumption = db.execute('''
            SELECT
                pc.*,
                rm.name as raw_material_name,
                rm.code as raw_material_code,
                rm.unit
            FROM production_consumption pc
            LEFT JOIN raw_materials rm ON pc.raw_material_id = rm.id
            WHERE pc.production_entry_id = ?
        ''', (id,)).fetchall()
        
        consumption_list = []
        for c in consumption:
            consumption_list.append({
                'id': c['id'],
                'raw_material_id': c['raw_material_id'],
                'raw_material_name': c['raw_material_name'],
                'raw_material_code': c['raw_material_code'],
                'quantity_used': c['quantity_used'],
                'rate': c['rate'],
                'total_cost': c['total_cost'],
                'batch_no': c['batch_no'],
                'unit': c['unit']
            })

        return jsonify({
            'id': production['id'],
            'production_no': production['production_no'],
            'production_date': production['production_date'],
            'shift': production['shift'],
            'finished_good_id': production['finished_good_id'],
            'finished_good_name': production['finished_good_name'],
            'finished_good_code': production['finished_good_code'],
            'quantity_produced': production['quantity_produced'],
            'good_quantity': production['good_quantity'],
            'rejected_quantity': production['rejected_quantity'],
            'rejection_reason': production['rejection_reason'],
            'batch_no': production['batch_no'],
            'machine_no': production['machine_no'],
            'operator_name': production['operator_name'],
            'supervisor_name': production['supervisor_name'],
            'start_time': production['start_time'],
            'end_time': production['end_time'],
            'notes': production['notes'],
            'status': production['status'],
            'cost_center_name': production['cost_center_name'],
            'overhead_hourly_rate': production['overhead_hourly_rate'],
            'total_material_cost': production['total_material_cost'],
            'total_overhead_cost': production['total_overhead_cost'],
            'actual_cost': production['actual_cost'],
            'per_unit_cost': production['per_unit_cost'],
            'consumptions': consumption_list,
            'created_at': production['created_at'],
            'updated_at': production['updated_at']
        })
    except Exception as e:
        print(f"ERROR in get_production: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==============================================
# POST: Create new production entry
# ==============================================
@production_bp.route('/production', methods=['POST'])
def create_production():
    try:
        data = request.json
        print("\n" + "="*80)
        print("📥 RECEIVED PRODUCTION DATA:")
        print("="*80)
        print(json.dumps(data, indent=2))
        print("="*80)
        
        db = get_db()
        
        # Validate required fields
        required_fields = ['finished_good_id', 'production_date', 'quantity_produced']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Generate production number if not provided
        production_no = data.get('production_no')
        if not production_no:
            from datetime import datetime
            date_str = datetime.now().strftime('%y%m%d%H%M%S')
            production_no = f"PROD{date_str}"
        
        # Insert production entry
        cursor = db.execute('''
            INSERT INTO production_entries (
                production_no, production_date, shift, finished_good_id,
                quantity_produced, good_quantity, rejected_quantity, rejection_reason,
                batch_no, machine_no, operator_name, supervisor_name,
                start_time, end_time, notes, status, cost_center_name, overhead_hourly_rate, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ''', (
            production_no,
            data.get('production_date'),
            data.get('shift', 'Morning'),
            data.get('finished_good_id'),
            data.get('quantity_produced'),
            data.get('good_quantity', data.get('quantity_produced')),
            data.get('rejected_quantity', 0),
            data.get('rejection_reason', ''),
            data.get('batch_no', ''),
            data.get('machine_no', ''),
            data.get('operator_name', ''),
            data.get('supervisor_name', ''),
            data.get('start_time', ''),
            data.get('end_time', ''),
            data.get('notes', ''),
            data.get('status', 'pending'),
            data.get('cost_center_name', ''),
            data.get('overhead_hourly_rate', 0)
        ))
        
        production_id = cursor.lastrowid
        print(f"✅ Production entry created with ID: {production_id}")
        
        # Insert raw material consumption and update stock
        materials = data.get('materials', [])
        if materials:
            print(f"📦 Processing {len(materials)} raw materials...")
            
            for mat in materials:
                if not mat.get('raw_material_id') or not mat.get('quantity_used'):
                    continue
                    
                # Get rate from payload, or fallback to database default
                rate = float(mat.get('rate') or 0)
                if not rate:
                    rm = db.execute('SELECT purchase_rate FROM raw_materials WHERE id = ?', (mat.get('raw_material_id'),)).fetchone()
                    if rm and rm['purchase_rate']:
                        rate = float(rm['purchase_rate'])
                
                total_cost = float(mat.get('quantity_used')) * rate
                
                # Insert consumption record
                db.execute('''
                    INSERT INTO production_consumption (
                        production_entry_id, raw_material_id, quantity_used, rate, total_cost, batch_no, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                ''', (
                    production_id,
                    mat.get('raw_material_id'),
                    mat.get('quantity_used'),
                    rate,
                    total_cost,
                    mat.get('batch_no', '')
                ))
                
                # Update raw material stock (decrease)
                db.execute('''
                    UPDATE raw_materials 
                    SET current_stock = current_stock - ?,
                        updated_at = datetime('now')
                    WHERE id = ?
                ''', (mat.get('quantity_used'), mat.get('raw_material_id')))
                
                print(f"  - Updated stock for raw material ID {mat.get('raw_material_id')}: -{mat.get('quantity_used')}")
        
        # Calculate Costs
        total_material_cost = 0
        if materials:
            for mat in materials:
                qty = float(mat.get('quantity_used', 0))
                rate = float(mat.get('rate') or 0)
                if not rate:
                    rm = db.execute('SELECT purchase_rate FROM raw_materials WHERE id = ?', (mat.get('raw_material_id'),)).fetchone()
                    if rm and rm['purchase_rate']:
                        rate = float(rm['purchase_rate'])
                total_material_cost += qty * rate
                    
        total_overhead_cost = float(data.get('total_overhead_cost', 0))
        hourly_rate = float(data.get('overhead_hourly_rate', 0))
        if hourly_rate > 0 and not total_overhead_cost:
            start = data.get('start_time')
            end = data.get('end_time')
            if start and end:
                try:
                    from datetime import datetime as dt
                    t1 = dt.strptime(start, "%H:%M")
                    t2 = dt.strptime(end, "%H:%M")
                    hours = (t2 - t1).total_seconds() / 3600.0
                    if hours < 0: hours += 24 # Handle midnight crossover
                    total_overhead_cost = hours * hourly_rate
                except Exception as e:
                    print(f"Time parsing error: {e}")
                    
        actual_cost = total_material_cost + total_overhead_cost
        good_qty = float(data.get('good_quantity', data.get('quantity_produced', 1)))
        per_unit_cost = actual_cost / good_qty if good_qty > 0 else 0
        
        db.execute('''
            UPDATE production_entries 
            SET total_material_cost = ?, total_overhead_cost = ?, actual_cost = ?, per_unit_cost = ?
            WHERE id = ?
        ''', (total_material_cost, total_overhead_cost, actual_cost, per_unit_cost, production_id))
        
        db.commit()
        
        return jsonify({
            'id': production_id,
            'production_no': production_no,
            'message': 'Production entry created successfully. Click complete to update stock.'
        }), 201
        
    except Exception as e:
        print("\n❌ ERROR CREATING PRODUCTION ENTRY:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
        
        if 'db' in locals():
            db.rollback()
            
        return jsonify({'error': str(e)}), 500

# ==============================================
# PUT: Update an existing production entry (IMPROVED)
# ==============================================
@production_bp.route('/production/<int:id>', methods=['PUT'])
def update_production(id):
    """Update an existing production entry with proper material handling"""
    try:
        data = request.json
        print(f"\n=== UPDATING PRODUCTION ID: {id} ===")
        print("📥 Update data:", json.dumps(data, indent=2))
        
        db = get_db()
        
        # First check if production exists
        production = db.execute('SELECT * FROM production_entries WHERE id = ?', (id,)).fetchone()
        if not production:
            db.close()
            return jsonify({'error': 'Production not found'}), 404
        
        # Get old consumption to reverse stock changes
        old_consumption = db.execute('''
            SELECT raw_material_id, quantity_used 
            FROM production_consumption 
            WHERE production_entry_id = ?
        ''', (id,)).fetchall()
        
        # Reverse old stock changes (add back to raw materials)
        for old in old_consumption:
            db.execute('''
                UPDATE raw_materials 
                SET current_stock = current_stock + ?,
                    updated_at = datetime('now')
                WHERE id = ?
            ''', (old['quantity_used'], old['raw_material_id']))
            print(f"  - Reversed stock for raw material ID {old['raw_material_id']}: +{old['quantity_used']}")
        
        # Update production entry
        db.execute('''
            UPDATE production_entries SET
                production_date = ?,
                shift = ?,
                finished_good_id = ?,
                quantity_produced = ?,
                good_quantity = ?,
                rejected_quantity = ?,
                rejection_reason = ?,
                batch_no = ?,
                machine_no = ?,
                operator_name = ?,
                supervisor_name = ?,
                start_time = ?,
                end_time = ?,
                notes = ?,
                status = ?,
                cost_center_name = ?,
                overhead_hourly_rate = ?,
                updated_at = datetime('now')
            WHERE id = ?
        ''', (
            data.get('production_date'),
            data.get('shift', 'Morning'),
            data.get('finished_good_id'),
            data.get('quantity_produced'),
            data.get('good_quantity', data.get('quantity_produced')),
            data.get('rejected_quantity', 0),
            data.get('rejection_reason', ''),
            data.get('batch_no', ''),
            data.get('machine_no', ''),
            data.get('operator_name', ''),
            data.get('supervisor_name', ''),
            data.get('start_time', ''),
            data.get('end_time', ''),
            data.get('notes', ''),
            data.get('status', 'pending'),
            data.get('cost_center_name', ''),
            data.get('overhead_hourly_rate', 0),
            id
        ))
        
        # Delete existing consumption records
        db.execute('DELETE FROM production_consumption WHERE production_entry_id = ?', (id,))
        
        # Insert new consumption records and update stock
        materials = data.get('materials', [])
        if materials:
            print(f"📦 Processing {len(materials)} raw materials...")
            
            for mat in materials:
                if mat.get('raw_material_id') and mat.get('quantity_used'):
                    # Get rate from payload, or fallback to database default
                    rate = float(mat.get('rate') or 0)
                    if not rate:
                        rm = db.execute('SELECT purchase_rate FROM raw_materials WHERE id = ?', (mat.get('raw_material_id'),)).fetchone()
                        if rm and rm['purchase_rate']:
                            rate = float(rm['purchase_rate'])
                    
                    total_cost = float(mat.get('quantity_used')) * rate
                    
                    # Insert consumption record
                    db.execute('''
                        INSERT INTO production_consumption (
                            production_entry_id, raw_material_id, quantity_used, rate, total_cost, batch_no, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                    ''', (
                        id,
                        mat.get('raw_material_id'),
                        mat.get('quantity_used'),
                        rate,
                        total_cost,
                        mat.get('batch_no', '')
                    ))
                    
                    # Update raw material stock (decrease)
                    db.execute('''
                        UPDATE raw_materials 
                        SET current_stock = current_stock - ?,
                            updated_at = datetime('now')
                        WHERE id = ?
                    ''', (mat.get('quantity_used'), mat.get('raw_material_id')))
                    
                    print(f"  - Updated stock for raw material ID {mat.get('raw_material_id')}: -{mat.get('quantity_used')}")
        else:
            print("⚠️ No materials to process")
            
        # Calculate Costs
        total_material_cost = 0
        if materials:
            for mat in materials:
                qty = float(mat.get('quantity_used', 0))
                rate = float(mat.get('rate') or 0)
                if not rate:
                    rm = db.execute('SELECT purchase_rate FROM raw_materials WHERE id = ?', (mat.get('raw_material_id'),)).fetchone()
                    if rm and rm['purchase_rate']:
                        rate = float(rm['purchase_rate'])
                total_material_cost += qty * rate
                    
        total_overhead_cost = float(data.get('total_overhead_cost', 0))
        hourly_rate = float(data.get('overhead_hourly_rate', 0))
        if hourly_rate > 0 and not total_overhead_cost:
            start = data.get('start_time')
            end = data.get('end_time')
            if start and end:
                try:
                    from datetime import datetime as dt
                    t1 = dt.strptime(start, "%H:%M")
                    t2 = dt.strptime(end, "%H:%M")
                    hours = (t2 - t1).total_seconds() / 3600.0
                    if hours < 0: hours += 24 # Handle midnight crossover
                    total_overhead_cost = hours * hourly_rate
                except Exception as e:
                    print(f"Time parsing error: {e}")
                    
        actual_cost = total_material_cost + total_overhead_cost
        good_qty = float(data.get('good_quantity', data.get('quantity_produced', 1)))
        per_unit_cost = actual_cost / good_qty if good_qty > 0 else 0
        
        db.execute('''
            UPDATE production_entries 
            SET total_material_cost = ?, total_overhead_cost = ?, actual_cost = ?, per_unit_cost = ?
            WHERE id = ?
        ''', (total_material_cost, total_overhead_cost, actual_cost, per_unit_cost, id))
        
        # If production is being completed, update finished good stock
        if data.get('status') == 'completed' and production['status'] != 'completed':
            db.execute('''
                UPDATE finished_goods 
                SET current_stock = current_stock + ?,
                    updated_at = datetime('now')
                WHERE id = ?
            ''', (data.get('good_quantity', data.get('quantity_produced')), data.get('finished_good_id')))
            print(f"  - Added {data.get('good_quantity', data.get('quantity_produced'))} to finished good ID {data.get('finished_good_id')}")
        
        db.commit()
        db.close()
        
        print(f"✅ Production entry {id} updated successfully")
        return jsonify({
            'success': True,
            'message': 'Production entry updated successfully',
            'id': id
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating production: {str(e)}")
        traceback.print_exc()
        if 'db' in locals():
            db.rollback()
            db.close()
        return jsonify({'error': str(e)}), 500

# ==============================================
# PUT: Complete a production entry (update status and stock)
# ==============================================
@production_bp.route('/production/<int:id>/complete', methods=['PUT'])
def complete_production(id):
    """Mark production as completed and update stock"""
    try:
        print(f"\n=== COMPLETING PRODUCTION ID: {id} ===")
        db = get_db()
        
        # Get production details
        production = db.execute('''
            SELECT * FROM production_entries WHERE id = ?
        ''', (id,)).fetchone()
        
        if not production:
            return jsonify({'error': 'Production not found'}), 404
        
        if production['status'] == 'completed':
            return jsonify({'message': 'Production already completed'}), 200
        
        # Update status to completed
        db.execute('''
            UPDATE production_entries 
            SET status = 'completed',
                updated_at = datetime('now')
            WHERE id = ?
        ''', (id,))
        
        # Update finished good stock (increase)
        db.execute('''
            UPDATE finished_goods 
            SET current_stock = current_stock + ?,
                updated_at = datetime('now')
            WHERE id = ?
        ''', (production['good_quantity'], production['finished_good_id']))
        
        # Check if there is rejected quantity to recycle back into raw materials (PP Scrap)
        rejected_qty = production['rejected_quantity'] or 0
        if rejected_qty > 0:
            # Look up finished good details
            fg = db.execute('SELECT name FROM finished_goods WHERE id = ?', (production['finished_good_id'],)).fetchone()
            fg_name = fg['name'].upper() if fg else ""
            
            # Determine target scrap raw material based on colour/quality
            target_scrap_id = 1 # Default to PP SCRAP
            scrap_name = "PP SCRAP"
            if "MILKY" in fg_name:
                target_scrap_id = 9 # PP MILKY AGLO
                scrap_name = "PP MILKY AGLO"
            elif any(c in fg_name for c in ["BLACK", "GRAY", "COLOR", "RED", "BLUE", "MAROON", "YELLOW", "BROWN", "CP"]):
                target_scrap_id = 4 # PP COLOR SCRAP
                scrap_name = "PP COLOR SCRAP"
                
            # Update raw material stock for recycled scrap
            db.execute('''
                UPDATE raw_materials 
                SET current_stock = current_stock + ?,
                    updated_at = datetime('now')
                WHERE id = ?
            ''', (rejected_qty, target_scrap_id))
            
            # Log stock adjustment for audit trail
            adj_no = f"ADJ-REC-{datetime.now().strftime('%Y%m%d')}-{id}"
            db.execute('''
                INSERT INTO stock_adjustments (
                    adjustment_no, adjustment_date, item_type, item_id, 
                    adjustment_type, quantity, rate, amount, reason, created_at
                ) VALUES (?, date('now'), 'raw_material', ?, 'increase', ?, 0, 0, ?, datetime('now'))
            ''', (
                adj_no, 
                target_scrap_id, 
                rejected_qty, 
                f"Automated scrap recovery ({scrap_name}) from completed production batch {production['production_no']}"
            ))
            print(f"♻️ Automatically recovered {rejected_qty} KG to raw material ID {target_scrap_id} ({scrap_name}) as ground scrap.")

        print(f"✅ Production {id} completed")
        print(f"✅ Added {production['good_quantity']} to finished good ID {production['finished_good_id']}")
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Production completed successfully',
            'id': id
        }), 200
        
    except Exception as e:
        print(f"❌ Error completing production: {str(e)}")
        traceback.print_exc()
        if 'db' in locals():
            db.rollback()
        return jsonify({'error': str(e)}), 500

# ==============================================
# GET: Fetch consumption for a production entry
# ==============================================
@production_bp.route('/production/<int:id>/consumption', methods=['GET'])
def get_production_consumption(id):
    try:
        print(f"\n=== FETCHING CONSUMPTION FOR PRODUCTION ID: {id} ===")
        db = get_db()
        
        consumption = db.execute('''
            SELECT
                pc.*,
                rm.name as raw_material_name,
                rm.code as raw_material_code,
                rm.unit
            FROM production_consumption pc
            LEFT JOIN raw_materials rm ON pc.raw_material_id = rm.id
            WHERE pc.production_entry_id = ?
        ''', (id,)).fetchall()

        result = []
        for c in consumption:
            result.append({
                'id': c['id'],
                'raw_material_id': c['raw_material_id'],
                'raw_material_name': c['raw_material_name'],
                'raw_material_code': c['raw_material_code'],
                'quantity_used': c['quantity_used'],
                'batch_no': c['batch_no'],
                'unit': c['unit'],
                'created_at': c['created_at']
            })

        return jsonify(result)
    except Exception as e:
        print(f"ERROR in get_production_consumption: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==============================================
# DELETE: Delete a production entry
# ==============================================
@production_bp.route('/production/<int:id>', methods=['DELETE'])
def delete_production(id):
    """Delete a production entry and its consumption records"""
    try:
        print(f"\n=== DELETING PRODUCTION ID: {id} ===")
        db = get_db()
        cursor = db.cursor()
        
        # First check if production exists
        production = cursor.execute('SELECT * FROM production_entries WHERE id = ?', (id,)).fetchone()
        if not production:
            db.close()
            return jsonify({'error': 'Production not found'}), 404
        
        # Delete consumption records first (foreign key constraint)
        cursor.execute('DELETE FROM production_consumption WHERE production_entry_id = ?', (id,))
        deleted_consumption = cursor.rowcount
        print(f"✅ Deleted {deleted_consumption} consumption records")
        
        # Then delete production entry
        cursor.execute('DELETE FROM production_entries WHERE id = ?', (id,))
        deleted_production = cursor.rowcount
        
        db.commit()
        db.close()
        
        if deleted_production > 0:
            return jsonify({
                'success': True,
                'message': 'Production deleted successfully',
                'deleted_id': id
            }), 200
        else:
            return jsonify({'error': 'Failed to delete production'}), 400
            
    except Exception as e:
        print(f"❌ Error deleting production: {str(e)}")
        traceback.print_exc()
        if 'db' in locals():
            db.rollback()
            db.close()
        return jsonify({'error': str(e)}), 500