"""
Unified Database Connection Manager
ALL database connections must go through this module
"""
import sqlite3
import time
import os
from pathlib import Path
from contextlib import contextmanager

# Try to import Flask g, but handle if not in Flask context
try:
    from flask import g
    HAS_FLASK = True
except ImportError:
    HAS_FLASK = False
    # Create a dummy g for testing
    class DummyG:
        pass
    g = DummyG()

# Single source of truth - ONE database path
# config/database.py -> backend/config/database.py
# Need to go up 3 levels to reach project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATABASE_PATH = os.path.join(PROJECT_ROOT, 'database', 'manufacturing.db')

print(f"📁 [DB Config] Using: {DATABASE_PATH}")

# Verify database exists
if not os.path.exists(DATABASE_PATH):
    print(f"❌ Database NOT found at: {DATABASE_PATH}")
    print(f"Looking for: {DATABASE_PATH}")
    print("Please make sure manufacturing.db exists")
else:
    print(f"✅ Database found")

def _get_connection(timeout=30):
    """Internal function to get a raw connection with WAL mode"""
    conn = sqlite3.connect(DATABASE_PATH, timeout=timeout)
    conn.row_factory = sqlite3.Row
    
    # Enable WAL mode for better concurrency
    cursor = conn.cursor()
    cursor.execute('PRAGMA journal_mode=WAL')
    cursor.execute('PRAGMA synchronous=NORMAL')
    cursor.execute('PRAGMA busy_timeout=30000')
    cursor.execute('PRAGMA foreign_keys = ON')
    conn.commit()
    
    return conn

def get_db():
    """Get database connection for Flask routes with retry on lock"""
    if HAS_FLASK and 'db' in g:
        try:
            # Check if the connection is still alive and open
            g.db.execute("SELECT 1")
            return g.db
        except (sqlite3.ProgrammingError, sqlite3.OperationalError):
            # Connection was closed or is invalid, remove it from g context
            g.pop('db', None)

    max_retries = 3
    for attempt in range(max_retries):
        try:
            db = _get_connection(30)
            if HAS_FLASK:
                g.db = db
            return db
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < max_retries - 1:
                print(f"⚠️ DB locked, retrying connection... ({attempt + 1}/{max_retries})")
                time.sleep(1)
            else:
                raise e

def close_db(e=None):
    """Close database connection at end of request"""
    if HAS_FLASK:
        db = g.pop('db', None)
        if db is not None:
            db.close()

@contextmanager
def get_db_connection(timeout=30):
    """Get database connection with context manager (for non-Flask use)"""
    conn = None
    try:
        conn = _get_connection(timeout)
        yield conn
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

def execute_with_retry(func, max_retries=5, retry_delay=1):
    """Execute a function with retry on database lock"""
    for attempt in range(max_retries):
        try:
            return func()
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < max_retries - 1:
                print(f"⚠️ DB locked, retrying operation... ({attempt + 1}/{max_retries})")
                time.sleep(retry_delay)
            else:
                raise

def dict_from_row(row):
    """Convert sqlite3.Row to dictionary"""
    if row is None:
        return None
    return dict(row)

# Test connection when run directly
if __name__ == "__main__":
    print("=" * 50)
    print("Testing database connection...")
    print("=" * 50)
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            print("✅ Database connection test successful")
            
            # Show some tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 5")
            tables = cursor.fetchall()
            print(f"📊 Found tables: {[t['name'] for t in tables]}")
            
            # Check foreign key status
            cursor.execute("PRAGMA foreign_keys")
            fk_status = cursor.fetchone()
            print(f"🔗 Foreign keys enabled: {fk_status[0] == 1}")
            
            # Check journal mode
            cursor.execute("PRAGMA journal_mode")
            journal_mode = cursor.fetchone()
            print(f"📝 Journal mode: {journal_mode[0]}")
            
            # Check WAL mode is active
            if journal_mode[0] == 'wal':
                print("✅ WAL mode is active - good for concurrency!")
            else:
                print(f"⚠️ WAL mode is {journal_mode[0]} - consider enabling for better performance")
            
    except Exception as e:
        print(f"❌ Connection test failed: {e}")