from django.contrib import admin
from .models import Warehouse, StorageLocation, StockItem

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'city', 'manager', 'is_active')
    list_filter = ('is_active', 'city', 'country')
    search_fields = ('name', 'code', 'address', 'city')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(StorageLocation)
class StorageLocationAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'warehouse', 'max_weight_kg', 'used_capacity', 'is_available')
    list_filter = ('warehouse', 'is_available')
    search_fields = ('warehouse__name', 'zone', 'aisle', 'rack', 'shelf')

@admin.register(StockItem)
class StockItemAdmin(admin.ModelAdmin):
    list_display = ('product', 'warehouse', 'location', 'quantity', 'available_quantity', 'expiry_date')
    list_filter = ('warehouse', 'received_date', 'expiry_date')
    search_fields = ('product__name', 'product__sku', 'batch_number')
    readonly_fields = ('available_quantity', 'created_at', 'updated_at')
