from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from accounts.models import CustomUser
from orders.models import Order
import uuid

class Vehicle(models.Model):
    """Enhanced vehicle model with comprehensive tracking"""
    VEHICLE_TYPES = (
        ('van', 'Delivery Van'),
        ('truck', 'Truck'),
        ('lorry', 'Heavy Lorry'),
        ('motorcycle', 'Motorcycle'),
        ('bicycle', 'Bicycle'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('maintenance', 'Under Maintenance'),
        ('out_of_service', 'Out of Service'),
        ('retired', 'Retired'),
    )
    
    # Basic information
    license_plate = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.IntegerField()
    color = models.CharField(max_length=30)
    
    # Capacity specifications
    max_weight_kg = models.DecimalField(max_digits=8, decimal_places=2)
    max_volume_cbm = models.DecimalField(max_digits=8, decimal_places=2)
    max_items = models.IntegerField(default=100)
    
    # Status and maintenance
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    current_mileage_km = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['license_plate']
    
    def __str__(self):
        return f"{self.license_plate} - {self.make} {self.model}"
    
    @property
    def is_available(self):
        """Check if vehicle is available for assignment"""
        return self.status == 'active'

class Driver(models.Model):
    """Enhanced driver model with performance tracking"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='driver_profile')
    
    # License information
    license_number = models.CharField(max_length=50, unique=True)
    license_class = models.CharField(max_length=10)  # A, B, C, etc.
    license_expiry = models.DateField()
    
    # Vehicle assignment
    assigned_vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, 
                                       null=True, blank=True, related_name='current_driver')
    
    # Performance metrics
    total_deliveries = models.IntegerField(default=0)
    on_time_delivery_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    
    # Status
    is_available = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Driver: {self.user.get_full_name()} ({self.license_number})"

class Shipment(models.Model):
    """Enhanced shipment model linking orders to transport"""
    STATUS_CHOICES = (
        ('created', 'Created'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    
    # Shipment identification
    shipment_number = models.CharField(max_length=50, unique=True, editable=False)
    orders = models.ManyToManyField(Order, related_name='shipments')
    
    # Transport assignment
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT, null=True, blank=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, null=True, blank=True)
    
    # Status and dates
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    pickup_date = models.DateTimeField(null=True, blank=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    
    # Capacity utilization
    total_weight_kg = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_volume_cbm = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Tracking information
    tracking_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.shipment_number:
            self.shipment_number = f"SHP-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        if not self.tracking_number:
            self.tracking_number = f"TRK{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Shipment {self.shipment_number}"
