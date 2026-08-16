import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from root folder
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

# Import supabase_sync
sys.path.append(os.path.join(PROJECT_ROOT, "backend"))
from supabase_sync import upload_db

print("📤 Starting initial upload of manufacturing.db to Supabase Storage...")
if upload_db():
    print("✅ Initial database uploaded successfully!")
else:
    print("❌ Failed to upload database.")
