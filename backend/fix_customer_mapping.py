import sqlite3
import re

db_path = './database/manufacturing.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all delivery challans
cursor.execute("SELECT id, challan_no, notes FROM delivery_challan")
records = cursor.fetchall()

print(f"Processing {len(records)} records...")

customer_cache = {}
updated_count = 0

for record_id, challan_no, notes in records:
    # Extract customer name from notes
    match = re.search(r'Customer:\s*([^|]+)', notes)
    if match:
        customer_name = match.group(1).strip()
        
        # Check if customer already exists in cache or database
        if customer_name not in customer_cache:
            cursor.execute("SELECT id FROM customers WHERE name = ?", (customer_name,))
            existing = cursor.fetchone()
            
            if existing:
                customer_cache[customer_name] = existing[0]
            else:
                # Create new customer
                cursor.execute("""
                    INSERT INTO customers (name, created_at) 
                    VALUES (?, datetime('now'))
                """, (customer_name,))
                customer_cache[customer_name] = cursor.lastrowid
                print(f"  Created new customer: {customer_name}")
        
        # Update delivery challan with correct customer_id
        customer_id = customer_cache[customer_name]
        if customer_id != 21:  # Only update if not default
            cursor.execute("""
                UPDATE delivery_challan 
                SET customer_id = ? 
                WHERE id = ?
            """, (customer_id, record_id))
            updated_count += 1

conn.commit()
print(f"\n✅ Updated {updated_count} records with correct customer mapping")

# Verify the changes
cursor.execute("""
    SELECT dc.challan_no, c.name as customer_name 
    FROM delivery_challan dc
    JOIN customers c ON dc.customer_id = c.id
    LIMIT 10
""")
print("\nSample of updated records:")
for row in cursor.fetchall():
    print(f"  Challan {row[0]} → Customer: {row[1]}")

conn.close()