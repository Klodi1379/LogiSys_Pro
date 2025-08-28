#!/usr/bin/env python
import requests
import json

# Test Django API endpoints with authentication
BASE_URL = "http://127.0.0.1:8000/api"

def get_auth_token():
    """Get JWT token using admin credentials"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", {
            'username': 'admin',
            'password': 'admin123'
        })
        
        if response.status_code == 200:
            data = response.json()
            print("Authentication successful!")
            print(f"User: {data.get('user', {}).get('username', 'N/A')} ({data.get('user', {}).get('role', 'N/A')})")
            return data.get('access')
        else:
            print(f"Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        return None

def test_django_api_with_auth():
    print("Testing Django API endpoints with authentication...")
    print("=" * 60)
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        return False
    
    # Set up headers with authentication
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("\n" + "=" * 60)
    
    try:
        # Test dashboard stats endpoint
        print("Testing dashboard stats...")
        response = requests.get(f"{BASE_URL}/dashboard/stats/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("Dashboard API working!")
            print(f"Total Orders: {data.get('total_orders', 0)}")
            print(f"Pending Orders: {data.get('pending_orders', 0)}")
            print(f"Available Vehicles: {data.get('available_vehicles', 0)}")
            print(f"Active Shipments: {data.get('active_shipments', 0)}")
            print(f"Total Products: {data.get('total_products', 0)}")
            print(f"Low Stock Products: {data.get('low_stock_products', 0)}")
            print(f"Active Drivers: {data.get('active_drivers', 0)}")
            
            if data.get('recent_orders'):
                print(f"\nRecent Orders: {len(data['recent_orders'])} orders")
                for order in data['recent_orders'][:3]:  # Show first 3
                    print(f"   - Order #{order.get('order_number', 'N/A')} | Status: {order.get('status', 'N/A')}")
            
            # Show recent shipments if available
            if data.get('recent_shipments'):
                print(f"\nRecent Shipments: {len(data['recent_shipments'])} shipments")
                for shipment in data['recent_shipments'][:3]:  # Show first 3
                    print(f"   - Shipment #{shipment.get('shipment_number', 'N/A')} | Status: {shipment.get('status', 'N/A')}")
            
        else:
            print(f"Dashboard API failed with status {response.status_code}")
            print(f"Response: {response.text}")
    
    except requests.ConnectionError:
        print("X Could not connect to Django server at http://127.0.0.1:8000")
        print("Make sure the Django server is running!")
        return False
    
    except Exception as e:
        print(f"X Error testing dashboard API: {str(e)}")
    
    print("\n" + "=" * 60)
    
    # Test other endpoints
    endpoints = [
        ("/products/", "Products"),
        ("/orders/", "Orders"),
        ("/vehicles/", "Vehicles"),
        ("/warehouses/", "Warehouses"),
        ("/customers/", "Customers"),
        ("/shipments/", "Shipments"),
    ]
    
    print("Testing other endpoints...")
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                # Handle both paginated and non-paginated responses
                if isinstance(data, dict) and 'results' in data:
                    count = len(data['results'])
                    total = data.get('count', count)
                    print(f"[OK] {name} - {count} items shown (Total: {total})")
                elif isinstance(data, list):
                    count = len(data)
                    print(f"[OK] {name} - {count} items")
                else:
                    print(f"[OK] {name} - Response received")
            else:
                print(f"[FAIL] {name} - Status {response.status_code}")
        except Exception as e:
            print(f"[ERROR] {name} - Error: {str(e)}")
    
    print("\n" + "=" * 60)
    print("API Test Complete!")
    return True

if __name__ == "__main__":
    test_django_api_with_auth()
