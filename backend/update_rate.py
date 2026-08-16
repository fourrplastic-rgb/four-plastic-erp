"""
Update raw material rate
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def update_rate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE raw_materials 
        SET purchase_rate = 70 
        WHERE id = 4
    ''')
    
    conn.commit()
    
    cursor.execute("SELECT id, code, name, purchase_rate FROM raw_materials WHERE id = 4")
    item = cursor.fetchone()
    print(f"✅ Updated: {item[1]} - {item[2]} - Rate: ₹{item[3]}")
    
    conn.close()

if __name__ == "__main__":
    update_rate()