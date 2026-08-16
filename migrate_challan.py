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

if len(old_data) == 0:
    print("No data to migrate!")
    exit()

# Step 2: Get or create default customer
new_cursor.execute("SELECT id FROM customers LIMIT 1")
result = new_cursor.fetchone()

if result:
    default_customer_id = result[0]
    print(f"\n📋 Using existing customer ID: {default_customer_id}")
else:
    print("\n📋 Creating default customer...")
    new_cursor.execute("INSERT INTO customers (name) VALUES ('Default Customer')")
    default_customer_id = new_cursor.lastrowid
    print(f"✅ Created default customer with ID: {default_customer_id}")

# Step 3: Insert delivery challan records
print("\n📝 Migrating delivery challan records...")
success_count = 0
error_count = 0

for row in old_data:
    old_id, challan_no, challan_date, customer_name, ship_to, item_details, remarks, total_qty = row
    
    # Prepare notes
    notes = f"Customer: {customer_name} | Items: {item_details or 'N/A'} | Remarks: {remarks or 'N/A'} | Total Qty: {total_qty or 0}"
    
    try:
        new_cursor.execute("""
            INSERT INTO delivery_challan (
                challan_no, 
                challan_date, 
                customer_id, 
                ship_to_address, 
                notes, 
                status,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
        """, (challan_no, challan_date, default_customer_id, ship_to or '', notes))
        
        success_count += 1
        if success_count % 10 == 0:
            print(f"  ✅ Migrated {success_count} records...")
            
    except Exception as e:
        error_count += 1
        print(f"  ❌ Error with challan {challan_no}: {e}")

# Commit changes
new_conn.commit()

print("\n" + "="*60)
print("MIGRATION COMPLETE")
print("="*60)
print(f"✅ Successfully migrated: {success_count} records")
print(f"❌ Errors: {error_count} records")

# Verify final count
new_cursor.execute("SELECT COUNT(*) FROM delivery_challan")
final_count = new_cursor.fetchone()[0]
print(f"📊 Total records now in manufacturing.db: {final_count}")

# Show sample data
if final_count > 0:
    print("\n📋 Sample of migrated data (first 3 records):")
    new_cursor.execute("""
        SELECT challan_no, challan_date, customer_id, ship_to_address, status 
        FROM delivery_challan 
        LIMIT 3
    """)
    for row in new_cursor.fetchall():
        print(f"  📄 Challan: {row[0]}, Date: {row[1]}, Customer ID: {row[2]}, Status: {row[4]}")

# Close connections
old_conn.close()
new_conn.close()

print("\n✨ Migration finished successfully!")
