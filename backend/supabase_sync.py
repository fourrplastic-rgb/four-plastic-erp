import os
import time
from pathlib import Path
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = os.path.join(PROJECT_ROOT, "database", "manufacturing.db")
BUCKET_NAME = "erp-backups"
FILE_NAME = "manufacturing.db"

_supabase_client = None

def get_supabase():
    global _supabase_client
    if _supabase_client is None and SUPABASE_URL and SUPABASE_SERVICE_KEY:
        try:
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        except Exception as e:
            print(f"⚠️ Failed to initialize Supabase client: {e}")
    return _supabase_client

def download_db():
    """Downloads the manufacturing.db from Supabase Storage on startup"""
    client = get_supabase()
    if not client:
        print("⚠️ Supabase credentials not found. Skipping DB download.")
        return False

    # Ensure database folder exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    try:
        # Check if bucket exists, create if not
        try:
            client.storage.get_bucket(BUCKET_NAME)
        except Exception:
            print(f"📦 Creating storage bucket: {BUCKET_NAME}")
            client.storage.create_bucket(BUCKET_NAME, options={"public": False})

        print(f"📥 Downloading database from cloud storage...")
        response = client.storage.from_(BUCKET_NAME).download(FILE_NAME)
        
        # Write response content to DB_PATH
        with open(DB_PATH, "wb") as f:
            f.write(response)
        
        print("✅ Database successfully restored from Supabase Cloud!")
        return True
    except Exception as e:
        print(f"ℹ️ Cloud database not found or failed to download (this is normal on first deploy): {e}")
        return False

def upload_db():
    """Uploads the manufacturing.db to Supabase Storage after edits"""
    client = get_supabase()
    if not client:
        return False

    if not os.path.exists(DB_PATH):
        print(f"⚠️ Local database not found at {DB_PATH}. Cannot upload.")
        return False

    try:
        print(f"📤 Uploading database to cloud storage...")
        # Upload with overwrite option enabled (upsert=True)
        with open(DB_PATH, "rb") as f:
            client.storage.from_(BUCKET_NAME).upload(
                path=FILE_NAME,
                file=f,
                file_options={"cache-control": "3600", "upsert": "true"}
            )
        print("✅ Cloud database successfully updated!")
        return True
    except Exception as e:
        print(f"❌ Failed to upload database to Supabase storage: {e}")
        return False

import threading

def upload_db_async():
    """Uploads the manufacturing.db to Supabase in a background thread to prevent blocking requests"""
    thread = threading.Thread(target=upload_db)
    thread.daemon = True
    thread.start()
