"""
Delivery Challan Model - Handles delivery challans
"""
from config.database import get_db_connection, execute_with_retry, dict_from_row
from datetime import datetime
import sqlite3
from models.accounting_hook import AccountingHook

class DeliveryChallan:
    
    @staticmethod
    def create_table():
        """Create delivery challan tables if they don't exist"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()

                # Create delivery challan table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS delivery_challan (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        challan_no TEXT UNIQUE NOT NULL,
                        challan_date DATE NOT NULL,
                        customer_id INTEGER NOT NULL,
                        bill_to_address TEXT,
                        bill_to_city TEXT,
                        bill_to_state TEXT,
                        bill_to_pincode TEXT,
                        bill_to_gst TEXT,
                        ship_to_address TEXT,
                        ship_to_city TEXT,
                        ship_to_state TEXT,
                        ship_to_pincode TEXT,
                        ship_to_gst TEXT,
                        transporter_name TEXT,
                        transporter_phone TEXT,
                        lr_no TEXT,
                        lr_date DATE,
                        no_of_packages INTEGER DEFAULT 0,
                        weight REAL DEFAULT 0,
                        freight_charges REAL DEFAULT 0,
                        payment_terms TEXT,
                        reference_no TEXT,
                        vehicle_no TEXT,
                        transport_mode TEXT,
                        place_of_delivery TEXT,
                        date_of_shipment DATE,
                        notes TEXT,
                        status TEXT DEFAULT 'pending',
                        created_by INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (customer_id) REFERENCES customers(id)
                    )
                ''')
                
                # Create delivery challan items table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS delivery_challan_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        challan_id INTEGER NOT NULL,
                        item_id INTEGER NOT NULL,
                        item_type TEXT NOT NULL,
                        item_name TEXT,
                        quantity REAL NOT NULL,
                        rate REAL,
                        amount REAL,
                        notes TEXT,
                        FOREIGN KEY (challan_id) REFERENCES delivery_challan(id) ON DELETE CASCADE
                    )
                ''')
                
                conn.commit()
                print("✅ Delivery challan tables verified")
                
        except Exception as e:
            print(f"⚠️ Error creating delivery challan tables: {e}")
    
    @staticmethod
    def get_next_number():
        """Get next delivery challan number in format: DCYYMM0001"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                today = datetime.now()
                year = today.strftime('%y')
                month = today.strftime('%m')
                prefix = f"DC{year}{month}"
                
                # Find the MAX challan number (not COUNT)
                cursor.execute("""
                    SELECT challan_no FROM delivery_challan 
                    WHERE challan_no LIKE ?
                    ORDER BY challan_no DESC LIMIT 1
                """, (f"{prefix}%",))
                
                row = cursor.fetchone()
                
                if row and row['challan_no']:
                    # Extract the last 4 digits and increment
                    last_number = row['challan_no']
                    last_seq = int(last_number[-4:])  # Get 4-digit sequence
                    next_seq = last_seq + 1
                    next_number = f"{prefix}{next_seq:04d}"
                else:
                    # First challan of the month
                    next_number = f"{prefix}0001"
                    next_seq = 1
                
                print(f"📝 Generated next number: {next_number}")
                return {'challan_no': next_number, 'next_number': next_seq}
                
        except Exception as e:
            print(f"Error getting next number: {e}")
            # Fallback: use timestamp
            fallback = f"DC{datetime.now().strftime('%y%m%d%H%M%S')}"
            return {'challan_no': fallback, 'next_number': 1}
    
    @staticmethod
    def generate_challan_no():
        """Generate unique delivery challan number"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                today = datetime.now()
                year = today.strftime('%y')
                month = today.strftime('%m')
                prefix = f"DC{year}{month}"
                
                # Get the highest number for this month
                cursor.execute("""
                    SELECT challan_no FROM delivery_challan 
                    WHERE challan_no LIKE ?
                    ORDER BY challan_no DESC LIMIT 1
                """, (f"{prefix}%",))
                
                row = cursor.fetchone()
                
                if row and row['challan_no']:
                    last_number = row['challan_no']
                    last_seq = int(last_number[-4:])
                    next_seq = last_seq + 1
                    return f"{prefix}{next_seq:04d}"
                else:
                    return f"{prefix}0001"
                
        except Exception as e:
            print(f"Error generating challan no: {e}")
            return f"DC{datetime.now().strftime('%y%m%d%H%M%S')}"
    
    @staticmethod
    def get_all():
        """Get all delivery challans with items"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT dc.*, c.name as customer_name,
                           (SELECT invoice_no FROM sales_invoice si WHERE si.challan_no = dc.challan_no LIMIT 1) as invoice_no
                    FROM delivery_challan dc
                    LEFT JOIN customers c ON dc.customer_id = c.id
                    ORDER BY dc.id DESC
                ''')
                challans = [dict_from_row(row) for row in cursor.fetchall()]
                
                # Fetch all items for these challans to avoid N+1 query loops
                if challans:
                    cursor.execute('SELECT * FROM delivery_challan_items')
                    items_rows = cursor.fetchall()
                    
                    from collections import defaultdict
                    items_by_challan = defaultdict(list)
                    for item in items_rows:
                        item_dict = dict_from_row(item)
                        items_by_challan[item_dict['challan_id']].append(item_dict)
                    
                    for dc in challans:
                        dc['items'] = items_by_challan[dc['id']]
                
                return challans
        except Exception as e:
            print(f"Error fetching challans: {e}")
            return []
    
    @staticmethod
    def get_by_id(challan_id):
        """Get delivery challan by ID with items"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Get challan header
                cursor.execute('''
                    SELECT dc.*, c.name as customer_name, c.phone as customer_phone,
                           (SELECT invoice_no FROM sales_invoice si WHERE si.challan_no = dc.challan_no LIMIT 1) as invoice_no
                    FROM delivery_challan dc
                    LEFT JOIN customers c ON dc.customer_id = c.id
                    WHERE dc.id = ?
                ''', (challan_id,))
                
                challan = cursor.fetchone()
                if challan:
                    challan_dict = dict_from_row(challan)
                    
                    # Get items
                    cursor.execute('''
                        SELECT * FROM delivery_challan_items 
                        WHERE challan_id = ?
                        ORDER BY id
                    ''', (challan_id,))
                    
                    challan_dict['items'] = [dict_from_row(row) for row in cursor.fetchall()]
                    return challan_dict
                
                return None
        except Exception as e:
            print(f"Error fetching challan {challan_id}: {e}")
            return None
    
    @staticmethod
    def create(data):
        """Create new delivery challan"""
        def _create():
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Generate challan number
                challan_no = DeliveryChallan.generate_challan_no()
                
                # Get challan_date from data or use today
                challan_date = data.get('challan_date')
                if not challan_date:
                    challan_date = datetime.now().strftime('%Y-%m-%d')
                
                # Insert challan header
                cursor.execute('''
                    INSERT INTO delivery_challan (
                        challan_no, challan_date, customer_id,
                        bill_to_address, bill_to_city, bill_to_state, bill_to_pincode, bill_to_gst,
                        ship_to_address, ship_to_city, ship_to_state, ship_to_pincode, ship_to_gst,
                        transporter_name, transporter_phone, lr_no, lr_date,
                        no_of_packages, weight, freight_charges, payment_terms,
                        reference_no, vehicle_no, transport_mode, place_of_delivery, date_of_shipment,
                        notes, status, created_by, challan_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    challan_no,
                    challan_date,
                    data.get('customer_id'),
                    data.get('bill_to_address', ''),
                    data.get('bill_to_city', ''),
                    data.get('bill_to_state', ''),
                    data.get('bill_to_pincode', ''),
                    data.get('bill_to_gst', ''),
                    data.get('ship_to_address', ''),
                    data.get('ship_to_city', ''),
                    data.get('ship_to_state', ''),
                    data.get('ship_to_pincode', ''),
                    data.get('ship_to_gst', ''),
                    data.get('transporter_name', ''),
                    data.get('transporter_phone', ''),
                    data.get('lr_no', ''),
                    data.get('lr_date', ''),
                    data.get('no_of_packages', 0),
                    data.get('weight', 0),
                    data.get('freight_charges', 0),
                    data.get('payment_terms', ''),
                    data.get('reference_no', ''),
                    data.get('vehicle_no', ''),
                    data.get('transport_mode', 'Road'),
                    data.get('place_of_delivery', ''),
                    data.get('date_of_shipment', ''),
                    data.get('notes', ''),
                    data.get('status', 'pending'),
                    1,  # created_by
                    data.get('challan_type', 'outward')
                ))
                
                challan_id = cursor.lastrowid
                challan_type = data.get('challan_type', 'outward')
                
                # Insert items
                for item in data.get('items', []):
                    quantity = float(item.get('quantity', 0))
                    rate = float(item.get('rate', 0))
                    amount = quantity * rate
                    
                    cursor.execute('''
                        INSERT INTO delivery_challan_items (
                            challan_id, item_id, item_type, item_name, quantity, rate, amount, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        challan_id,
                        item.get('item_id'),
                        item.get('item_type', 'finished_good'),
                        item.get('item_name', ''),
                        quantity,
                        rate,
                        amount,
                        item.get('notes', '')
                    ))
                    
                    # Update stock based on challan_type
                    item_type = item.get('item_type', 'finished_good')
                    table_name = 'finished_goods' if item_type == 'finished_good' else 'raw_materials'
                    
                    if challan_type == 'return':
                        cursor.execute(f'''
                            UPDATE {table_name} 
                            SET current_stock = current_stock + ?, updated_at = datetime('now')
                            WHERE id = ?
                        ''', (quantity, item.get('item_id')))
                    else:
                        cursor.execute(f'''
                            UPDATE {table_name} 
                            SET current_stock = current_stock + 0 - ?, updated_at = datetime('now')
                            WHERE id = ?
                        ''', (quantity, item.get('item_id')))
                
                # Accounting Hook for Transport Freight
                transporter_name = data.get('transporter_name', '')
                freight_charges = data.get('freight_charges', 0)
                AccountingHook.post_delivery_challan_freight(cursor, challan_no, transporter_name, freight_charges)
                
                conn.commit()
                return {'id': challan_id, 'challan_no': challan_no, 'message': 'Delivery challan created successfully'}
        
        return execute_with_retry(_create)
    
    @staticmethod
    def update(challan_id, data):
        """Update delivery challan"""
        def _update():
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Get old challan_type and challan_no
                cursor.execute('SELECT challan_no, challan_type FROM delivery_challan WHERE id = ?', (challan_id,))
                old_challan_row = cursor.fetchone()
                old_challan_type = old_challan_row['challan_type'] if old_challan_row else 'outward'
                challan_no = old_challan_row['challan_no'] if old_challan_row else None
                
                # Reverse existing freight accounting entries
                if challan_no:
                    AccountingHook.reverse_delivery_challan_freight(cursor, challan_no)
                
                # Update challan header
                cursor.execute('''
                    UPDATE delivery_challan SET
                        challan_date = ?,
                        customer_id = ?,
                        bill_to_address = ?,
                        bill_to_city = ?,
                        bill_to_state = ?,
                        bill_to_pincode = ?,
                        bill_to_gst = ?,
                        ship_to_address = ?,
                        ship_to_city = ?,
                        ship_to_state = ?,
                        ship_to_pincode = ?,
                        ship_to_gst = ?,
                        transporter_name = ?,
                        transporter_phone = ?,
                        lr_no = ?,
                        lr_date = ?,
                        no_of_packages = ?,
                        weight = ?,
                        freight_charges = ?,
                        payment_terms = ?,
                        reference_no = ?,
                        vehicle_no = ?,
                        transport_mode = ?,
                        place_of_delivery = ?,
                        date_of_shipment = ?,
                        notes = ?,
                        status = ?,
                        challan_type = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (
                    data.get('challan_date'),
                    data.get('customer_id'),
                    data.get('bill_to_address', ''),
                    data.get('bill_to_city', ''),
                    data.get('bill_to_state', ''),
                    data.get('bill_to_pincode', ''),
                    data.get('bill_to_gst', ''),
                    data.get('ship_to_address', ''),
                    data.get('ship_to_city', ''),
                    data.get('ship_to_state', ''),
                    data.get('ship_to_pincode', ''),
                    data.get('ship_to_gst', ''),
                    data.get('transporter_name', ''),
                    data.get('transporter_phone', ''),
                    data.get('lr_no', ''),
                    data.get('lr_date', ''),
                    data.get('no_of_packages', 0),
                    data.get('weight', 0),
                    data.get('freight_charges', 0),
                    data.get('payment_terms', ''),
                    data.get('reference_no', ''),
                    data.get('vehicle_no', ''),
                    data.get('transport_mode', 'Road'),
                    data.get('place_of_delivery', ''),
                    data.get('date_of_shipment', ''),
                    data.get('notes', ''),
                    data.get('status', 'pending'),
                    data.get('challan_type', 'outward'),
                    challan_id
                ))
                
                # Fetch old items and reverse their stock
                cursor.execute('SELECT item_id, quantity, item_type FROM delivery_challan_items WHERE challan_id = ?', (challan_id,))
                old_items = cursor.fetchall()
                for old_item in old_items:
                    item_type = old_item['item_type']
                    table_name = 'finished_goods' if item_type == 'finished_good' else 'raw_materials'
                    
                    if old_challan_type == 'return':
                        cursor.execute(f'''
                            UPDATE {table_name} 
                            SET current_stock = current_stock + 0 - ?, updated_at = datetime('now')
                            WHERE id = ?
                        ''', (old_item['quantity'], old_item['item_id']))
                    else:
                        cursor.execute(f'''
                            UPDATE {table_name} 
                            SET current_stock = current_stock + ?, updated_at = datetime('now')
                            WHERE id = ?
                        ''', (old_item['quantity'], old_item['item_id']))
                
                # Delete existing items
                cursor.execute('DELETE FROM delivery_challan_items WHERE challan_id = ?', (challan_id,))
                
                new_challan_type = data.get('challan_type', 'outward')
                
                # Insert updated items
                for item in data.get('items', []):
                    quantity = float(item.get('quantity', 0))
                    rate = float(item.get('rate', 0))
                    amount = quantity * rate
                    
                    cursor.execute('''
                        INSERT INTO delivery_challan_items (
                            challan_id, item_id, item_type, item_name, quantity, rate, amount, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        challan_id,
                        item.get('item_id'),
                        item.get('item_type', 'finished_good'),
                        item.get('item_name', ''),
                        quantity,
                        rate,
                        amount,
                        item.get('notes', '')
                    ))
                    
                    # Apply new stock
                    item_type = item.get('item_type', 'finished_good')
                    table_name = 'finished_goods' if item_type == 'finished_good' else 'raw_materials'
                    
                    if new_challan_type == 'return':
                        cursor.execute(f'''
                            UPDATE {table_name} 
                            SET current_stock = current_stock + ?, updated_at = datetime('now')
                            WHERE id = ?
                        ''', (quantity, item.get('item_id')))
                    else:
                        cursor.execute(f'''
                            UPDATE {table_name} 
                            SET current_stock = current_stock + 0 - ?, updated_at = datetime('now')
                            WHERE id = ?
                        ''', (quantity, item.get('item_id')))
                
                # Repost Accounting Hook for Transport Freight
                transporter_name = data.get('transporter_name', '')
                freight_charges = data.get('freight_charges', 0)
                if challan_no:
                    AccountingHook.post_delivery_challan_freight(cursor, challan_no, transporter_name, freight_charges)
                
                conn.commit()
                return {'message': 'Delivery challan updated successfully', 'id': challan_id}
        
        return execute_with_retry(_update)
    
    @staticmethod
    def update_status(challan_id, status):
        """Update delivery challan status"""
        def _update():
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE delivery_challan 
                    SET status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (status, challan_id))
                conn.commit()
                return {'message': 'Status updated successfully'}
        
        return execute_with_retry(_update)

    @staticmethod
    def delete(challan_id):
        """Delete delivery challan"""
        def _delete():
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('SELECT challan_no, challan_type FROM delivery_challan WHERE id = ?', (challan_id,))
                old_challan_row = cursor.fetchone()
                old_challan_type = old_challan_row['challan_type'] if old_challan_row else 'outward'
                challan_no = old_challan_row['challan_no'] if old_challan_row else None
                
                if challan_no:
                    AccountingHook.reverse_delivery_challan_freight(cursor, challan_no)
                
                # Fetch old items and reverse their stock before deletion
                cursor.execute('SELECT item_id, quantity, item_type FROM delivery_challan_items WHERE challan_id = ?', (challan_id,))
                old_items = cursor.fetchall()
                for old_item in old_items:
                    item_type = old_item['item_type']
                    table_name = 'finished_goods' if item_type == 'finished_good' else 'raw_materials'
                    
                    if old_challan_type == 'return':
                        cursor.execute(f'''
                            UPDATE {table_name} 
                            SET current_stock = current_stock + 0 - ?, updated_at = datetime('now')
                            WHERE id = ?
                        ''', (old_item['quantity'], old_item['item_id']))
                    else:
                        cursor.execute(f'''
                            UPDATE {table_name} 
                            SET current_stock = current_stock + ?, updated_at = datetime('now')
                            WHERE id = ?
                        ''', (old_item['quantity'], old_item['item_id']))
                
                cursor.execute('DELETE FROM delivery_challan WHERE id = ?', (challan_id,))
                conn.commit()
                return {'message': 'Delivery challan deleted successfully'}
        
        return execute_with_retry(_delete)