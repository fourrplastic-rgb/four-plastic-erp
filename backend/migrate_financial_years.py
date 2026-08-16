import sqlite3
import os
import sys

# Connect to database via relative path (backend/database/manufacturing.db)
db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'database')
if not os.path.exists(db_dir):
    print(f"Warning: Database directory {db_dir} not found. Updating path...")
    db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database')

DB_PATH = os.path.join(db_dir, 'manufacturing.db')

def migrate_financial_years():
    print(f"📁 Connecting to database at {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        sys.exit(1)
        
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("🔨 Creating financial_years table if not exists...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS financial_years (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                is_active INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Use INSERT OR IGNORE to add any missing years
        print("🌱 Inserting default financial years...")
        years = [
            ('2021-2022', '2021-04-01', '2022-03-31', 0),
            ('2022-2023', '2022-04-01', '2023-03-31', 0),
            ('2023-2024', '2023-04-01', '2024-03-31', 0),
            ('2024-2025', '2024-04-01', '2025-03-31', 1),
            ('2025-2026', '2025-04-01', '2026-03-31', 0),
            ('2026-2027', '2026-04-01', '2027-03-31', 0),
            ('2027-2028', '2027-04-01', '2028-03-31', 0),
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO financial_years (name, start_date, end_date, is_active)
            VALUES (?, ?, ?, ?)
        ''', years)
        print("✅ Default financial years inserted/verified.")
            
        conn.commit()
        print("🎉 Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == '__main__':
    migrate_financial_years()
