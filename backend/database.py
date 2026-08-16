import sqlite3
from flask import g
import os

# Use the correct database path
DATABASE = '/Users/laxmansutar/Desktop/FOUR (R) PLASTIC/database/manufacturing.db'

# Optional: Use environment variable if you want to make it configurable
# DATABASE = os.environ.get('DATABASE_PATH', '/Users/laxmansutar/Desktop/FOUR (R) PLASTIC/database/manufacturing.db')

def get_db():
    """Get database connection"""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def init_db():
    """Initialize database tables"""
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row

    # Create customers table
    db.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            pincode TEXT,
            gst TEXT,
            credit_limit REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create vendors table
    db.execute('''
        CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            pincode TEXT,
            gst TEXT,
            credit_limit REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create other tables as needed
    db.commit()
    db.close()
