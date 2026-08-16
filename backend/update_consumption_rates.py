import sqlite3

DB_PATH = '/Users/rajeshkumarvarma/Desktop/FOUR_ (R)_PLASTIC/database/manufacturing.db'

def update_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    columns = [
        ("rate", "REAL DEFAULT 0"),
        ("total_cost", "REAL DEFAULT 0")
    ]
    
    for col_name, col_type in columns:
        try:
            cursor.execute(f"ALTER TABLE production_consumption ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column" not in str(e).lower():
                print(e)
                
    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_db()
