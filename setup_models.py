#!/usr/bin/env python3
"""
Enhanced Django Models Setup Script for Logistics Management System
This script creates comprehensive models with improved relationships and business logic.
"""

import os
import sys


def create_accounts_models():
    """Create enhanced user and role management models"""
    content = '''from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone

class CustomUser(AbstractUser):
    """Enhanced user model with role-based access control"""
    ROLE_CHOICES = (
        ('admin', 'System Administrator'),
        ('warehouse_manager', 'Warehouse Manager'),
        ('transport_manager', 'Transport Manager'),
        ('driver', 'Driver'),
        ('client', 'Client'),
        ('analyst', 'Data Analyst'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number format: '+999999999'")
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    
    # Profile information
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    is_active_driver = models.BooleanField(default=False)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class UserProfile(models.Model):
    """Extended profile information for users"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=17, blank=True)
    
    # Driver-specific fields
    license_number = models.CharField(max_length=50, blank=True)
    license_expiry = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"Profile for {self.user.username}"

class Permission(models.Model):
    """Custom permissions for fine-grained access control"""
    name = models.CharField(max_length=100, unique=True)
    codename = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class RolePermission(models.Model):
    """Many-to-many relationship between roles and permissions"""
    role = models.CharField(max_length=20, choices=CustomUser.ROLE_CHOICES)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('role', 'permission')
'''

    with open("accounts/models.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Created accounts/models.py")


def create_inventory_models():
    """Create comprehensive inventory management models"""
    content = '''from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
import uuid

class Supplier(models.Model):
    """Enhanced supplier model with comprehensive tracking"""
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    
    # Business information
    tax_number = models.CharField(max_length=50, unique=True)
    payment_terms = models.CharField(max_length=100, blank=True)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Performance tracking
    rating = models.IntegerField(default=5, validators=[MinValueValidator(1)])
    total_orders = models.IntegerField(default=0)
    on_time_delivery_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class ProductCategory(models.Model):
    """Product categorization for better organization"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    
    class Meta:
        verbose_name_plural = "Product Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Product(models.Model):
    """Enhanced product model with comprehensive attributes"""
    # Basic information
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True)
    
    # Categorization
    category = models.ForeignKey(ProductCategory, on_delete=models.PROTECT)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT)
    
    # Physical attributes
    weight = models.DecimalField(max_digits=8, decimal_places=3, help_text="Weight in kg")
    length = models.DecimalField(max_digits=6, decimal_places=2, help_text="Length in cm")
    width = models.DecimalField(max_digits=6, decimal_places=2, help_text="Width in cm")
    height = models.DecimalField(max_digits=6, decimal_places=2, help_text="Height in cm")
    
    # Pricing
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Inventory settings
    min_stock_level = models.IntegerField(default=10)
    max_stock_level = models.IntegerField(default=100)
    reorder_point = models.IntegerField(default=20)
    
    # Properties
    is_fragile = models.BooleanField(default=False)
    requires_refrigeration = models.BooleanField(default=False)
    is_hazardous = models.BooleanField(default=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    @property
    def volume(self):
        """Calculate volume in cubic centimeters"""
        return self.length * self.width * self.height
    
    @property
    def current_stock(self):
        """Get current total stock across all warehouses"""
        return sum(item.quantity for item in self.stock_items.all())

class InventoryForecast(models.Model):
    """Demand forecasting for inventory planning"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='forecasts')
    forecast_date = models.DateField()
    predicted_demand = models.IntegerField()
    confidence_level = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Model metadata
    algorithm_used = models.CharField(max_length=50, default='moving_average')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('product', 'forecast_date')
        ordering = ['-forecast_date']
    
    def __str__(self):
        return f"Forecast for {self.product.name} on {self.forecast_date}"
'''

    with open("inventory/models.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Created inventory/models.py")


