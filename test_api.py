#!/usr/bin/env python
import requests
import json

# Test Django API endpoints
BASE_URL = "http://127.0.0.1:8000/api"

def test_django_api():
    print("Testing Django API endpoints...")
    print("=" * 50)
    
    try:
        # Test dashboard stats endpoint
        print("Testing dashboard stats...")
        response = requests.get(f"{BASE_URL}/dashboard/stats/")
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Dashboard API working!")
            print(f"Total Orders: {data.get('total_orders', 'N/A')}")
            print(f"Pending Orders: {data.get('pending_orders', 'N/A')}")
            print(f"Available Vehicles: {data.get('available_vehicles', 'N/A')}")
            print(f"Active Shipments: {data.get('active_shipments', 'N/A')}")
            print(f"Total Products: {data.get('total_products', 'N/A')}")
            print(f"Low Stock Products: {data.get('low_stock_products', 'N/A')}")
            
            if data.get('recent_orders'):
                print(f"\nRecent Orders: {len(data['recent_orders'])} orders")
                for order in data['recent_orders'][:3]:  # Show first 3
                    print(f"   - Order #{order.get('order_number', 'N/A')} | Status: {order.get('status', 'N/A')}")
            
        else:
            print(f"X Dashboard API failed with status {response.status_code}")
            print(f"Response: {response.text}")
    
    except requests.ConnectionError:
        print("X Could not connect to Django server at http://127.0.0.1:8000")
        print("Make sure the Django server is running!")
        return False
    
    except Exception as e:
        print(f"X Error testing API: {str(e)}")
        return False
    
    print("\n" + "=" * 50)
    
    # Test other endpoints
    endpoints = [
        "/products/",
        "/orders/",
        "/vehicles/",
        "/warehouses/"
    ]
    
    print("Testing other endpoints...")
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 200:
                data = response.json()
                count = len(data.get('results', data)) if isinstance(data, dict) and 'results' in data else len(data) if isinstance(data, list) else 'N/A'
                print(f"✓ {endpoint} - {count} items")
            else:
                print(f"X {endpoint} - Status {response.status_code}")
        except Exception as e:
            print(f"X {endpoint} - Error: {str(e)}")
    
    return True

if __name__ == "__main__":
    test_django_api()
