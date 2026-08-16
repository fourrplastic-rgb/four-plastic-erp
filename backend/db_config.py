import os
from pathlib import Path

# Get the absolute path to the database
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = os.path.join(BASE_DIR, 'database', 'manufacturing.db')

# Also try the direct path as fallback
ALT_DB_PATH = r'H:\NEW MFG\FOUR (R) PLASTIC\database\manufacturing.db'

# Use whichever path exists
if os.path.exists(ALT_DB_PATH):
    DB_PATH = ALT_DB_PATH
    print(f"✅ Using absolute database path: {DB_PATH}")
elif os.path.exists(DB_PATH):
    print(f"✅ Using relative database path: {DB_PATH}")
else:
    print(f"❌ Database not found at: {DB_PATH}")
    print(f"❌ Also checked: {ALT_DB_PATH}")

print("=" * 60)