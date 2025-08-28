#!/usr/bin/env python
import os
import django
import sys
from datetime import datetime, timedelta
import random

# Setup Django
sys.path.append('C:/GPT4_PROJECTS/logistic2')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'logistic_system.settings')
django.setup()

from accounts.models import CustomUser
from inventory.models import Product
from orders.models import Customer, Order, OrderItem
from warehousing.models import Warehouse
from transport.models import Vehicle, Driver, Shipment

def create_sample_orders():
    """Create some sample orders to make the dashboard more interesting"""
    print("Creating sample orders...")
    
    # Get existing data
    products = Product.objects.all()
    customers = Customer.objects.all()
    warehouses = Warehouse.objects.all()
    admin_user = CustomUser.objects.filter(role='admin').first()
    
    if not all([products.exists(), customers.exists(), warehouses.exists(), admin_user]):
        print("Missing required data. Make sure you have products, customers, and warehouses.")
        return
    
    # Create some orders
    statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
    
    for i in range(5):  # Create 5 orders
        customer = random.choice(customers)
        warehouse = random.choice(warehouses)
        
        # Create order
        order = Order.objects.create(
            customer=customer,
            order_date=datetime.now() - timedelta(days=random.randint(0, 10)),
            status=random.choice(statuses),
            priority='high' if i < 2 else 'normal',
            source_warehouse=warehouse,
            processed_by=admin_user if random.choice([True, False]) else None,
            delivery_address=f"{customer.address} - Delivery Location",
            delivery_city=customer.city,
            requested_delivery_date=datetime.now() + timedelta(days=random.randint(1, 7))
        )
        
        # Add order items
        num_items = random.randint(1, 3)
        for j in range(num_items):
            product = random.choice(products)
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=random.randint(1, 5),
                unit_price=random.uniform(10, 100)
            )
        
        print(f"Created Order #{order.order_number} - Status: {order.status}")
    
    print(f"Created {Order.objects.count()} total orders")

def create_sample_shipments():
    """Create some sample shipments"""
    print("\nCreating sample shipments...")
    
    # Get shipped orders
    shipped_orders = Order.objects.filter(status__in=['shipped', 'delivered'])
    vehicles = Vehicle.objects.all()
    
    if not vehicles.exists():
        print("No vehicles available for shipments")
        return
    
    for order in shipped_orders:
        if not order.shipments.exists():  # Only create if no shipment exists
            vehicle = random.choice(vehicles)
            
            shipment = Shipment.objects.create(
                pickup_date=order.order_date + timedelta(hours=random.randint(1, 48)),
                estimated_delivery=order.order_date + timedelta(days=random.randint(1, 5)),
                vehicle=vehicle,
                status='delivered' if order.status == 'delivered' else 'in_transit',
                total_weight_kg=random.uniform(10, 500),
                total_volume_cbm=random.uniform(1, 50)
            )
            
            # Link shipment to order
            shipment.orders.add(order)
            
            print(f"Created Shipment #{shipment.shipment_number} for Order #{order.order_number}")

if __name__ == "__main__":
    print("Adding sample data to make dashboard more interesting...")
    print("=" * 60)
    
    create_sample_orders()
    create_sample_shipments()
    
    print("\n" + "=" * 60)
    print("Sample data creation complete!")
    print("You can now refresh your dashboard to see more data.")
