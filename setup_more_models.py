#!/usr/bin/env python3
"""
Part 2: Orders, Transport, and Analytics Models
Continuation of the enhanced Django models setup
"""


def create_orders_models():
    """Create comprehensive order management models"""
    content = '''from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from accounts.models import CustomUser
from inventory.models import Product
from warehousing.models import Warehouse
import uuid

class Customer(models.Model):
    """Enhanced customer model with comprehensive tracking"""
    # Basic information
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    
    # Address information
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    
    # Geolocation for delivery optimization
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Business information
    customer_type = models.CharField(max_length=20, choices=[
        ('individual', 'Individual'),
        ('business', 'Business'),
        ('enterprise', 'Enterprise')
    ], default='individual')
    
    tax_number = models.CharField(max_length=50, blank=True)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_terms = models.CharField(max_length=100, default='Payment on delivery')
    
    # Account linking
    user_account = models.OneToOneField(CustomUser, on_delete=models.SET_NULL, 
                                       null=True, blank=True, related_name='customer_profile')
    
    # Status and tracking
    is_active = models.BooleanField(default=True)
    total_orders = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Order(models.Model):
    """Enhanced order model with comprehensive tracking"""
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('ready_to_ship', 'Ready to Ship'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('returned', 'Returned'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    # Order identification
    order_number = models.CharField(max_length=50, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders')
    
    # Order details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    # Dates
    order_date = models.DateTimeField(default=timezone.now)
    requested_delivery_date = models.DateTimeField(null=True, blank=True)
    promised_delivery_date = models.DateTimeField(null=True, blank=True)
    
    # Delivery information
    delivery_address = models.TextField()
    delivery_city = models.CharField(max_length=100)
    delivery_state = models.CharField(max_length=100)
    delivery_postal_code = models.CharField(max_length=20)
    delivery_country = models.CharField(max_length=100)
    
    # Geolocation for delivery
    delivery_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Financial
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Special instructions
    delivery_instructions = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    
    # Processing information
    processed_by = models.ForeignKey(CustomUser, on_delete=models.PROTECT, null=True, blank=True)
    source_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-order_date']
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Order {self.order_number} - {self.customer.name}"
    
    def calculate_total(self):
        """Recalculate order totals"""
        self.subtotal = sum(item.line_total for item in self.items.all())
        self.total_amount = self.subtotal + self.tax_amount + self.shipping_cost - self.discount_amount
        self.save(update_fields=['subtotal', 'total_amount'])

class OrderItem(models.Model):
    """Individual items within an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    
    # Quantity and pricing
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Fulfillment tracking
    quantity_shipped = models.IntegerField(default=0)
    quantity_delivered = models.IntegerField(default=0)
    
    # Special requirements
    special_instructions = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        # Update order total
        self.order.calculate_total()
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity} (Order: {self.order.order_number})"
    
    @property
    def quantity_pending(self):
        """Quantity still to be shipped"""
        return self.quantity - self.quantity_shipped

class OrderStatusHistory(models.Model):
    """Track order status changes for audit trail"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(CustomUser, on_delete=models.PROTECT)
    change_reason = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Order Status Histories"
    
    def __str__(self):
        return f"{self.order.order_number}: {self.old_status} → {self.new_status}"
'''

    with open("orders/models.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Created orders/models.py")


