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
    
    # Extract the Items section (everything after "Items:" until "| Remarks")
    items_match = re.search(r'Items:\s*(.*?)(?:\| Remarks|\n|$)', notes, re.DOTALL)
    if not items_match:
        print(f"  ❌ Could not find Items section")
        continue
    
    items_text = items_match.group(1)
    
    # Split by newlines and process each line
    lines = items_text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Pattern for items with number at beginning: "1. ITEM NAME Qty:XXX KG"
        match = re.match(r'(\d+)\.\s+([^Q]+?)\s+Qty:\s+([\d.]+)\s+KG', line)
        if match:
            item_num = match.group(1)
            item_name = match.group(2).strip()
            quantity = float(match.group(3))
            
            # Insert into database
            cursor.execute("""
                INSERT INTO delivery_challan_items 
                (challan_id, item_id, item_type, item_name, quantity, rate, amount, notes)
                VALUES (?, 1, 'raw_material', ?, ?, 0, 0, ?)
            """, (challan_id, item_name, quantity, f"Item {item_num} from challan {challan_no}"))
            
            total_items += 1
            print(f"  ✅ {item_name}: {quantity} KG")
        else:
            # Try alternative pattern without item number
            alt_match = re.match(r'([^Q]+?)\s+Qty:\s+([\d.]+)\s+KG', line)
            if alt_match:
                item_name = alt_match.group(1).strip()
                quantity = float(alt_match.group(2))
                
                cursor.execute("""
                    INSERT INTO delivery_challan_items 
                    (challan_id, item_id, item_type, item_name, quantity, rate, amount, notes)
                    VALUES (?, 1, 'raw_material', ?, ?, 0, 0, ?)
                """, (challan_id, item_name, quantity, f"From challan {challan_no}"))
                
                total_items += 1
                print(f"  ✅ {item_name}: {quantity} KG")
            else:
                print(f"  ⚠️ Could not parse: {line[:50]}")

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
print("\n📋 Newly added items (sample):")
cursor.execute("""
    SELECT dc.challan_no, dci.item_name, dci.quantity
    FROM delivery_challan_items dci
    JOIN delivery_challan dc ON dci.challan_id = dc.id
    WHERE dc.challan_no IN ('008', '012', '029', '034', '036', '041', '043', '051')
    ORDER BY dc.challan_no
    LIMIT 15
""")
for row in cursor.fetchall():
    print(f"  Challan {row[0]}: {row[1]} - {row[2]} KG")

conn.close()
