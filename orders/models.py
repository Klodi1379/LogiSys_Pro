from django.db import models
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
    
    # Business information
    customer_type = models.CharField(max_length=20, choices=[
        ('individual', 'Individual'),
        ('business', 'Business'),
        ('enterprise', 'Enterprise')
    ], default='individual')
    
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
    
    # Delivery information
    delivery_address = models.TextField()
    delivery_city = models.CharField(max_length=100)
    
    # Financial
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
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
    
    def save(self, *args, **kwargs):
        self.line_total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity} (Order: {self.order.order_number})"
    
    @property
    def quantity_pending(self):
        """Quantity still to be shipped"""
        return self.quantity - self.quantity_shipped
