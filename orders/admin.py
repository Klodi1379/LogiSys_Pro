from django.contrib import admin
from .models import Customer, Order, OrderItem

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'customer_type', 'total_orders', 'total_spent', 'is_active')
    list_filter = ('customer_type', 'is_active', 'created_at')
    search_fields = ('name', 'email', 'phone')
    readonly_fields = ('total_orders', 'total_spent', 'created_at', 'updated_at')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'status', 'priority', 'order_date', 'total_amount')
    list_filter = ('status', 'priority', 'order_date', 'source_warehouse')
    search_fields = ('order_number', 'customer__name', 'customer__email')
    readonly_fields = ('order_number', 'created_at', 'updated_at')
    date_hierarchy = 'order_date'

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'unit_price', 'line_total', 'quantity_pending')
    list_filter = ('order__status', 'order__order_date')
    search_fields = ('order__order_number', 'product__name', 'product__sku')
    readonly_fields = ('line_total', 'quantity_pending')
