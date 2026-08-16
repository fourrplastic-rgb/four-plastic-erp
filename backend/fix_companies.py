import sqlite3
import os
import time

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'manufacturing.db')

for attempt in range(10):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if company 1 exists
        cursor.execute("SELECT id FROM companies WHERE id = 1")
        if not cursor.fetchone():
            print("Company 1 missing, inserting...")
            cursor.execute("INSERT INTO companies (id, name, address, gst_no) VALUES (1, 'FOUR PLASTIC', 'Default Address', 'DEFAULT-GST')")
            conn.commit()
            print("Company 1 added successfully!")
        else:
            print("Company 1 exists!")
            
        conn.close()
        break
    except sqlite3.OperationalError as e:
        print(f"Locked: {str(e)}... retrying")
        time.sleep(1)
