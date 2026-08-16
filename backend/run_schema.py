"""
Run SQL schema file using Python's sqlite3 module
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "clean_schema.sql")  # Changed to clean_schema.sql

def run_schema():
    print("="*60)
    print("🚀 Running database schema")
    print("="*60)
    print(f"📁 Database: {DB_PATH}")
    print(f"📁 Schema: {SCHEMA_PATH}")
    print("-"*60)
    
    # Check if schema file exists
    if not os.path.exists(SCHEMA_PATH):
        print(f"❌ Schema file not found: {SCHEMA_PATH}")
        return
    
    # Read schema file with UTF-8 encoding
    try:
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            schema = f.read()
        print("✅ Schema file read successfully")
    except Exception as e:
        print(f"❌ Error reading schema file: {e}")
        return
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    print("✅ Foreign keys enabled")
    
    # Execute schema
    try:
        cursor.executescript(schema)
        print("✅ Schema executed successfully")
    except Exception as e:
        print(f"❌ Error executing schema: {e}")
        conn.rollback()
        conn.close()
        return
    
    conn.commit()
    
    # Verify raw materials
    cursor.execute("SELECT COUNT(*) FROM raw_materials")
    rm_count = cursor.fetchone()[0]
    print(f"✅ Raw materials in database: {rm_count}")
    
    # Check specifically for ID 4
    cursor.execute("SELECT id, code, name FROM raw_materials WHERE id = 4")
    item = cursor.fetchone()
    if item:
        print(f"✅ Raw Material ID 4 exists: {item[1]} - {item[2]}")
    else:
        print("❌ Raw Material ID 4 STILL MISSING!")
    
    conn.close()
    
    print("="*60)
    print("🎉 Database setup complete!")
    print("="*60)

if __name__ == "__main__":
    run_schema()