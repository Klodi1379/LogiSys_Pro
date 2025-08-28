from django.contrib import admin
from .models import Vehicle, Driver, Shipment

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('license_plate', 'vehicle_type', 'make', 'model', 'status', 'is_available')
    list_filter = ('vehicle_type', 'status', 'make')
    search_fields = ('license_plate', 'make', 'model')
    readonly_fields = ('is_available', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('license_plate', 'vehicle_type', 'make', 'model', 'year', 'color')
        }),
        ('Capacity', {
            'fields': ('max_weight_kg', 'max_volume_cbm', 'max_items')
        }),
        ('Status & Maintenance', {
            'fields': ('status', 'current_mileage_km', 'is_available')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )

@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('user', 'license_number', 'license_class', 'assigned_vehicle', 'is_available', 'total_deliveries')
    list_filter = ('license_class', 'is_available', 'license_expiry')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'license_number')
    readonly_fields = ('total_deliveries', 'on_time_delivery_rate', 'created_at', 'updated_at')

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('shipment_number', 'status', 'driver', 'vehicle', 'pickup_date', 'estimated_delivery')
    list_filter = ('status', 'pickup_date', 'driver', 'vehicle')
    search_fields = ('shipment_number', 'tracking_number')
    readonly_fields = ('shipment_number', 'tracking_number', 'created_at', 'updated_at')
    date_hierarchy = 'pickup_date'
    
    fieldsets = (
        ('Shipment Information', {
            'fields': ('shipment_number', 'tracking_number', 'status')
        }),
        ('Assignment', {
            'fields': ('driver', 'vehicle')
        }),
        ('Dates', {
            'fields': ('pickup_date', 'estimated_delivery', 'actual_delivery')
        }),
        ('Capacity', {
            'fields': ('total_weight_kg', 'total_volume_cbm')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )
