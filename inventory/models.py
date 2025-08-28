from django.db import models
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
