from django.db import models
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
