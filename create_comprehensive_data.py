#!/usr/bin/env python
import os
import django
import sys
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Setup Django
sys.path.append('C:/GPT4_PROJECTS/logistic2')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'logistic_system.settings')
django.setup()

from accounts.models import CustomUser
from inventory.models import Product, ProductCategory, Supplier
from orders.models import Customer, Order, OrderItem
from warehousing.models import Warehouse, StockItem, StorageLocation
from transport.models import Vehicle, Driver, Shipment

def create_comprehensive_data():
    """Create comprehensive sample data for a realistic logistics system"""
    print("Creating comprehensive logistics data...")
    print("=" * 70)
    
    # 1. Create more product categories
    categories = [
        "Electronics", "Home & Garden", "Clothing", "Sports", 
        "Books", "Automotive", "Health & Beauty", "Toys"
    ]
    
    created_categories = []
    for cat_name in categories:
        category, created = ProductCategory.objects.get_or_create(
            name=cat_name,
            defaults={'description': f'{cat_name} products and accessories'}
        )
        if created:
            created_categories.append(category)
    
    print(f"[OK] Categories: {len(created_categories)} new categories created")
    
    # 2. Create more suppliers
    suppliers_data = [
        ("TechSupply Co.", "New York", "tech@techsupply.com"),
        ("Global Electronics", "California", "orders@globalelec.com"), 
        ("HomeGoods Ltd", "Texas", "sales@homegoods.com"),
        ("Fashion Forward", "Florida", "contact@fashionforward.com"),
        ("Sports Direct", "Colorado", "orders@sportsdirect.com")
    ]
    
    created_suppliers = []
    for name, location, email in suppliers_data:
        supplier, created = Supplier.objects.get_or_create(
            name=name,
            defaults={
                'contact_person': f'{name.split()[0]} Manager',
                'email': email,
                'phone': f'+1-{random.randint(100,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}',
                'address': f'123 {name} Street, {location}',
                'tax_number': f'TAX-{random.randint(100000000, 999999999)}',  # Add unique tax number
                'payment_terms': random.choice(['NET30', 'NET15', 'COD', 'NET60']),
                'credit_limit': Decimal(str(random.randint(50000, 500000))),
                'rating': random.choice([3, 4, 5])
            }
        )
        if created:
            created_suppliers.append(supplier)
    
    print(f"[OK] Suppliers: {len(created_suppliers)} new suppliers created")
    
    # 3. Create more products
    products_data = [
        # Electronics
        ("Wireless Headphones", "Electronics", "WH-001", 299.99, 50, 10),
        ("Smartphone Case", "Electronics", "SC-002", 24.99, 200, 25),
        ("Bluetooth Speaker", "Electronics", "BS-003", 149.99, 75, 15),
        ("USB Cable", "Electronics", "UC-004", 12.99, 500, 50),
        ("Power Bank", "Electronics", "PB-005", 89.99, 100, 20),
        
        # Home & Garden
        ("Garden Tools Set", "Home & Garden", "GT-006", 79.99, 40, 8),
        ("LED Light Bulbs", "Home & Garden", "LB-007", 19.99, 300, 30),
        ("Plant Fertilizer", "Home & Garden", "PF-008", 34.99, 150, 25),
        ("Storage Boxes", "Home & Garden", "SB-009", 45.99, 80, 15),
        
        # Clothing
        ("Cotton T-Shirt", "Clothing", "CT-010", 19.99, 250, 50),
        ("Denim Jeans", "Clothing", "DJ-011", 69.99, 120, 20),
        ("Running Shoes", "Clothing", "RS-012", 129.99, 90, 15),
        ("Winter Jacket", "Clothing", "WJ-013", 199.99, 60, 10),
        
        # Sports
        ("Basketball", "Sports", "BB-014", 29.99, 80, 15),
        ("Yoga Mat", "Sports", "YM-015", 49.99, 100, 20),
        ("Protein Powder", "Sports", "PP-016", 59.99, 75, 12),
        
        # Books
        ("Business Strategy Book", "Books", "BSB-017", 34.99, 150, 30),
        ("Cookbook Collection", "Books", "CC-018", 24.99, 200, 40),
        
        # Automotive
        ("Car Phone Mount", "Automotive", "CPM-019", 39.99, 120, 20),
        ("Engine Oil", "Automotive", "EO-020", 89.99, 200, 30)
    ]
    
    all_categories = ProductCategory.objects.all()
    all_suppliers = Supplier.objects.all()
    
    created_products = []
    for name, cat_name, sku, price, stock, reorder in products_data:
        category = all_categories.filter(name=cat_name).first()
        supplier = random.choice(all_suppliers)
        
        product, created = Product.objects.get_or_create(
            sku=sku,
            defaults={
                'name': name,
                'category': category,
                'supplier': supplier,
                'cost_price': Decimal(str(price * 0.7)),  # Cost is 70% of selling price
                'selling_price': Decimal(str(price)),
                'min_stock_level': reorder,
                'max_stock_level': stock,
                'reorder_point': reorder,
                'description': f'High-quality {name.lower()} from {supplier.name}',
                'weight': Decimal(str(round(random.uniform(0.1, 5.0), 3))),
                'length': Decimal(str(round(random.uniform(5, 50), 2))),
                'width': Decimal(str(round(random.uniform(5, 30), 2))),
                'height': Decimal(str(round(random.uniform(2, 20), 2))),
                'is_active': True,
                'is_fragile': random.choice([True, False]) if category.name == 'Electronics' else False,
                'requires_refrigeration': category.name == 'Health & Beauty' and random.choice([True, False]),
                'is_hazardous': False
            }
        )
        if created:
            created_products.append(product)
            
            # Create stock items for this product in available warehouses
            warehouses = Warehouse.objects.all()
            for warehouse in warehouses:
                # Get or create a storage location for this warehouse
                location, loc_created = StorageLocation.objects.get_or_create(
                    warehouse=warehouse,
                    zone='A',
                    aisle='01',
                    rack='R1',
                    shelf='S1',
                    defaults={
                        'max_weight_kg': 1000,
                        'max_volume_cbm': 10,
                        'is_available': True
                    }
                )
                
                StockItem.objects.get_or_create(
                    product=product,
                    warehouse=warehouse,
                    location=location,
                    defaults={
                        'quantity': random.randint(reorder, stock),
                        'batch_number': f'BATCH-{random.randint(1000, 9999)}',
                        'unit_cost': product.cost_price,
                        'expiry_date': None if category.name not in ['Health & Beauty', 'Sports'] else 
                                     datetime.now().date() + timedelta(days=random.randint(365, 1095)),
                        'received_date': datetime.now() - timedelta(days=random.randint(1, 90))
                    }
                )
    
    print(f"[OK] Products: {len(created_products)} new products created with stock")
    
    # 4. Create more customers
    customers_data = [
        ("Amazon Retail", "business", "orders@amazon.com", "Seattle, WA"),
        ("Walmart Stores", "enterprise", "procurement@walmart.com", "Bentonville, AR"),
        ("Target Corporation", "enterprise", "supply@target.com", "Minneapolis, MN"),
        ("Best Buy Electronics", "business", "wholesale@bestbuy.com", "Richfield, MN"),
        ("Home Depot", "business", "orders@homedepot.com", "Atlanta, GA"),
        ("John Smith", "individual", "john.smith@email.com", "Los Angeles, CA"),
        ("Sarah Johnson", "individual", "sarah.j@email.com", "Chicago, IL"),
        ("Michael Brown", "individual", "mbrown@email.com", "Houston, TX"),
        ("Emma Wilson", "individual", "emma.w@email.com", "Phoenix, AZ"),
        ("David Miller", "individual", "david.miller@email.com", "Philadelphia, PA"),
        ("Local Pharmacy Chain", "business", "orders@localpharm.com", "Miami, FL"),
        ("Tech Startup Inc", "business", "procurement@techstartup.com", "San Francisco, CA")
    ]
    
    created_customers = []
    for name, cust_type, email, location in customers_data:
        # Parse location
        city_state = location.split(', ')
        city = city_state[0] if len(city_state) > 0 else "Unknown"
        state = city_state[1] if len(city_state) > 1 else "Unknown"
        
        customer, created = Customer.objects.get_or_create(
            email=email,
            defaults={
                'name': name,
                'customer_type': cust_type,
                'phone': f'+1-{random.randint(100,999)}-{random.randint(100,999)}-{random.randint(1000,9999)}',
                'address': f'{random.randint(100, 9999)} {name.split()[0]} Street',
                'city': city,
                'state': state,
                'postal_code': f'{random.randint(10000, 99999)}',
                'country': 'United States',
                'is_active': True
            }
        )
        if created:
            created_customers.append(customer)
    
    print(f"[OK] Customers: {len(created_customers)} new customers created")
    
    # 5. Create more vehicles and drivers
    vehicle_data = [
        ("Truck", "Ford F-150", "TR-001"),
        ("Van", "Mercedes Sprinter", "VN-002"), 
        ("Truck", "Chevrolet Silverado", "TR-003"),
        ("Van", "Ford Transit", "VN-004"),
        ("Truck", "RAM 1500", "TR-005"),
        ("Van", "Nissan NV200", "VN-006")
    ]
    
    created_vehicles = []
    for v_type, make_model, license in vehicle_data:
        vehicle, created = Vehicle.objects.get_or_create(
            license_plate=license,
            defaults={
                'vehicle_type': v_type.lower(),
                'make': make_model.split()[0],
                'model': ' '.join(make_model.split()[1:]),
                'year': random.randint(2018, 2024),
                'color': random.choice(['White', 'Blue', 'Red', 'Silver', 'Black']),
                'max_weight_kg': Decimal(str(random.randint(1000, 5000))),
                'max_volume_cbm': Decimal(str(random.randint(10, 50))),
                'max_items': random.randint(50, 200),
                'status': 'active',
                'current_mileage_km': random.randint(10000, 150000)
            }
        )
        if created:
            created_vehicles.append(vehicle)
    
    print(f"[OK] Vehicles: {len(created_vehicles)} new vehicles created")
    
    # Create driver users and profiles
    driver_data = [
        ("Mike", "Johnson", "mike.johnson"),
        ("Sarah", "Davis", "sarah.davis"),
        ("Tom", "Wilson", "tom.wilson"),
        ("Lisa", "Brown", "lisa.brown"),
        ("James", "Garcia", "james.garcia"),
        ("Maria", "Rodriguez", "maria.rodriguez")
    ]
    
    created_drivers = []
    for first, last, username in driver_data:
        # Create user first
        user, user_created = CustomUser.objects.get_or_create(
            username=username,
            defaults={
                'first_name': first,
                'last_name': last,
                'email': f'{username}@logistics.com',
                'role': 'driver'
            }
        )
        if user_created:
            user.set_password('driver123')  # Set default password
            user.save()
            
            # Create driver profile
            driver, created = Driver.objects.get_or_create(
                user=user,
                defaults={
                    'license_number': f'DL{random.randint(100000, 999999)}',
                    'license_class': random.choice(['A', 'B', 'C']),
                    'license_expiry': datetime.now().date() + timedelta(days=random.randint(365, 1825)),
                    'is_available': True,
                    'total_deliveries': random.randint(50, 500),
                    'on_time_delivery_rate': Decimal(str(random.uniform(85.0, 98.5)))
                }
            )
            if created:
                created_drivers.append(driver)
    
    print(f"[OK] Drivers: {len(created_drivers)} new drivers created")
    
    # 6. Create many more orders with realistic patterns
    print("\nCreating orders with realistic patterns...")
    
    all_customers = Customer.objects.all()
    all_products = Product.objects.all()
    all_warehouses = Warehouse.objects.all()
    admin_user = CustomUser.objects.filter(role='admin').first()
    
    # Create orders over the last 30 days with realistic patterns
    statuses = [
        ('delivered', 40),  # 40% delivered
        ('shipped', 20),    # 20% shipped  
        ('processing', 15), # 15% processing
        ('confirmed', 10),  # 10% confirmed
        ('pending', 10),    # 10% pending
        ('cancelled', 5)    # 5% cancelled
    ]
    
    # Weighted random selection
    status_choices = []
    for status, weight in statuses:
        status_choices.extend([status] * weight)
    
    priorities = ['low', 'normal', 'high', 'urgent']
    
    created_orders = []
    for i in range(25):  # Create 25 additional orders
        customer = random.choice(all_customers)
        warehouse = random.choice(all_warehouses)
        
        # Create orders with dates spread over last 30 days
        days_ago = random.randint(0, 30)
        order_date = datetime.now() - timedelta(days=days_ago)
        
        # Business customers tend to place larger orders
        if customer.customer_type == 'enterprise':
            priority_weights = [1, 2, 3, 2]  # Higher chance of high/urgent
        elif customer.customer_type == 'business':
            priority_weights = [2, 4, 2, 1]  # Mostly normal/high
        else:
            priority_weights = [3, 4, 2, 1]  # Individual customers mostly low/normal
        
        priority = random.choices(priorities, weights=priority_weights)[0]
        status = random.choice(status_choices)
        
        order = Order.objects.create(
            customer=customer,
            order_date=order_date,
            status=status,
            priority=priority,
            source_warehouse=warehouse,
            processed_by=admin_user if status != 'pending' else None,
            delivery_address=f"{customer.address}, Delivery Dock",
            delivery_city=customer.city,
            requested_delivery_date=order_date + timedelta(days=random.randint(1, 14))
        )
        
        # Add 1-5 items per order
        num_items = random.randint(1, 5)
        # Enterprise customers tend to order more
        if customer.customer_type == 'enterprise':
            num_items = random.randint(3, 8)
        elif customer.customer_type == 'business':
            num_items = random.randint(2, 6)
        
        order_total = 0
        for j in range(num_items):
            product = random.choice(all_products)
            
            # Quantity based on customer type and product
            if customer.customer_type == 'enterprise':
                quantity = random.randint(10, 100)
            elif customer.customer_type == 'business':
                quantity = random.randint(5, 50)
            else:
                quantity = random.randint(1, 10)
            
            # Slight price variation (discounts for bulk)
            unit_price = product.selling_price
            if quantity > 50:
                unit_price *= Decimal('0.9')  # 10% bulk discount
            elif quantity > 20:
                unit_price *= Decimal('0.95')  # 5% bulk discount
            
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=unit_price
            )
            
            order_total += quantity * unit_price
        
        # Update order totals
        order.subtotal = order_total
        order.total_amount = order_total * Decimal('1.08')  # Add 8% tax
        order.save()
        
        created_orders.append(order)
    
    print(f"[OK] Orders: {len(created_orders)} new orders created")
    
    # 7. Create shipments for shipped/delivered orders
    shipped_orders = Order.objects.filter(
        status__in=['shipped', 'delivered']
    ).exclude(shipments__isnull=False)
    
    all_vehicles = Vehicle.objects.all()
    all_drivers = Driver.objects.all()
    
    created_shipments = []
    for order in shipped_orders:
        if all_vehicles.exists() and random.choice([True, True, False]):  # 66% chance
            vehicle = random.choice(all_vehicles)
            driver = random.choice(all_drivers) if all_drivers.exists() else None
            
            # Calculate realistic dates
            pickup_date = order.order_date + timedelta(hours=random.randint(2, 72))
            delivery_date = pickup_date + timedelta(hours=random.randint(4, 120))
            
            shipment_status = 'delivered' if order.status == 'delivered' else 'in_transit'
            if order.status == 'delivered' and random.choice([True, False]):
                shipment_status = 'delivered'
            
            shipment = Shipment.objects.create(
                driver=driver,
                vehicle=vehicle,
                status=shipment_status,
                pickup_date=pickup_date,
                estimated_delivery=delivery_date,
                actual_delivery=delivery_date if shipment_status == 'delivered' else None,
                total_weight_kg=random.uniform(5, 500),
                total_volume_cbm=random.uniform(0.5, 20)
            )
            
            shipment.orders.add(order)
            created_shipments.append(shipment)
    
    print(f"[OK] Shipments: {len(created_shipments)} new shipments created")
    
    print("\n" + "=" * 70)
    print("COMPREHENSIVE DATA CREATION COMPLETE!")
    print("=" * 70)
    
    # Final summary
    print(f"FINAL TOTALS:")
    print(f"   - Categories: {ProductCategory.objects.count()}")
    print(f"   - Suppliers: {Supplier.objects.count()}")
    print(f"   - Products: {Product.objects.count()}")
    print(f"   - Customers: {Customer.objects.count()}")
    print(f"   - Orders: {Order.objects.count()}")
    print(f"   - Order Items: {OrderItem.objects.count()}")
    print(f"   - Vehicles: {Vehicle.objects.count()}")
    print(f"   - Drivers: {Driver.objects.count()}")
    print(f"   - Shipments: {Shipment.objects.count()}")
    print(f"   - Stock Items: {StockItem.objects.count()}")
    
    print(f"\nOrder Status Breakdown:")
    for status, count in Order.objects.values_list('status').annotate(count=models.Count('status')):
        print(f"   - {status.title()}: {count}")
    
    print(f"\nCustomer Type Breakdown:")
    for ctype, count in Customer.objects.values_list('customer_type').annotate(count=models.Count('customer_type')):
        print(f"   - {ctype.title()}: {count}")

if __name__ == "__main__":
    # Import models for the count at the end
    from django.db import models
    create_comprehensive_data()
