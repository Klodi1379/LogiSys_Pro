from django.contrib import admin
from .models import Supplier, ProductCategory, Product

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'rating', 'on_time_delivery_rate', 'is_active')
    list_filter = ('is_active', 'rating', 'created_at')
    search_fields = ('name', 'contact_person', 'email', 'tax_number')
    readonly_fields = ('total_orders', 'created_at', 'updated_at')

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'description')
    list_filter = ('parent',)
    search_fields = ('name', 'description')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'supplier', 'cost_price', 'is_active')
    list_filter = ('category', 'supplier', 'is_active', 'is_fragile', 'requires_refrigeration')
    search_fields = ('name', 'sku', 'barcode', 'description')
    readonly_fields = ('created_at', 'updated_at', 'volume')
    
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
            'fields': ('min_stock_level', 'max_stock_level', 'reorder_point')
        }),
        ('Properties', {
            'fields': ('is_fragile', 'requires_refrigeration', 'is_hazardous'),
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        })
    )
