import sqlite3

print("=" * 60)
print("🔍 CHECKING JAMUNA IN DATABASE")
print("=" * 60)

db_path = r"H:\NEW MFG\FOUR (R) PLASTIC\database\manufacturing.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if Jamuna exists in employees table
cursor.execute("SELECT id, first_name, last_name, employee_code FROM employees WHERE first_name = 'JAMUNA'")
jamuna = cursor.fetchone()

if jamuna:
    jamuna_id = jamuna[0]
    print(f"✅ JAMUNA found in employees table:")
    print(f"   ID: {jamuna_id}")
    print(f"   Name: {jamuna[1]} {jamuna[2]}")
    print(f"   Code: {jamuna[3]}")
    
    # Check if Jamuna has any payouts
    cursor.execute("SELECT COUNT(*) FROM payouts WHERE employee_id = ?", (jamuna_id,))
    payout_count = cursor.fetchone()[0]
    print(f"\n💰 Payout records: {payout_count}")
    
    if payout_count > 0:
        cursor.execute("SELECT id, month, net_salary, status FROM payouts WHERE employee_id = ?", (jamuna_id,))
        for payout in cursor.fetchall():
            print(f"   - Payout #{payout[0]}: Month {payout[1]}, Net ₹{payout[2]}, Status: {payout[3]}")
    else:
        print("❌ No payout records found for JAMUNA!")
        
        # Check the month filter on your page
        print("\n📊 Current payouts in database for March 2026:")
        cursor.execute("""
            SELECT e.first_name, e.last_name, p.month 
            FROM payouts p
            JOIN employees e ON p.employee_id = e.id
            WHERE p.month = '2026-03'
        """)
        march_payouts = cursor.fetchall()
        if march_payouts:
            print(f"   Found {len(march_payouts)} employees with March 2026 payouts:")
            for payout in march_payouts:
                print(f"   - {payout[0]} {payout[1]}")
        else:
            print("   No payouts for March 2026 at all!")
            
            # Show all months that have payouts
            cursor.execute("SELECT DISTINCT month FROM payouts ORDER BY month")
            months = cursor.fetchall()
            if months:
                print("\n📅 Months with payouts:")
                for month in months:
                    print(f"   - {month[0]}")
else:
    print("❌ JAMUNA not found in employees table!")

conn.close()
print("\n" + "=" * 60)