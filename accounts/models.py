from django.contrib.auth.models import AbstractUser
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
