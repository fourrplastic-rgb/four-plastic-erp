import sqlite3

# Database paths
old_db = '/Users/rajeshkumarvarma/Desktop/DeliveryChallanReport.db'
new_db = './database/manufacturing.db'

print("="*60)
print("Starting Migration of Delivery Challan Data")
print("="*60)

# Connect to databases
old_conn = sqlite3.connect(old_db)
new_conn = sqlite3.connect(new_db)

old_cursor = old_conn.cursor()
new_cursor = new_conn.cursor()

# Step 1: Get data from old database
old_cursor.execute("SELECT * FROM delivery_challan")
old_data = old_cursor.fetchall()

print(f"\n📊 Found {len(old_data)} records in old database")

# Step 2: Insert customers and get their IDs
print("\n📋 Processing customers...")
customer_map = {}

for row in old_data:
    old_id, challan_no, challan_date, customer_name, ship_to, item_details, remarks, total_qty = row
    
    if customer_name and customer_name.strip():
        # Insert customer if not exists
        try:
            new_cursor.execute("""
                INSERT OR IGNORE INTO customers (name, created_at) 
                VALUES (?, datetime('now'))
            """, (customer_name,))
            
            # Get customer ID
            new_cursor.execute("SELECT id FROM customers WHERE name = ?", (customer_name,))
            result = new_cursor.fetchone()
            if result:
                customer_map[challan_no] = result[0]
        except Exception as e:
            print(f"  ⚠️ Error with customer {customer_name}: {e}")
            customer_map[challan_no] = 1  # Default customer ID

print(f"  ✅ Processed {len(customer_map)} unique customers")

# Step 3: Insert delivery challan records
print("\n📝 Migrating delivery challan records...")
success_count = 0

for row in old_data:
    old_id, challan_no, challan_date, customer_name, ship_to, item_details, remarks, total_qty = row
    
    # Get customer ID
    customer_id = customer_map.get(challan_no, 1)
    
    # Prepare notes
    notes = f"Items: {item_details or 'N/A'} | Remarks: {remarks or 'N/A'} | Total Qty: {total_qty or 0}"
    
    try:
        new_cursor.execute("""
            INSERT OR REPLACE INTO delivery_challan (
                challan_no, 
                challan_date, 
                customer_id, 
                ship_to_address, 
                notes, 
                status,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
        """, (challan_no, challan_date, customer_id, ship_to or '', notes))
        
        success_count += 1
        if success_count % 10 == 0:
            print(f"  ✅ Migrated {success_count} records...")
            
    except Exception as e:
        print(f"  ❌ Error migrating challan {challan_no}: {e}")

# Commit changes
new_conn.commit()

# Step 4: Verify
new_cursor.execute("SELECT COUNT(*) FROM delivery_challan")
final_count = new_cursor.fetchone()[0]

print("\n" + "="*60)
print("MIGRATION COMPLETE")
print("="*60)
print(f"✅ Successfully migrated: {success_count} records")
print(f"📊 Total records in manufacturing.db: {final_count}")

# Show sample data
print("\n📋 Sample data (first 5 records):")
new_cursor.execute("""
    SELECT challan_no, challan_date, customer_id, ship_to_address 
    FROM delivery_challan 
    LIMIT 5
""")
for row in new_cursor.fetchall():
    print(f"  - Challan: {row[0]}, Date: {row[1]}, Customer ID: {row[2]}")

# Close connections
old_conn.close()
new_conn.close()

print("\n✨ Migration finished successfully!")