"""
Database Configuration
"""
import sqlite3
import os

# Database path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BASE_DIR, "database", "manufacturing.db")

print(f"📁 Database path: {DB_PATH}")

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys - CRITICAL for data integrity
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def get_db_connection():
    """Alias for get_db for compatibility"""
    return get_db()

def dict_from_row(row):
    """Convert row to dictionary"""
    return dict(zip(row.keys(), row)) if row else None

def init_db():
    """Initialize database (if needed)"""
    conn = get_db()
    # You can add initialization code here if needed
    conn.close()
    print("✅ Database connection successful")