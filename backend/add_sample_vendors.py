"""
Add sample vendor data to database
"""
import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def add_sample_vendors():
    """Add sample vendors to database"""
    
    print("📦 Connecting to database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if vendors already exist
    cursor.execute("SELECT COUNT(*) as count FROM vendors")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"✅ Database already has {count} vendors")
        conn.close()
        return
    
    # Sample vendors
    sample_vendors = [
        ('VEN0001', 'Raw Materials Ltd', '9876543220', 'Mumbai', '27ABCDE1234F1Z5'),
        ('VEN0002', 'Packaging Solutions', '9876543221', 'Delhi', '07ABCDE1234F1Z5'),
        ('VEN0003', 'Chemical Suppliers', '9876543222', 'Pune', '27ABCDE1234F1Z6'),
        ('VEN0004', 'Transport Services', '9876543223', 'Bangalore', '29ABCDE1234F1Z7'),
        ('VEN0005', 'Tools & Equipment Co', '9876543224', 'Chennai', '33ABCDE1234F1Z8'),
    ]
    
    for code, name, phone, city, gst in sample_vendors:
        cursor.execute('''
            INSERT INTO vendors 
            (code, name, phone, city, gst, is_active, opening_balance, current_balance) 
            VALUES (?, ?, ?, ?, ?, 1, 0, 0)
        ''', (code, name, phone, city, gst))
    
    conn.commit()
    conn.close()
    
    print("✅ Sample vendors added successfully!")
    print("\n📋 Vendor List:")
    print("-" * 60)
    print(f"{'Code':<10} {'Name':<20} {'Phone':<12} {'City':<12} {'GST':<15}")
    print("-" * 60)
    for code, name, phone, city, gst in sample_vendors:
        print(f"{code:<10} {name:<20} {phone:<12} {city:<12} {gst:<15}")

if __name__ == "__main__":
    add_sample_vendors()