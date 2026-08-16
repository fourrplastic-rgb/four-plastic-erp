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
    
    # Split notes into lines
    lines = notes.split('\n')
    
    for line in lines:
        line = line.strip()
        # Look for patterns like "1. ITEM NAME Qty:XXX KG"
        # Use simpler pattern matching
        if 'Qty:' in line and 'KG' in line:
            # Extract item name and quantity
            # Find the part after the number and dot
            parts = re.split(r'\d+\.\s+', line)
            if len(parts) > 1:
                item_part = parts[1]
                # Split at 'Qty:'
                if 'Qty:' in item_part:
                    name_part, qty_part = item_part.split('Qty:')
                    item_name = name_part.strip()
                    # Extract quantity number
                    qty_match = re.search(r'([\d.]+)\s*KG', qty_part)
                    if qty_match:
                        quantity = float(qty_match.group(1))
                        
                        # Insert into database
                        cursor.execute("""
                            INSERT INTO delivery_challan_items 
                            (challan_id, item_id, item_type, item_name, quantity, rate, amount, notes)
                            VALUES (?, 1, 'raw_material', ?, ?, 0, 0, ?)
                        """, (challan_id, item_name, quantity, f"From challan {challan_no}"))
                        
                        total_items += 1
                        print(f"  ✅ {item_name}: {quantity} KG")

conn.commit()
print("\n" + "="*60)
print(f"✅ Extracted {total_items} new items from 8 challans")

# Check final total
cursor.execute("SELECT COUNT(*) FROM delivery_challan_items")
final_total = cursor.fetchone()[0]
print(f"📊 Total items now in database: {final_total}")

# Verify no challans have 0 items
cursor.execute("""
    SELECT dc.challan_no, COUNT(dci.id) as item_count
    FROM delivery_challan dc
    LEFT JOIN delivery_challan_items dci ON dc.id = dci.challan_id
    GROUP BY dc.id
    HAVING item_count = 0
""")
still_missing = cursor.fetchall()
if not still_missing:
    print("\n🎉 ALL 68 CHALLANS NOW HAVE ITEMS! 🎉")
else:
    print(f"\n⚠️ Still missing: {[row[0] for row in still_missing]}")

# Show summary of all items
print("\n📋 Final summary (first 15 challans):")
cursor.execute("""
    SELECT 
        dc.challan_no,
        COUNT(dci.id) as item_count,
        GROUP_CONCAT(dci.item_name, ', ') as items
    FROM delivery_challan dc
    LEFT JOIN delivery_challan_items dci ON dc.id = dci.challan_id
    GROUP BY dc.id
    ORDER BY CAST(dc.challan_no AS INTEGER)
    LIMIT 15
""")
for row in cursor.fetchall():
    if row[1] > 0:
        print(f"  Challan {row[0]}: {row[1]} items - {row[2][:50]}...")
    else:
        print(f"  Challan {row[0]}: {row[1]} items")

conn.close()
