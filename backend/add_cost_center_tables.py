import sqlite3
import traceback
import os

DB_PATH = 'database/manufacturing.db'

def create_cost_center_tables():
    print(f"Connecting to {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Create cost_centers table
        print("Creating cost_centers table...")
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS cost_centers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            hourly_rate REAL DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        )
        ''')
        
        # Add new columns to production_entries
        columns_to_add = [
            ("cost_center_id", "INTEGER"),
            ("total_material_cost", "REAL DEFAULT 0"),
            ("total_overhead_cost", "REAL DEFAULT 0"),
            ("actual_cost", "REAL DEFAULT 0"),
            ("per_unit_cost", "REAL DEFAULT 0")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                cursor.execute(f"ALTER TABLE production_entries ADD COLUMN {col_name} {col_type}")
                print(f"Added column {col_name} to production_entries")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    print(f"Column {col_name} already exists")
                else:
                    raise e
                    
        conn.commit()
        print("✅ Database updated successfully")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    create_cost_center_tables()
