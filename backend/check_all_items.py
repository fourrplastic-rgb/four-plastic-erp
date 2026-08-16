"""
Check All Items - Verify raw materials and finished goods in database
"""
import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_all_items():
    """Check all items in the database"""
    
    print("="*60)
    print("📦 CHECKING ALL ITEMS IN DATABASE")
    print("="*60)
    print(f"📁 Database: {DB_PATH}")
    print("-"*60)
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print("❌ Database file not found!")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check Raw Materials
    print("\n📋 RAW MATERIALS:")
    print("-" * 40)
    cursor.execute("SELECT id, code, name, unit, purchase_rate, current_stock FROM raw_materials ORDER BY id")
    raw_materials = cursor.fetchall()
    
    if raw_materials:
        for rm in raw_materials:
            print(f"   ID: {rm[0]:2d} | {rm[1]:8s} | {rm[2]:25s} | {rm[3]:3s} | ₹{rm[4]:5.2f} | Stock: {rm[5]:5.0f}")
    else:
        print("   ❌ No raw materials found!")
    
    # Check Finished Goods
    print("\n📋 FINISHED GOODS:")
    print("-" * 40)
    cursor.execute("SELECT id, code, name, unit, sales_rate, current_stock FROM finished_goods ORDER BY id")
    finished_goods = cursor.fetchall()
    
    if finished_goods:
        for fg in finished_goods:
            print(f"   ID: {fg[0]:2d} | {fg[1]:8s} | {fg[2]:25s} | {fg[3]:3s} | ₹{fg[4]:5.2f} | Stock: {fg[5]:5.0f}")
    else:
        print("   ❌ No finished goods found!")
    
    # Check specific item ID 4
    print("\n🔍 CHECKING ITEM ID 4:")
    print("-" * 40)
    
    cursor.execute("SELECT id, code, name FROM raw_materials WHERE id = 4")
    item = cursor.fetchone()
    if item:
        print(f"✅ Raw Material ID 4 exists: {item[1]} - {item[2]}")
    else:
        print("❌ Raw Material ID 4 NOT FOUND!")
        
        # Show what IDs are available
        cursor.execute("SELECT id FROM raw_materials ORDER BY id")
        ids = cursor.fetchall()
        if ids:
            available = [str(id[0]) for id in ids]
            print(f"   Available raw material IDs: {', '.join(available)}")
    
    cursor.execute("SELECT id, code, name FROM finished_goods WHERE id = 4")
    item = cursor.fetchone()
    if item:
        print(f"✅ Finished Good ID 4 exists: {item[1]} - {item[2]}")
    
    conn.close()
    
    print("\n" + "="*60)

if __name__ == "__main__":
    check_all_items()