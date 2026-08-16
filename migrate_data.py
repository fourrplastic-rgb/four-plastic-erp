import sqlite3
import os
from supabase import create_client
from dotenv import load_dotenv
import json
import sys

load_dotenv()

# Supabase connection
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

print(f"🔗 Connecting to Supabase: {SUPABASE_URL}")

# Initialize Supabase
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client initialized")
except Exception as e:
    print(f"❌ Failed to initialize Supabase: {e}")
    sys.exit(1)

# SQLite connection
sqlite_path = 'database/manufacturing.db'
if not os.path.exists(sqlite_path):
    print(f"❌ SQLite database not found at {sqlite_path}")
    sys.exit(1)

sqlite_conn = sqlite3.connect(sqlite_path)
sqlite_conn.row_factory = sqlite3.Row
sqlite_cursor = sqlite_conn.cursor()

print("="*70)
print("🚀 Starting Migration from SQLite to Supabase")
print("="*70)

# Get all tables from SQLite
sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [row['name'] for row in sqlite_cursor.fetchall()]

print(f"\n📊 Found {len(tables)} tables in SQLite:")
for table in tables:
    sqlite_cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
    count = sqlite_cursor.fetchone()['count']
    if count > 0:
        print(f"   - {table}: {count} records")

def clean_data(data):
    """Clean data for Supabase insertion"""
    cleaned = {}
    for key, value in data.items():
        if value is None:
            cleaned[key] = None
        elif isinstance(value, bytes):
            cleaned[key] = value.decode('utf-8', errors='ignore')
        elif isinstance(value, (int, float, str, bool)):
            cleaned[key] = value
        else:
            cleaned[key] = str(value)
    return cleaned

def migrate_table(table_name):
    """Migrate a single table"""
    print(f"\n📦 Migrating {table_name}...")
    
    try:
        # Get data from SQLite
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print(f"   ⚠️  No data in {table_name}")
            return 0
        
        # Convert to list of dicts
        data = []
        for row in rows:
            row_dict = dict(row)
            cleaned_row = clean_data(row_dict)
            data.append(cleaned_row)
        
        # Insert into Supabase
        total_inserted = 0
        
        try:
            # Try batch insert
            response = supabase.table(table_name).insert(data).execute()
            total_inserted = len(response.data)
            print(f"   ✅ Inserted {total_inserted} records successfully")
        except Exception as e:
            print(f"   ⚠️  Batch insert failed: {e}")
            print(f"   🔄 Trying one by one...")
            
            # Insert one by one
            for record in data:
                try:
                    response = supabase.table(table_name).insert(record).execute()
                    total_inserted += 1
                    if total_inserted % 10 == 0:
                        print(f"      Inserted {total_inserted}/{len(data)} records")
                except Exception as e2:
                    print(f"      ❌ Failed to insert record: {e2}")
                    print(f"         Record: {record}")
            
            print(f"   ✅ Inserted {total_inserted}/{len(data)} records")
        
        return total_inserted
        
    except Exception as e:
        print(f"   ❌ Error migrating {table_name}: {e}")
        return 0

def create_table_in_supabase(table_name, sample_row):
    """Create table in Supabase if it doesn't exist"""
    try:
        # Check if table exists by trying to select
        supabase.table(table_name).select('*').limit(1).execute()
        print(f"   ✅ Table {table_name} already exists")
        return True
    except:
        print(f"   ⚠️  Table {table_name} doesn't exist in Supabase")
        print(f"   📝 You need to create this table in Supabase SQL Editor first")
        return False

# Main migration
if __name__ == "__main__":
    print("\n" + "="*70)
    print("Starting migration...")
    print("="*70)
    
    total_records = 0
    tables_to_migrate = []
    
    # First, check which tables exist in Supabase
    print("\n🔍 Checking which tables exist in Supabase...")
    for table in tables:
        try:
            # Try to get a sample to check if table exists
            response = supabase.table(table).select('*').limit(1).execute()
            tables_to_migrate.append(table)
            print(f"   ✅ {table} exists in Supabase")
        except Exception as e:
            if "relation" in str(e).lower():
                print(f"   ❌ {table} does NOT exist in Supabase")
                print(f"      Please create this table in Supabase SQL Editor first")
            else:
                print(f"   ⚠️  {table}: {e}")
    
    if not tables_to_migrate:
        print("\n❌ No tables found in Supabase! Please create the tables first.")
        print("\n📝 You need to create these tables in Supabase SQL Editor:")
        for table in tables:
            print(f"   - {table}")
        sys.exit(1)
    
    print(f"\n📊 Tables to migrate: {len(tables_to_migrate)}")
    
    # Migrate each table
    for table in tables_to_migrate:
        count = migrate_table(table)
        total_records += count
    
    print("\n" + "="*70)
    print(f"✅ Migration Complete!")
    print(f"📊 Total records migrated: {total_records}")
    print("="*70)
    
    # Close connections
    sqlite_conn.close()
    print("\n✅ Database connections closed")
