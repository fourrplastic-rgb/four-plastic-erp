import sqlite3
import re

db_path = './database/manufacturing.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all delivery challans
cursor.execute("SELECT id, challan_no, notes FROM delivery_challan")
records = cursor.fetchall()

print(f"Processing {len(records)} challans...")

total_items = 0

for challan_id, challan_no, notes in records:
    # Extract customer and items from notes
    # Example: "Customer: LALIT BHAI SAFED PUL | Items: 1. PP GRAY Qty:350.0 KG | Remarks: N/A | Total Qty: 350.0"
    
    # Find the Items section
    items_start = notes.find("Items:")
    if items_start == -1:
        continue
    
    items_section = notes[items_start:]
    items_end = items_section.find("|")
    if items_end != -1:
        items_section = items_section[:items_end]
    
    # Extract individual items
    # Look for patterns like "1. ITEM_NAME Qty:123.45 KG"
    pattern = r'(\d+)\.\s+([^Q]+)\s+Qty:\s+([\d.]+)\s+KG'
    matches = re.findall(pattern, items_section)
    
    for match in matches:
        item_num = match[0]
        item_name = match[1].strip()
        quantity = float(match[2])
        
        # Determine item type
        item_type = "finished_goods"
        if any(x in item_name.lower() for x in ['pp', 'raw', 'material']):
            item_type = "raw_material"
        
        # Insert into database
        cursor.execute("""
            INSERT INTO delivery_challan_items 
            (challan_id, item_id, item_type, item_name, quantity, rate, amount, notes)
            VALUES (?, 1, ?, ?, ?, 0, 0, ?)
        """, (challan_id, item_type, item_name, quantity, f"Item {item_num} from challan {challan_no}"))
        
        total_items += 1
        print(f"Challan {challan_no}: {item_name} - {quantity} KG")

conn.commit()
print(f"\n✅ Extracted {total_items} items total")

# Verify
cursor.execute("SELECT COUNT(*) FROM delivery_challan_items")
count = cursor.fetchone()[0]
print(f"Total items in database: {count}")

conn.close()
