"""
Add sample bank data to database
"""
import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def add_sample_banks():
    """Add sample banks to database"""
    
    print("📦 Connecting to database...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if banks already exist
    cursor.execute("SELECT COUNT(*) as count FROM banks")
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"✅ Database already has {count} banks")
        conn.close()
        return
    
    # Sample banks
    sample_banks = [
        ('BNK0001', 'HDFC Bank', '1234567890', 'HDFC0001234', 'Mumbai', 100000),
        ('BNK0002', 'SBI Bank', '0987654321', 'SBIN0001234', 'Delhi', 250000),
        ('BNK0003', 'ICICI Bank', '1122334455', 'ICIC0001234', 'Pune', 150000),
        ('BNK0004', 'Axis Bank', '5566778899', 'UTIB0001234', 'Bangalore', 75000),
        ('BNK0005', 'Kotak Bank', '9988776655', 'KKBK0001234', 'Chennai', 50000),
    ]
    
    for code, name, account_no, ifsc, branch, balance in sample_banks:
        cursor.execute('''
            INSERT INTO banks 
            (code, name, account_no, ifsc_code, branch, opening_balance, current_balance, is_active, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
        ''', (code, name, account_no, ifsc, branch, balance, balance))
    
    conn.commit()
    conn.close()
    
    print("✅ Sample banks added successfully!")
    print("\n📋 Bank List:")
    print("-" * 80)
    print(f"{'Code':<10} {'Name':<20} {'Account No':<15} {'IFSC':<15} {'Branch':<15} {'Balance':<10}")
    print("-" * 80)
    for code, name, account_no, ifsc, branch, balance in sample_banks:
        print(f"{code:<10} {name:<20} {account_no:<15} {ifsc:<15} {branch:<15} ₹{balance:<10,}")

if __name__ == "__main__":
    add_sample_banks()