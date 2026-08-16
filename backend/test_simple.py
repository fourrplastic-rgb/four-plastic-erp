#!/usr/bin/env python3
import urllib.request
import json
import sys

BASE_URL = "http://localhost:5000/api"

def test_endpoint(name, url):
    try:
        print(f"\n📊 Testing: {name}")
        print("-" * 40)
        req = urllib.request.Request(url, headers={'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            if isinstance(data, list):
                print(f"✅ Found {len(data)} items")
                if len(data) > 0:
                    print(f"   First item: {list(data[0].keys())[:3] if data[0] else 'empty'}")
            else:
                print(f"✅ Response: {data}")
            return True
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

print("="*60)
print("🚀 TESTING ALL API ENDPOINTS")
print("="*60)

# First check if server is running
try:
    test_endpoint("Server Connection", "http://localhost:5000/api/health")
except:
    print("\n❌ Cannot connect to server. Make sure backend is running:")
    print("   cd /Users/laxmansutar/Desktop/FOUR_\\ \\(R\\)_PLASTIC/backend")
    print("   python app.py")
    sys.exit(1)

tests = [
    ("Health Check", f"{BASE_URL}/health"),
    ("Customers", f"{BASE_URL}/customers"),
    ("Vendors", f"{BASE_URL}/vendors"),
    ("Raw Materials", f"{BASE_URL}/items/?type=raw_material"),
    ("Finished Goods", f"{BASE_URL}/items/?type=finished_good"),
    ("Purchase Invoices", f"{BASE_URL}/purchase-invoices"),
    ("Sales Invoices", f"{BASE_URL}/sales-invoices"),
    ("Delivery Challans", f"{BASE_URL}/delivery-challans"),
    ("Next Challan Number", f"{BASE_URL}/delivery-challans/next-number"),
    ("Stock", f"{BASE_URL}/stock"),
]

results = []
for name, url in tests:
    result = test_endpoint(name, url)
    results.append((name, result))

print("\n" + "="*60)
print("📊 SUMMARY")
print("="*60)
passed = sum(1 for _, r in results if r)
failed = len(results) - passed
print(f"✅ Passed: {passed}")
print(f"❌ Failed: {failed}")

for name, result in results:
    status = "✅" if result else "❌"
    print(f"   {status} {name}")

if failed == 0:
    print("\n🎉 ALL TESTS PASSED! Database connections are working properly.")
else:
    print("\n⚠️ Some tests failed. Please check the errors above.")
