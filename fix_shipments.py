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

from transport.models import Shipment

def fix_shipment_data():
    """Fix missing priority and other data in existing shipments"""
    print("Fixing shipment data...")
    print("=" * 50)
    
    shipments = Shipment.objects.all()
    priorities = ['low', 'normal', 'high', 'urgent']
    
    updated_count = 0
    for shipment in shipments:
        # Check for missing fields and set defaults
        needs_update = False
        
        # Check if tracking_number is missing
        if not shipment.tracking_number:
            shipment.tracking_number = f"TRK{random.randint(100000000000, 999999999999)}"
            needs_update = True
        
        # Since priority is not a field in the Shipment model, let's check what fields exist
        print(f"Shipment #{shipment.shipment_number}:")
        print(f"  Status: {shipment.status}")
        print(f"  Driver: {shipment.driver}")
        print(f"  Vehicle: {shipment.vehicle}")
        print(f"  Tracking: {shipment.tracking_number}")
        print(f"  Weight: {shipment.total_weight_kg}")
        print(f"  Orders: {shipment.orders.count()}")
        
        if needs_update:
            shipment.save()
            updated_count += 1
    
    print(f"Updated {updated_count} shipments")
    
    # Show field info
    print(f"\nShipment model fields:")
    for field in Shipment._meta.get_fields():
        print(f"  - {field.name}: {field.__class__.__name__}")

if __name__ == "__main__":
    fix_shipment_data()
