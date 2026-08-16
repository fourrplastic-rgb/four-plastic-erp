import os
from dotenv import load_dotenv
from supabase import create_client
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

print("="*70)
print("Testing Supabase Connection")
print("="*70)

# Test 1: Supabase Client
print("\n1. Testing Supabase Client...")
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

print(f"URL: {supabase_url}")
print(f"Key exists: {bool(supabase_key)}")

if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created successfully")
        
        # Try to get some data
        response = supabase.table('companies').select('*').execute()
        print(f"✅ Companies found: {len(response.data) if response.data else 0}")
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("❌ Missing SUPABASE_URL or SUPABASE_KEY")

# Test 2: PostgreSQL Direct Connection
print("\n2. Testing PostgreSQL Direct Connection...")
db_url = os.getenv('SUPABASE_DB_URL')

if db_url:
    try:
        print(f"Connecting to PostgreSQL...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connected to PostgreSQL")
        print(f"   Version: {version['version'][:50]}...")
        
        cursor.close()
        conn.close()
        print("✅ Connection closed")
        
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print("❌ Missing SUPABASE_DB_URL")

print("\n" + "="*70)
print("Test Complete")
print("="*70)
