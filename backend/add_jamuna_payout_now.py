import sqlite3
from datetime import datetime

print("=" * 60)
print("💰 ADDING MARCH 2026 PAYOUT FOR JAMUNA PRASHAD")
print("=" * 60)

# Database path
db_path = r"H:\NEW MFG\FOUR (R) PLASTIC\database\manufacturing.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get Jamuna's details
cursor.execute("SELECT id, basic_salary FROM employees WHERE id = 6")
jamuna = cursor.fetchone()

if not jamuna:
    print("❌ JAMUNA not found!")
    conn.close()
    exit()

jamuna_id = jamuna[0]
basic = jamuna[1] or 25000

print(f"✅ Found JAMUNA PRASHAD (ID: {jamuna_id})")
print(f"💰 Basic Salary: ₹{basic}")

# Calculate payout components (matching other employees)
hra = basic * 0.5  # 50% HRA
conveyance = 2000
medical = 1250
special = 3000
total_earnings = basic + hra + conveyance + medical + special
print(f"📊 Total Earnings: ₹{total_earnings}")

# Get pending advances for Jamuna
cursor.execute("SELECT SUM(balance) FROM advances WHERE employee_id = ? AND status = 'pending'", (jamuna_id,))
advance = cursor.fetchone()[0] or 0
print(f"💰 Pending Advance: ₹{advance}")

# Calculate deductions
pf = basic * 0.12
pt = 200
total_deductions = pf + pt + advance
net = total_earnings - total_deductions

print(f"📊 PF Deduction: ₹{pf}")
print(f"📊 Professional Tax: ₹{pt}")
print(f"📊 Total Deductions: ₹{total_deductions}")
print(f"💰 Net Salary: ₹{net}")

# Generate next payout number
cursor.execute("SELECT payout_no FROM payouts ORDER BY id DESC LIMIT 1")
last = cursor.fetchone()
if last:
    last_num = int(last[0].replace('POUT', ''))
    payout_no = f"POUT{last_num + 1:06d}"
else:
    payout_no = "POUT000001"

print(f"📄 Payout Number: {payout_no}")

now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# Insert the payout
cursor.execute("""
    INSERT INTO payouts (
        payout_no, employee_id, month, basic_salary, hra, conveyance,
        medical, special_allowance, total_earnings, pf_deduction,
        pt_deduction, tax_deduction, advance_deduction, total_deductions,
        net_salary, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    payout_no, jamuna_id, '2026-03', basic, hra, conveyance, medical, special,
    total_earnings, pf, pt, 0, advance, total_deductions,
    net, 'pending', now, now
))

conn.commit()
print("\n✅ SUCCESS! March 2026 payout added for JAMUNA PRASHAD")

# Verify it was added
cursor.execute("""
    SELECT p.*, e.first_name, e.last_name 
    FROM payouts p
    JOIN employees e ON p.employee_id = e.id
    WHERE p.employee_id = 6
""")
result = cursor.fetchone()
if result:
    print("\n📊 Verification - Payout record created:")
    print(f"   Employee: JAMUNA PRASHAD")
    print(f"   Month: March 2026")
    print(f"   Net Salary: ₹{net}")
    print(f"   Status: pending")

conn.close()
print("\n" + "=" * 60)
print("✅ All done! Now refresh your browser.")
print("=" * 60)