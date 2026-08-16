"""
Add sample raw material data to database
"""
import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def add_sample_raw_materials():
    """Add sample raw materials to database"""
    
    print("📦 Connecting to database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if raw materials already exist
    cursor.execute("SELECT COUNT(*) as count FROM raw_materials")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"✅ Database already has {count} raw materials")
        conn.close()
        return
    
    # Sample raw materials
    sample_materials = [
        ('RM0001', 'Plastic Granules - HDPE', 'KG', '39269099', 18, 85, 5000, 100, 10000, 'Warehouse A'),
        ('RM0002', 'Plastic Granules - LDPE', 'KG', '39269099', 18, 75, 3000, 50, 8000, 'Warehouse A'),
        ('RM0003', 'Color Masterbatch - Black', 'KG', '32064900', 18, 250, 1000, 25, 2000, 'Warehouse B'),
        ('RM0004', 'Color Masterbatch - White', 'KG', '32064900', 18, 230, 800, 20, 1500, 'Warehouse B'),
        ('RM0005', 'UV Stabilizer', 'KG', '38123090', 18, 450, 200, 10, 500, 'Warehouse C'),
        ('RM0006', 'Packaging Bags - Small', 'PCS', '39232100', 12, 5, 50000, 1000, 100000, 'Warehouse D'),
        ('RM0007', 'Packaging Bags - Large', 'PCS', '39232100', 12, 8, 30000, 500, 50000, 'Warehouse D'),
    ]
    
    for code, name, unit, hsn, gst, rate, stock, min_stock, max_stock, location in sample_materials:
        cursor.execute('''
            INSERT INTO raw_materials 
            (code, name, category, unit, hsn_code, gst_rate, purchase_rate, 
             opening_stock, current_stock, min_stock, max_stock, location, is_active, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
        ''', (code, name, 'Raw Material', unit, hsn, gst, rate, stock, stock, min_stock, max_stock, location))
    
    conn.commit()
    conn.close()
    
    print("✅ Sample raw materials added successfully!")
    print("\n📋 Raw Materials List:")
    print("-" * 100)
    print(f"{'Code':<8} {'Name':<25} {'Unit':<6} {'HSN':<12} {'GST':<5} {'Rate':<8} {'Stock':<8} {'Location':<12}")
    print("-" * 100)
    for code, name, unit, hsn, gst, rate, stock, min_stock, max_stock, location in sample_materials:
        print(f"{code:<8} {name[:24]:<25} {unit:<6} {hsn:<12} {gst:<5} ₹{rate:<7} {stock:<8} {location:<12}")

if __name__ == "__main__":
    add_sample_raw_materials()