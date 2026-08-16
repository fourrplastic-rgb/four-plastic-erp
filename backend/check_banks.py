# backend/check_banks.py
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def check_banks():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("="*60)
    print("🏦 CHECKING BANKS TABLE")
    print("="*60)
    
    cursor.execute("SELECT * FROM banks")
    banks = cursor.fetchall()
    
    if banks:
        print(f"\n✅ Found {len(banks)} banks:")
        print("-" * 60)
        for bank in banks:
            print(f"ID: {bank[0]}, Code: {bank[1]}, Name: {bank[2]}")
    else:
        print("\n❌ No banks found! You need to add banks first.")
    
    conn.close()

if __name__ == "__main__":
    check_banks()