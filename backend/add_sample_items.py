"""
Add sample items (both raw materials and finished goods)
"""
import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def add_sample_items():
    """Add sample items to database"""
    
    print("📦 Connecting to database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if raw materials already exist
    cursor.execute("SELECT COUNT(*) as count FROM raw_materials")
    raw_count = cursor.fetchone()[0]
    
    if raw_count == 0:
        # Sample raw materials
        raw_materials = [
            ('RM0001', 'Plastic Granules - HDPE', 'Raw Material', 'KG', '39269099', 18, 85, 5000, 100, 10000, 'Warehouse A'),
            ('RM0002', 'Plastic Granules - LDPE', 'Raw Material', 'KG', '39269099', 18, 75, 3000, 50, 8000, 'Warehouse A'),
            ('RM0003', 'Color Masterbatch - Black', 'Raw Material', 'KG', '32064900', 18, 250, 1000, 25, 2000, 'Warehouse B'),
            ('RM0004', 'Color Masterbatch - White', 'Raw Material', 'KG', '32064900', 18, 230, 800, 20, 1500, 'Warehouse B'),
            ('RM0005', 'UV Stabilizer', 'Raw Material', 'KG', '38123090', 18, 450, 200, 10, 500, 'Warehouse C'),
        ]
        
        for code, name, category, unit, hsn, gst, rate, stock, min_stock, max_stock, location in raw_materials:
            cursor.execute('''
                INSERT INTO raw_materials 
                (code, name, category, unit, hsn_code, gst_rate, purchase_rate, 
                 opening_stock, current_stock, min_stock, max_stock, location, is_active, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            ''', (code, name, category, unit, hsn, gst, rate, stock, stock, min_stock, max_stock, location))
        
        print(f"✅ Added {len(raw_materials)} raw materials")
    
    # Check if finished goods already exist
    cursor.execute("SELECT COUNT(*) as count FROM finished_goods")
    finished_count = cursor.fetchone()[0]
    
    if finished_count == 0:
        # Sample finished goods
        finished_goods = [
            ('FG0001', 'Plastic Chair - Premium', 'Finished Good', 'PCS', '94017900', 18, 850, 999, 100, 10, 200, 'Showroom A'),
            ('FG0002', 'Plastic Table - Large', 'Finished Good', 'PCS', '94037000', 18, 1200, 1499, 50, 5, 100, 'Showroom A'),
            ('FG0003', 'Plastic Container 5L', 'Finished Good', 'PCS', '39231090', 12, 180, 220, 500, 50, 1000, 'Showroom B'),
            ('FG0004', 'Plastic Container 10L', 'Finished Good', 'PCS', '39231090', 12, 250, 320, 300, 30, 600, 'Showroom B'),
            ('FG0005', 'Plastic Mug - Set of 6', 'Finished Good', 'BOX', '39241090', 12, 350, 450, 200, 20, 400, 'Showroom C'),
        ]
        
        for code, name, category, unit, hsn, gst, rate, mrp, stock, min_stock, max_stock, location in finished_goods:
            cursor.execute('''
                INSERT INTO finished_goods 
                (code, name, category, unit, hsn_code, gst_rate, sales_rate, mrp,
                 opening_stock, current_stock, min_stock, max_stock, location, is_active, created_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            ''', (code, name, category, unit, hsn, gst, rate, mrp, stock, stock, min_stock, max_stock, location))
        
        print(f"✅ Added {len(finished_goods)} finished goods")
    
    conn.commit()
    conn.close()
    
    print("\n📋 Summary:")
    print("-" * 40)
    print(f"Raw Materials: {raw_count if raw_count > 0 else len(raw_materials) if 'raw_materials' in locals() else 0}")
    print(f"Finished Goods: {finished_count if finished_count > 0 else len(finished_goods) if 'finished_goods' in locals() else 0}")
    print("-" * 40)

if __name__ == "__main__":
    add_sample_items()