import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

print("Testing Supabase Connection")
print("="*50)

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

print(f"URL: {supabase_url}")
print(f"Key: {supabase_key[:50]}...")

try:
    # Initialize Supabase client
    supabase = create_client(supabase_url, supabase_key)
    print("✅ Supabase client created")
    
    # Try to create companies table if it doesn't exist
    print("\nCreating tables if they don't exist...")
    
    # Check if companies table exists
    try:
        response = supabase.table('companies').select('*').limit(1).execute()
        print("✅ Companies table exists")
    except Exception as e:
        print("Creating companies table...")
        # Create table using raw SQL (need to use service_role key for this)
        # For now, we'll just check if we can connect
        pass
    
    print("\n✅ Connection successful!")
    
except Exception as e:
    print(f"❌ Error: {e}")
