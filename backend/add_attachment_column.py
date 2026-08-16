import sqlite3
import os

# Database path (matching app.py path)
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'manufacturing.db')
print(f"📁 Database file: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE sales_invoice ADD COLUMN attachment_path TEXT;")
    print("✅ Successfully added 'attachment_path' to sales_invoice table")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("ℹ️ Column 'attachment_path' already exists in sales_invoice table")
    else:
        print(f"❌ Error altering sales_invoice table: {e}")

try:
    cursor.execute("ALTER TABLE purchase_invoice ADD COLUMN attachment_path TEXT;")
    print("✅ Successfully added 'attachment_path' to purchase_invoice table")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("ℹ️ Column 'attachment_path' already exists in purchase_invoice table")
    else:
        print(f"❌ Error altering purchase_invoice table: {e}")

conn.commit()
conn.close()
print("🎉 Migration completed.")
