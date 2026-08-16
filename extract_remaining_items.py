import sqlite3
import re

db_path = './database/manufacturing.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get the 8 challans with 0 items
challans_data = [
    ('008', ['PP RED', '110 MA'], [725.0, 100.0]),
    ('012', ['110 MA', 'C080MA'], [200.0, 150.0]),
    ('029', ['PP LIGHT MILKY', 'PP BLACK', 'PP RED'], [475.0, 625.0, 400.0]),
    ('034', ['PP BLACK', 'PP BLUE WHITE BASE', 'PP GREEN WHITE BASE', 'PP ORANGE WHITE BASE', 'PPDN'], [175.0, 300.0, 225.0, 300.0, 500.0]),
    ('036', ['PPDN', 'PP GREEN WHITE BASE', 'PP ORANGE WHITE BASE', 'PP BLUE WHITE BASE'], [525.0, 200.0, 100.0, 125.0]),
    ('041', ['PPCP RED', 'PPCP ORANGE', 'PPCP MILKY'], [200.0, 500.0, 425.0]),
    ('043', ['PP BLACK', 'PP MILKY'], [175.0, 75.0]),
    ('051', ['PP ORANGE WHITE BASE', 'PP MAROON', 'PP GRAY', 'PPDN'], [250.0, 250.0, 250.0, 750.0])
]

total_items = 0

for challan_no, items, quantities in challans_data:
    # Get challan_id from database
    cursor.execute("SELECT id FROM delivery_challan WHERE challan_no = ?", (challan_no,))
    result = cursor.fetchone()
    
    if result:
        challan_id = result[0]
        print(f"\n📋 Challan {challan_no}:")
        
        for item_name, quantity in zip(items, quantities):
            # Insert item
            cursor.execute("""
                INSERT INTO delivery_challan_items 
                (challan_id, item_id, item_type, item_name, quantity, rate, amount, notes)
                VALUES (?, 1, 'raw_material', ?, ?, 0, 0, ?)
            """, (challan_id, item_name, quantity, f"From challan {challan_no}"))
            
            total_items += 1
            print(f"  ✅ {item_name}: {quantity} KG")
    else:
        print(f"\n❌ Challan {challan_no} not found in database")

conn.commit()
print("\n" + "="*60)
print(f"✅ Successfully extracted {total_items} items from 8 challans")

# Verify final counts
cursor.execute("SELECT COUNT(*) FROM delivery_challan_items")
final_total = cursor.fetchone()[0]
print(f"📊 Total items now in database: {final_total}")

# Check if any challans still have 0 items
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

# Show final summary
print("\n📋 FINAL SUMMARY (first 15 challans):")
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
        items_preview = row[2][:50] + "..." if row[2] and len(row[2]) > 50 else row[2]
        print(f"  Challan {row[0]}: {row[1]} item(s) - {items_preview}")
    else:
        print(f"  Challan {row[0]}: {row[1]} items")

conn.close()