def create_warehousing_models():
    """Create comprehensive warehouse management models"""
    content = '''from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from accounts.models import CustomUser
from inventory.models import Product

class Warehouse(models.Model):
    """Enhanced warehouse model with comprehensive tracking"""
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    
    # Geolocation
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Capacity information
    total_capacity_sqm = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_capacity_cbm = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Management
    manager = models.ForeignKey(CustomUser, on_delete=models.PROTECT, related_name='managed_warehouses')
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    @property
    def utilization_percentage(self):
        """Calculate space utilization percentage"""
        used_space = sum(location.used_capacity for location in self.storage_locations.all())
        return (used_space / self.total_capacity_cbm * 100) if self.total_capacity_cbm > 0 else 0

class StorageLocation(models.Model):
    """Specific storage locations within warehouses"""
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='storage_locations')
    
    # Location identifiers
    zone = models.CharField(max_length=10)  # A, B, C
    aisle = models.CharField(max_length=10)  # 01, 02, 03
    rack = models.CharField(max_length=10)   # R1, R2, R3
    shelf = models.CharField(max_length=10)  # S1, S2, S3
    bin = models.CharField(max_length=10, blank=True)    # B1, B2, B3
    
    # Capacity
    max_weight_kg = models.DecimalField(max_digits=8, decimal_places=2, default=1000)
    max_volume_cbm = models.DecimalField(max_digits=8, decimal_places=2, default=10)
    used_capacity = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Location properties
    is_temperature_controlled = models.BooleanField(default=False)
    temperature_min = models.IntegerField(null=True, blank=True)
    temperature_max = models.IntegerField(null=True, blank=True)
    
    # Status
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('warehouse', 'zone', 'aisle', 'rack', 'shelf', 'bin')
        ordering = ['warehouse', 'zone', 'aisle', 'rack', 'shelf', 'bin']
    
    def __str__(self):
        location_parts = [self.zone, self.aisle, self.rack, self.shelf]
        if self.bin:
            location_parts.append(self.bin)
        return f"{self.warehouse.code}-{'-'.join(location_parts)}"
    
    @property
    def location_code(self):
        """Generate a unique location code"""
        return str(self)

class StockItem(models.Model):
    """Enhanced stock tracking with location and batch information"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_items')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stock_items')
    location = models.ForeignKey(StorageLocation, on_delete=models.PROTECT, related_name='stock_items')
    
    # Quantity tracking
    quantity = models.IntegerField(validators=[MinValueValidator(0)])
    reserved_quantity = models.IntegerField(default=0)  # Reserved for orders
    
    # Batch/Lot tracking
    batch_number = models.CharField(max_length=50, blank=True)
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Cost tracking
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Timestamps
    received_date = models.DateTimeField(default=timezone.now)
    last_movement = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['product', 'warehouse', 'expiry_date']
    
    def __str__(self):
        return f"{self.product.name} - {self.warehouse.code} ({self.quantity})"
    
    @property
    def available_quantity(self):
        """Quantity available for sale (total - reserved)"""
        return self.quantity - self.reserved_quantity
    
    @property
    def is_expired(self):
        """Check if the item has expired"""
        if self.expiry_date:
            return self.expiry_date < timezone.now().date()
        return False
    
    @property
    def expires_soon(self, days=30):
        """Check if the item expires within specified days"""
        if self.expiry_date:
            warning_date = timezone.now().date() + timezone.timedelta(days=days)
            return self.expiry_date <= warning_date
        return False

class StockMovement(models.Model):
    """Track all stock movements for audit and analytics"""
    MOVEMENT_TYPES = (
        ('receipt', 'Receipt'),
        ('shipment', 'Shipment'),
        ('adjustment', 'Adjustment'),
        ('transfer', 'Transfer'),
        ('return', 'Return'),
        ('damage', 'Damage'),
        ('expired', 'Expired'),
    )
    
    stock_item = models.ForeignKey(StockItem, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity_change = models.IntegerField()  # Can be negative for outgoing movements
    
    # References
    reference_type = models.CharField(max_length=50, blank=True)  # 'order', 'shipment', etc.
    reference_id = models.IntegerField(null=True, blank=True)
    
    # Details
    reason = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    
    # User tracking
    performed_by = models.ForeignKey(CustomUser, on_delete=models.PROTECT)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.movement_type} - {self.stock_item.product.name} ({self.quantity_change})"
'''

    with open("warehousing/models.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Created warehousing/models.py")


def run_setup():
    """Execute the model creation process"""
    print("🚀 Setting up enhanced Django models for Logistics Management System")
    print("=" * 70)

    create_accounts_models()
    create_inventory_models()
    create_warehousing_models()

    print("\n✅ Model setup completed!")
    print("Next steps:")
    print("1. Run: python manage.py makemigrations")
    print("2. Run: python manage.py migrate")
    print("3. Run: python manage.py createsuperuser")
    print(
        "4. Run: python setup_more_models.py for orders, transport, and analytics models"
    )


if __name__ == "__main__":
    run_setup()
