from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserProfile

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Enhanced admin for CustomUser"""
    list_display = ('username', 'email', 'role', 'is_active_driver', 'date_joined', 'is_active')
    list_filter = ('role', 'is_active', 'is_active_driver', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone_number')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone_number', 'date_of_birth', 'address', 'is_active_driver')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone_number', 'address')
        }),
    )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'license_expiry', 'emergency_contact')
    list_filter = ('license_expiry',)
    search_fields = ('user__username', 'license_number', 'emergency_contact')
