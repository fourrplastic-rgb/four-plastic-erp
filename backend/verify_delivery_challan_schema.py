"""
Verify delivery challan table schema matches the model
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "manufacturing.db")

def verify_schema():
    print("="*60)
    print("🔍 VERIFYING DELIVERY CHALLAN TABLE SCHEMA")
    print("="*60)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all columns
    cursor.execute("PRAGMA table_info(delivery_challan)")
    columns = cursor.fetchall()
    
    print(f"\n📋 Columns in delivery_challan table ({len(columns)}):")
    print("-" * 40)
    for col in columns:
        print(f"  {col[1]:<25} {col[2]:<10}")
    
    # Required columns from the model's INSERT statement
    required_columns = [
        "challan_no", "challan_date", "customer_id",
        "bill_to_address", "bill_to_city", "bill_to_state", "bill_to_pincode", "bill_to_gst",
        "ship_to_address", "ship_to_city", "ship_to_state", "ship_to_pincode", "ship_to_gst",
        "transporter_name", "transporter_phone", "lr_no", "lr_date",
        "no_of_packages", "weight", "freight_charges", "payment_terms",
        "reference_no", "vehicle_no", "transport_mode",
        "place_of_delivery", "date_of_shipment", "notes",
        "status", "created_by"
    ]
    
    existing_columns = [col[1] for col in columns]
    
    print("\n🔍 Checking required columns:")
    print("-" * 40)
    missing = []
    for col in required_columns:
        if col in existing_columns:
            print(f"✅ {col}")
        else:
            print(f"❌ {col} - MISSING")
            missing.append(col)
    
    if missing:
        print(f"\n❌ Missing {len(missing)} columns. Run migration to add them.")
    else:
        print("\n✅ All required columns exist!")
    
    conn.close()

if __name__ == "__main__":
    verify_schema()