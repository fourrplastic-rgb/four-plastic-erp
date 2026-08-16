import os
import sqlite3
import time
from pathlib import Path
from contextlib import contextmanager
from flask import g

# Get the project root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Use ONLY the manufacturing database
DB_PATH = os.path.join(PROJECT_ROOT, 'database', 'manufacturing.db')

print(f"📁 Database path: {DB_PATH}")

# Verify the database exists
if os.path.exists(DB_PATH):
    print(f"✅ Database found at: {DB_PATH}")
else:
    print(f"❌ Database NOT found at: {DB_PATH}")
    print("Please make sure manufacturing.db exists in the database folder")
    print(f"Looking for: {DB_PATH}")

print("=" * 60)

def get_db():
    """Get database connection for Flask routes"""
    if 'db' not in g:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                g.db = sqlite3.connect(DB_PATH, timeout=30)
                g.db.row_factory = sqlite3.Row
                
                # Enable WAL mode for better concurrent access
                cursor = g.db.cursor()
                cursor.execute('PRAGMA journal_mode=WAL')
                cursor.execute('PRAGMA synchronous=NORMAL')
                cursor.execute('PRAGMA busy_timeout=30000')
                g.db.commit()
                break
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e) and attempt < max_retries - 1:
                    print(f"⚠️ Database locked, retrying connection... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(1)
                else:
                    raise e
    return g.db

def get_connection(timeout=30):
    """Get a direct database connection (for non-Flask use)"""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=timeout)
        conn.row_factory = sqlite3.Row
        
        # Enable WAL mode for better concurrent access
        cursor = conn.cursor()
        cursor.execute('PRAGMA journal_mode=WAL')
        cursor.execute('PRAGMA synchronous=NORMAL')
        cursor.execute('PRAGMA busy_timeout=30000')
        conn.commit()
        
        return conn
    except sqlite3.OperationalError as e:
        if "database is locked" in str(e):
            print(f"⚠️ Database locked, waiting...")
            time.sleep(1)
            return get_connection(timeout)
        else:
            raise e

@contextmanager
def get_db_connection(timeout=30):
    """Get database connection with context manager"""
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH, timeout=timeout)
        conn.row_factory = sqlite3.Row
        
        # Enable WAL mode
        cursor = conn.cursor()
        cursor.execute('PRAGMA journal_mode=WAL')
        cursor.execute('PRAGMA synchronous=NORMAL')
        cursor.execute('PRAGMA busy_timeout=30000')
        conn.commit()
        
        yield conn
        conn.commit()
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Database error: {e}")
        raise e
    finally:
        if conn:
            conn.close()

def execute_with_retry(func, max_retries=3, retry_delay=1):
    """Execute a function with retry on database lock"""
    for attempt in range(max_retries):
        try:
            return func()
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < max_retries - 1:
                print(f"⚠️ Database locked, retrying... (attempt {attempt + 1}/{max_retries})")
                time.sleep(retry_delay)
            else:
                raise

def init_db():
    """Initialize database with WAL mode"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Ensure WAL mode is enabled
            cursor.execute('PRAGMA journal_mode=WAL')
            result = cursor.fetchone()
            print(f"✅ Journal mode set to: {result[0]}")
            
            cursor.execute('PRAGMA synchronous=NORMAL')
            print("✅ Synchronous mode set to NORMAL")
            
            cursor.execute('PRAGMA busy_timeout=30000')
            print("✅ Busy timeout set to 30 seconds")
            
            conn.commit()
            print("✅ Database initialized successfully")
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

# Test the connection when this file is run directly
if __name__ == "__main__":
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            print("✅ Database connection test successful")
            
            # Show some database info
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 5")
            tables = cursor.fetchall()
            if tables:
                print(f"📊 Found {len(tables)} tables (showing first 5):")
                for table in tables:
                    print(f"   - {table['name']}")
            
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")