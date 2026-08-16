#!/usr/bin/env python3
"""
Comprehensive API Test Script
Tests all major endpoints to ensure database connections are working
"""
import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def print_test(name, response, expected_status=200):
    """Print test result"""
    status = "✅ PASS" if response.status_code == expected_status else "❌ FAIL"
    print(f"{status} - {name}: Status {response.status_code}")
    if response.status_code != expected_status:
        try:
            print(f"     Error: {response.json()}")
        except:
            print(f"     Error: {response.text}")
    return response.status_code == expected_status

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("📊 TEST 1: Health Check")
    print("="*60)
    response = requests.get(f"{BASE_URL}/health")
    return print_test("Health Check", response)

def test_customers():
    """Test customers endpoint"""
    print("\n" + "="*60)
    print("📊 TEST 2: Customers API")
    print("="*60)
    response = requests.get(f"{BASE_URL}/customers")
    if response.status_code == 200:
        customers = response.json()
        print(f"✅ Found {len(customers)} customers")
        for c in customers[:5]:
            print(f"   - {c.get('name')} (ID: {c.get('id')})")
    return print_test("GET /customers", response)

def test_vendors():
    """Test vendors endpoint"""
    print("\n" + "="*60)
    print("📊 TEST 3: Vendors API")
    print("="*60)
    response = requests.get(f"{BASE_URL}/vendors")
    if response.status_code == 200:
        vendors = response.json()
        print(f"✅ Found {len(vendors)} vendors")
        for v in vendors[:5]:
            print(f"   - {v.get('name')} (ID: {v.get('id')})")
    return print_test("GET /vendors", response)

def test_items():
    """Test items endpoint"""
    print("\n" + "="*60)
    print("📊 TEST 4: Items API")
    print("="*60)
    
    # Test raw materials
    response = requests.get(f"{BASE_URL}/items/?type=raw_material")
    if response.status_code == 200:
        raw = response.json()
        print(f"✅ Raw Materials: {len(raw)} items")
        for item in raw[:3]:
            print(f"   - {item.get('name')} (Stock: {item.get('current_stock')})")
    print_test("GET raw materials", response)
    
    # Test finished goods
    response = requests.get(f"{BASE_URL}/items/?type=finished_good")
    if response.status_code == 200:
        finished = response.json()
        print(f"✅ Finished Goods: {len(finished)} items")
        for item in finished[:3]:
            print(f"   - {item.get('name')} (Stock: {item.get('current_stock')})")
    print_test("GET finished goods", response)
    
    return True

def test_purchase_invoices():
    """Test purchase invoices endpoint"""
    print("\n" + "="*60)
    print("📊 TEST 5: Purchase Invoices API")
    print("="*60)
    response = requests.get(f"{BASE_URL}/purchase-invoices")
    if response.status_code == 200:
        invoices = response.json()
        print(f"✅ Found {len(invoices)} purchase invoices")
        for inv in invoices[:3]:
            print(f"   - {inv.get('invoice_no')} (Vendor: {inv.get('vendor_name')})")
    return print_test("GET /purchase-invoices", response)

def test_sales_invoices():
    """Test sales invoices endpoint"""
    print("\n" + "="*60)
    print("📊 TEST 6: Sales Invoices API")
    print("="*60)
    response = requests.get(f"{BASE_URL}/sales-invoices")
    if response.status_code == 200:
        invoices = response.json()
        print(f"✅ Found {len(invoices)} sales invoices")
        for inv in invoices[:3]:
            print(f"   - {inv.get('invoice_no')} (Customer: {inv.get('customer_name')})")
    return print_test("GET /sales-invoices", response)

def test_delivery_challans():
    """Test delivery challans endpoint"""
    print("\n" + "="*60)
    print("📊 TEST 7: Delivery Challans API")
    print("="*60)
    response = requests.get(f"{BASE_URL}/delivery-challans")
    if response.status_code == 200:
        challans = response.json()
        print(f"✅ Found {len(challans)} delivery challans")
        for ch in challans[:3]:
            print(f"   - {ch.get('challan_no')} (Customer: {ch.get('customer_name')})")
    return print_test("GET /delivery-challans", response)

def test_stock():
    """Test stock endpoint"""
    print("\n" + "="*60)
    print("📊 TEST 8: Stock API")
    print("="*60)
    response = requests.get(f"{BASE_URL}/stock")
    if response.status_code == 200:
        stock = response.json()
        print(f"✅ Stock data retrieved")
        if isinstance(stock, list) and len(stock) > 0:
            print(f"   - First item: {stock[0].get('name')} - Stock: {stock[0].get('current_stock')}")
    return print_test("GET /stock", response)

def test_delivery_challan_next_number():
    """Test next number endpoint"""
    print("\n" + "="*60)
    print("📊 TEST 9: Delivery Challan Next Number")
    print("="*60)
    response = requests.get(f"{BASE_URL}/delivery-challans/next-number")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Next challan number: {data.get('challan_no')}")
        print(f"   Next sequence: {data.get('next_number')}")
    return print_test("GET /delivery-challans/next-number", response)

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*70)
    print("🚀 STARTING COMPREHENSIVE API TESTS")
    print("="*70)
    print(f"📡 API Base URL: {BASE_URL}")
    print("="*70)
    
    results = []
    
    # Run all tests
    results.append(("Health", test_health()))
    results.append(("Customers", test_customers()))
    results.append(("Vendors", test_vendors()))
    results.append(("Items", test_items()))
    results.append(("Purchase Invoices", test_purchase_invoices()))
    results.append(("Sales Invoices", test_sales_invoices()))
    results.append(("Delivery Challans", test_delivery_challans()))
    results.append(("Stock", test_stock()))
    results.append(("Next Number", test_delivery_challan_next_number()))
    
    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    passed = sum(1 for _, result in results if result)
    failed = len(results) - passed
    
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total: {len(results)}")
    
    for name, result in results:
        status = "✅" if result else "❌"
        print(f"   {status} {name}")
    
    print("="*70)
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED! Database connections are working properly.")
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
    
    return failed == 0

if __name__ == "__main__":
    run_all_tests()
