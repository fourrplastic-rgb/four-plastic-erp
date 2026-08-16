import sqlite3
import re

db_path = './database/manufacturing.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all delivery challans
cursor.execute("SELECT id, challan_no, notes FROM delivery_challan")
records = cursor.fetchall()

print(f"📊 Processing {len(records)} delivery challans...")
print("="*60)

total_items = 0
items_found = 0

for challan_id, challan_no, notes in records:
    # Extract items from notes
    # Pattern: "Items: 1. ITEM_NAME Qty:XXX.0 KG"
    items_match = re.search(r'Items:\s*(.+?)(?:\s*\|\s*Remarks|$)', notes)
    
    if items_match:
        items_text = items_match.group(1)
        
        # Find all items in the text
        # Matches patterns like "1. PP GRAY Qty:350.0 KG"
        item_pattern = r'\d+\.\s*([^Q]+?)\s*Qty:\s*([\d.]+)\s*KG'
        items = re.findall(item_pattern, items_text)
        
        if items:
            items_found += 1
            for item_name, quantity in items:
                item_name = item_name.strip()
                quantity = float(quantity)
                
                # Determine item_type based on name
                item_type = "finished_goods"  # default
                if "PP" in item_name or "C080MA" in item_name:
                    item_type = "raw_material"
                elif "PLASTIC" in item_name:
                    item_type = "finished_goods"
                
                # Insert into delivery_challan_items
                cursor.execute("""
                    INSERT INTO delivery_challan_items 
                    (challan_id, item_id, item_type, item_name, quantity, rate, amount, notes)
                    VALUES (?, 1, ?, ?, ?, 0, 0, ?)
                """, (challan_id, item_type, item_name, quantity, f"From challan {challan_no}"))
                
                total_items += 1
                print(f"  ✅ Challan {challan_no}: {item_name} - {quantity} KG")
        else:
            print(f"  ⚠️ Challan {challan_no}: Found items text but couldn't parse: {items_text[:50]}")
    else:
        print(f"  ❌ Challan {challan_no}: No items found in notes")

conn.commit()
print("="*60)
print(f"✅ Successfully extracted {total_items} items from {items_found} challans")

# Verify the data
print("\n📋 Verification - First 10 items:")
cursor.execute("""
    SELECT dc.challan_no, dci.item_name, dci.quantity, dci.item_type
    FROM delivery_challan_items dci
    JOIN delivery_challan dc ON dci.challan_id = dc.id
    LIMIT 10
""")
for row in cursor.fetchall():
    print(f"  Challan {row[0]}: {row[1]} - {row[2]} KG ({row[3]})")

# Count items per challan
cursor.execute("""
    SELECT dc.challan_no, COUNT(dci.id) as item_count
    FROM delivery_challan dc
    LEFT JOIN delivery_challan_items dci ON dc.id = dci.challan_id
    GROUP BY dc.id
    HAVING item_count > 0
    LIMIT 10
""")
print("\n📊 Items per challan (sample):")
for row in cursor.fetchall():
    print(f"  Challan {row[0]}: {row[1]} items")

conn.close()
