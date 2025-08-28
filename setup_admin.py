#!/usr/bin/env python3
"""
Comprehensive Django Admin Configuration Generator
Creates admin interfaces for all logistics models with enhanced functionality
"""


def create_accounts_admin():
    """Admin configuration for accounts app"""
    content = '''from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserProfile, Permission, RolePermission

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
    date_hierarchy = 'license_expiry'

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'codename', 'description')
    search_fields = ('name', 'codename')

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission')
    list_filter = ('role', 'permission')
'''

    with open("admin_configs/accounts_admin.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Created accounts admin configuration")


def create_inventory_admin():
    """Admin configuration for inventory app"""
    content = """from django.contrib import admin
from .models import Supplier, ProductCategory, Product, InventoryForecast

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'rating', 'on_time_delivery_rate', 'is_active')
    list_filter = ('is_active', 'rating', 'created_at')
    search_fields = ('name', 'contact_person', 'email', 'tax_number')
    readonly_fields = ('total_orders', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'contact_person', 'email', 'phone', 'address')
        }),
        ('Business Details', {
            'fields': ('tax_number', 'payment_terms', 'credit_limit')
        }),
        ('Performance', {
            'fields': ('rating', 'total_orders', 'on_time_delivery_rate'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        })
    )

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'description')
    list_filter = ('parent',)
    search_fields = ('name', 'description')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'supplier', 'cost_price', 'current_stock', 'is_active')
    list_filter = ('category', 'supplier', 'is_active', 'is_fragile', 'requires_refrigeration')
    search_fields = ('name', 'sku', 'barcode', 'description')
    readonly_fields = ('created_at', 'updated_at', 'current_stock', 'volume')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'sku', 'barcode', 'description', 'category', 'supplier')
        }),
        ('Physical Attributes', {
            'fields': ('weight', 'length', 'width', 'height', 'volume')
        }),
        ('Pricing', {
            'fields': ('cost_price', 'selling_price')
        }),
        ('Inventory Settings', {
            'fields': ('min_stock_level', 'max_stock_level', 'reorder_point', 'current_stock')
        }),
        ('Properties', {
            'fields': ('is_fragile', 'requires_refrigeration', 'is_hazardous'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        })
    )
    
    actions = ['mark_as_active', 'mark_as_inactive']
    
    def mark_as_active(self, request, queryset):
        queryset.update(is_active=True)
    mark_as_active.short_description = "Mark selected products as active"
    
    def mark_as_inactive(self, request, queryset):
        queryset.update(is_active=False)
    mark_as_inactive.short_description = "Mark selected products as inactive"

@admin.register(InventoryForecast)
class InventoryForecastAdmin(admin.ModelAdmin):
    list_display = ('product', 'forecast_date', 'predicted_demand', 'confidence_level', 'algorithm_used')
    list_filter = ('forecast_date', 'algorithm_used', 'confidence_level')
    search_fields = ('product__name', 'product__sku')
    date_hierarchy = 'forecast_date'
    readonly_fields = ('created_at',)
"""

    with open("admin_configs/inventory_admin.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Created inventory admin configuration")


def create_warehousing_admin():
    """Admin configuration for warehousing app"""
    content = """from django.contrib import admin
from .models import Warehouse, StorageLocation, StockItem, StockMovement

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'city', 'manager', 'utilization_percentage', 'is_active')
    list_filter = ('is_active', 'city', 'country')
    search_fields = ('name', 'code', 'address', 'city')
    readonly_fields = ('utilization_percentage', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'manager')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'postal_code', 'country', 'latitude', 'longitude')
        }),
        ('Capacity', {
            'fields': ('total_capacity_sqm', 'total_capacity_cbm', 'utilization_percentage')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        })
    )

@admin.register(StorageLocation)
class StorageLocationAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'warehouse', 'max_weight_kg', 'used_capacity', 'is_available')
    list_filter = ('warehouse', 'is_available', 'is_temperature_controlled')
    search_fields = ('warehouse__name', 'zone', 'aisle', 'rack', 'shelf')
    
    fieldsets = (
        ('Location', {
            'fields': ('warehouse', 'zone', 'aisle', 'rack', 'shelf', 'bin')
        }),
        ('Capacity', {
            'fields': ('max_weight_kg', 'max_volume_cbm', 'used_capacity')
        }),
        ('Environment', {
            'fields': ('is_temperature_controlled', 'temperature_min', 'temperature_max')
        }),
        ('Status', {
            'fields': ('is_available', 'created_at')
        })
    )

@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ('product', 'warehouse', 'location', 'quantity', 'available_quantity', 'expiry_date')
    list_filter = ('warehouse', 'received_date', 'expiry_date')
    search_fields = ('product__name', 'product__sku', 'batch_number')
    readonly_fields = ('available_quantity', 'is_expired', 'created_at', 'updated_at')
    date_hierarchy = 'received_date'
    
    fieldsets = (
        ('Product & Location', {
            'fields': ('product', 'warehouse', 'location')
        }),
        ('Quantity', {
            'fields': ('quantity', 'reserved_quantity', 'available_quantity')
        }),
        ('Batch Information', {
            'fields': ('batch_number', 'manufacturing_date', 'expiry_date', 'is_expired')
        }),
        ('Cost & Dates', {
            'fields': ('unit_cost', 'received_date', 'last_movement', 'created_at', 'updated_at')
        })
    )

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('stock_item', 'movement_type', 'quantity_change', 'performed_by', 'created_at')
    list_filter = ('movement_type', 'created_at', 'performed_by')
    search_fields = ('stock_item__product__name', 'reason', 'notes')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Movement Details', {
            'fields': ('stock_item', 'movement_type', 'quantity_change', 'performed_by')
        }),
        ('Reference', {
            'fields': ('reference_type', 'reference_id')
        }),
        ('Notes', {
            'fields': ('reason', 'notes', 'created_at')
        })
    )
"""

    with open("admin_configs/warehousing_admin.py", "w", encoding="utf-8") as f:
        f.write(content)
    print("✓ Created warehousing admin configuration")


def setup_admin_directory():
    """Create admin configs directory and __init__ file"""
    import os

    os.makedirs("admin_configs", exist_ok=True)

    with open("admin_configs/__init__.py", "w") as f:
        f.write("# Admin configurations for all apps\n")

    print("✓ Created admin_configs directory")


def run_setup():
    """Execute admin configuration creation"""
    print("🏗️  Creating Django Admin Configurations")
    print("=" * 50)

    setup_admin_directory()
    create_accounts_admin()
    create_inventory_admin()
    create_warehousing_admin()

    print("\n✅ Admin configurations created!")
    print("📋 Remember to:")
    print("1. Copy these configurations to their respective apps' admin.py files")
    print("2. Import necessary dependencies in each admin.py")
    print("3. Run migrations and create superuser to access admin")


if __name__ == "__main__":
    run_setup()