def create_transport_models():
    """Create comprehensive transport and logistics models"""
    content = '''from django.db import models
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
    
    # Performance tracking
    fuel_efficiency_kmpl = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    current_mileage_km = models.IntegerField(default=0)
    
    # Status and maintenance
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_maintenance_date = models.DateField(null=True, blank=True)
    next_maintenance_due = models.DateField(null=True, blank=True)
    
    # Insurance and registration
    registration_expiry = models.DateField(null=True, blank=True)
    insurance_expiry = models.DateField(null=True, blank=True)
    insurance_policy_number = models.CharField(max_length=100, blank=True)
    
    # GPS tracking (if equipped)
    gps_device_id = models.CharField(max_length=100, blank=True)
    is_gps_enabled = models.BooleanField(default=False)
    
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
        return self.status == 'active' and not hasattr(self, 'current_shipment')

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
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    total_distance_km = models.IntegerField(default=0)
    
    # Status
    is_available = models.BooleanField(default=True)
    current_location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_location_lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
    
    # Emergency contact
    emergency_contact_name = models.CharField(max_length=100)
    emergency_contact_phone = models.CharField(max_length=20)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Driver: {self.user.get_full_name()} ({self.license_number})"

class Route(models.Model):
    """Planned routes with multiple stops"""
    route_name = models.CharField(max_length=200)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT)
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT)
    
    # Route details
    planned_date = models.DateField()
    estimated_duration_hours = models.DecimalField(max_digits=5, decimal_places=2)
    estimated_distance_km = models.DecimalField(max_digits=8, decimal_places=2)
    
    # Optimization data
    optimization_algorithm = models.CharField(max_length=50, default='google_ortools')
    optimization_timestamp = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=[
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ], default='planned')
    
    # Performance tracking
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    actual_distance_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    fuel_consumed_liters = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-planned_date']
    
    def __str__(self):
        return f"Route {self.route_name} - {self.planned_date}"

class Shipment(models.Model):
    """Enhanced shipment model linking orders to transport"""
    STATUS_CHOICES = (
        ('created', 'Created'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed_delivery', 'Failed Delivery'),
        ('returned', 'Returned to Warehouse'),
        ('cancelled', 'Cancelled'),
    )
    
    # Shipment identification
    shipment_number = models.CharField(max_length=50, unique=True, editable=False)
    orders = models.ManyToManyField(Order, related_name='shipments')
    
    # Transport assignment
    route = models.ForeignKey(Route, on_delete=models.PROTECT, null=True, blank=True)
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
    weight_utilization_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    volume_utilization_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Tracking information
    tracking_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
    
    # Delivery details
    delivered_to = models.CharField(max_length=100, blank=True)
    delivery_signature = models.ImageField(upload_to='signatures/', null=True, blank=True)
    delivery_photo = models.ImageField(upload_to='delivery_photos/', null=True, blank=True)
    delivery_notes = models.TextField(blank=True)
    
    # Performance metrics
    delivery_rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], 
                                        null=True, blank=True)
    customer_feedback = models.TextField(blank=True)
    
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
    
    def update_utilization(self):
        """Calculate and update capacity utilization"""
        if self.vehicle:
            self.weight_utilization_percent = min((self.total_weight_kg / self.vehicle.max_weight_kg) * 100, 100)
            self.volume_utilization_percent = min((self.total_volume_cbm / self.vehicle.max_volume_cbm) * 100, 100)
            self.save(update_fields=['weight_utilization_percent', 'volume_utilization_percent'])

class DeliveryAttempt(models.Model):
    """Track delivery attempts for failed deliveries"""
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='delivery_attempts')
    attempt_number = models.IntegerField()
    attempt_date = models.DateTimeField()
    
    # Attempt details
    status = models.CharField(max_length=20, choices=[
        ('successful', 'Successful'),
        ('failed', 'Failed'),
        ('customer_not_available', 'Customer Not Available'),
        ('address_incorrect', 'Address Incorrect'),
        ('refused', 'Refused by Customer'),
    ])
    
    notes = models.TextField(blank=True)
    next_attempt_scheduled = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-attempt_date']
        unique_together = ('shipment', 'attempt_number')
    
    def __str__(self):
        return f"Delivery Attempt {self.attempt_number} for {self.shipment.shipment_number}"
'''

    with open("transport/models.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Created transport/models.py")


def run_setup():
    """Execute the remaining model creation"""
    print("🚀 Creating remaining models: Orders, Transport, Analytics")
    print("=" * 60)

    create_orders_models()
    create_transport_models()

    print("\n✅ All models created successfully!")
    print("=" * 60)
    print("📋 COMPLETE SETUP CHECKLIST:")
    print("1. ✓ Run setup_project.bat to install packages and create Django project")
    print("2. ✓ Run setup_models.py (accounts, inventory, warehousing)")
    print("3. ✓ Run setup_more_models.py (orders, transport)")
    print("4. □ Create enhanced Django settings")
    print("5. □ Run makemigrations and migrate")
    print("6. □ Create superuser")
    print("7. □ Set up Django admin configurations")
    print("8. □ Create API serializers and viewsets")


if __name__ == "__main__":
    run_setup()
