import sqlite3
import uuid
from supabase import create_client

# 🔐 SUPABASE CONFIG
SUPABASE_URL = "https://hlvgoalahxqxnzdjjypt.supabase.co"
SUPABASE_KEY = "sb_secret_YOUR_NEW_KEY"   # ⚠️ replace after regenerate

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 📂 SQLITE DB PATH
SQLITE_DB_PATH = "database/manufacturing.db"

# 🧹 CLEAN DATA FUNCTION
def clean_data(data):
    cleaned = {}

    for key, value in data.items():
        if key == "id":
            # 🔥 convert integer ID → UUID
            cleaned[key] = str(uuid.uuid4())

        elif value is None:
            cleaned[key] = None

        elif isinstance(value, bytes):
            cleaned[key] = value.decode("utf-8", errors="ignore")

        elif isinstance(value, (int, float, str, bool)):
            cleaned[key] = value

        else:
            cleaned[key] = str(value)

    return cleaned


# 📥 FETCH DATA FROM SQLITE
def fetch_table_data(conn, table_name):
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")

    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()

    data = []
    for row in rows:
        record = dict(zip(columns, row))
        data.append(clean_data(record))

    return data


# 🚀 MIGRATE FUNCTION
def migrate_table(conn, table_name):
    print(f"\n🔄 Migrating: {table_name}")

    try:
        data = fetch_table_data(conn, table_name)

        if not data:
            print(f"⚠️ No data in {table_name}")
            return

        # 🔥 Insert in batches (avoid errors)
        batch_size = 100

        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]

            response = supabase.table(table_name).insert(batch).execute()

        print(f"✅ Done: {table_name} ({len(data)} records)")

    except Exception as e:
        print(f"❌ Error in {table_name}: {e}")


# 📋 TABLE LIST (IMPORTANT)
TABLES = [
    "customers",
    "vendors",
    "users",
    "companies",
    "ledgers",
    "ledger_groups",
    "journal_entries",
    "journal_vouchers",
    "sales_invoice",
    "sales_invoice_items",
    "finished_goods",
    "raw_materials",
    "customer_payments",
    "vendor_payments",
    "user_companies"
]


# 🏁 MAIN
def main():
    print("🚀 Starting Migration...")

    conn = sqlite3.connect(SQLITE_DB_PATH)

    for table in TABLES:
        migrate_table(conn, table)

    conn.close()

    print("\n🎉 Migration Completed!")


if __name__ == "__main__":
    main()
