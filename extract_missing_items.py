import sqlite3
import re

db_path = './database/manufacturing.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get the 8 challans with 0 items
cursor.execute("""
    SELECT id, challan_no, notes 
    FROM delivery_challan 
    WHERE challan_no IN ('008', '012', '029', '034', '036', '041', '043', '051')
""")
records = cursor.fetchall()

print(f"Processing {len(records)} multi-item challans...")
print("="*60)

total_items = 0

for challan_id, challan_no, notes in records:
    print(f"\n📋 Challan {challan_no}:")
    
    # Extract items from notes - looking for patterns like "1. ITEM NAME Qty:XXX KG"
    # Handle multi-line items
    items_section = notes.split("Items:")[1] if "Items:" in notes else ""
    
    # Pattern to match "1. ITEM_NAME Qty:XXX KG"
    # This handles items that might be on new lines
    pattern = r'(\d+)\.\s+([^Q]+?)\s+Qty:\s+([\d.]+)\s+KG'
    matches = re.findall(pattern, items_section)
    
    for match in matches:
        item_num = match[0]
        item_name = match[1].strip()
        quantity = float(match[2])
        
        # Determine item type
        item_type = "raw_material"
        if any(x in item_name.lower() for x in ['pp', 'c080ma', '110 ma', 'ppdn']):
            item_type = "raw_material"
        else:
            item_type = "finished_goods"
        
        # Insert into delivery_challan_items
        cursor.execute("""
            INSERT INTO delivery_challan_items 
            (challan_id, item_id, item_type, item_name, quantity, rate, amount, notes)
            VALUES (?, 1, ?, ?, ?, 0, 0, ?)
        """, (challan_id, item_type, item_name, quantity, f"Item {item_num} from challan {challan_no}"))
        
        total_items += 1
        print(f"  ✅ {item_name}: {quantity} KG")
    
    # If no items found with standard pattern, try alternative
    if not matches:
        print(f"  ⚠️ No items extracted with standard pattern")
        # Try to find any "Qty:" patterns
        alt_pattern = r'([^Q]+?)\s+Qty:\s+([\d.]+)\s+KG'
        alt_matches = re.findall(alt_pattern, items_section)
        if alt_matches:
            print(f"  Found {len(alt_matches)} items with alternative pattern")
            for item_name, quantity in alt_matches:
                item_name = item_name.strip()
                # Remove leading numbers and dots
                item_name = re.sub(r'^\d+\.\s*', '', item_name)
                quantity = float(quantity)
                
                cursor.execute("""
                    INSERT INTO delivery_challan_items 
                    (challan_id, item_id, item_type, item_name, quantity, rate, amount, notes)
                    VALUES (?, 1, 'raw_material', ?, ?, 0, 0, ?)
                """, (challan_id, item_name, quantity, f"From challan {challan_no}"))
                total_items += 1
                print(f"  ✅ {item_name}: {quantity} KG")

conn.commit()
print("\n" + "="*60)
print(f"✅ Successfully extracted {total_items} items from 8 challans")

# Verify final counts
cursor.execute("SELECT COUNT(*) FROM delivery_challan_items")
final_count = cursor.fetchone()[0]
print(f"📊 Total items now in database: {final_count}")

# Show which challans still have 0 items
cursor.execute("""
    SELECT dc.challan_no, COUNT(dci.id) as item_count
    FROM delivery_challan dc
    LEFT JOIN delivery_challan_items dci ON dc.id = dci.challan_id
    GROUP BY dc.id
    HAVING item_count = 0
""")
still_missing = cursor.fetchall()
if still_missing:
    print(f"\n⚠️ Still missing items for: {[row[0] for row in still_missing]}")
else:
    print("\n🎉 All 68 challans now have items!")

# Show sample of newly added items
print("\n📋 Sample of newly added items:")
cursor.execute("""
    SELECT dc.challan_no, dci.item_name, dci.quantity
    FROM delivery_challan_items dci
    JOIN delivery_challan dc ON dci.challan_id = dc.id
    WHERE dc.challan_no IN ('008', '012', '029', '034', '036', '041', '043', '051')
    LIMIT 10
""")
for row in cursor.fetchall():
    print(f"  Challan {row[0]}: {row[1]} - {row[2]} KG")

conn.close()
