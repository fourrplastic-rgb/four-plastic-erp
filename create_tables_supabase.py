import sqlite3
import sys

# Connect to SQLite
sqlite_conn = sqlite3.connect('database/manufacturing.db')
sqlite_conn.row_factory = sqlite3.Row
sqlite_cursor = sqlite_conn.cursor()

# Get all tables
sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [row['name'] for row in sqlite_cursor.fetchall()]

# Generate CREATE TABLE statements
print("-- SQL statements to create tables in Supabase")
print("-- Copy and paste this in Supabase SQL Editor\n")

for table in tables:
    print(f"-- Table: {table}")
    
    # Get schema
    sqlite_cursor.execute(f"PRAGMA table_info({table})")
    columns = sqlite_cursor.fetchall()
    
    # Build CREATE TABLE statement
    col_defs = []
    for col in columns:
        col_name = col['name']
        col_type = col['type']
        
        # Convert SQLite types to PostgreSQL
        if 'INT' in col_type.upper():
            pg_type = 'BIGINT'
        elif 'REAL' in col_type.upper() or 'FLOAT' in col_type.upper():
            pg_type = 'REAL'
        elif 'TEXT' in col_type.upper():
            pg_type = 'TEXT'
        elif 'TIMESTAMP' in col_type.upper():
            pg_type = 'TIMESTAMP'
        else:
            pg_type = 'TEXT'
        
        col_def = f"    {col_name} {pg_type}"
        
        if col['notnull']:
            col_def += " NOT NULL"
        if col['pk']:
            col_def += " PRIMARY KEY"
        
        col_defs.append(col_def)
    
    create_sql = f"CREATE TABLE IF NOT EXISTS {table} (\n" + ",\n".join(col_defs) + "\n);"
    print(create_sql)
    print()

sqlite_conn.close()
