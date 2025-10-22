from django.contrib import admin
from .models import (
    RevenueReport, InventoryAnalytics, DeliveryPerformance,
    CustomerAnalytics, WarehousePerformance, PredictiveAnalytics
)


@admin.register(RevenueReport)
class RevenueReportAdmin(admin.ModelAdmin):
    list_display = ['period', 'start_date', 'end_date', 'total_revenue', 'total_orders', 'average_order_value', 'growth_percentage']
    list_filter = ['period', 'start_date']
    search_fields = ['period']
    readonly_fields = ['created_at']
    date_hierarchy = 'start_date'


@admin.register(InventoryAnalytics)
class InventoryAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['product', 'warehouse', 'period_start', 'period_end', 'turnover_rate', 'days_of_inventory', 'total_value']
    list_filter = ['warehouse', 'period_start']
    search_fields = ['product__name', 'product__sku']
    readonly_fields = ['created_at']
    date_hierarchy = 'period_start'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product', 'warehouse')


@admin.register(DeliveryPerformance)
class DeliveryPerformanceAdmin(admin.ModelAdmin):
    list_display = ['driver', 'vehicle', 'shipment', 'scheduled_delivery', 'actual_delivery', 'is_on_time', 'customer_rating']
    list_filter = ['is_on_time', 'customer_rating', 'scheduled_delivery']
    search_fields = ['driver__user__first_name', 'driver__user__last_name', 'shipment__tracking_number']
    readonly_fields = ['pickup_delay_minutes', 'delivery_delay_minutes', 'created_at']
    date_hierarchy = 'scheduled_delivery'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('driver__user', 'vehicle', 'shipment')


@admin.register(CustomerAnalytics)
class CustomerAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['customer', 'period_start', 'period_end', 'total_orders', 'total_spent', 'customer_segment', 'predicted_lifetime_value']
    list_filter = ['customer_segment', 'period_start']
    search_fields = ['customer__name', 'customer__email']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'period_start'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer')


@admin.register(WarehousePerformance)
class WarehousePerformanceAdmin(admin.ModelAdmin):
    list_display = ['warehouse', 'period_start', 'period_end', 'orders_processed', 'picking_accuracy', 'capacity_utilization']
    list_filter = ['warehouse', 'period_start']
    search_fields = ['warehouse__name', 'warehouse__code']
    readonly_fields = ['created_at']
    date_hierarchy = 'period_start'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('warehouse')


@admin.register(PredictiveAnalytics)
class PredictiveAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['prediction_type', 'product', 'warehouse', 'forecast_date', 'predicted_value', 'confidence_score', 'accuracy']
    list_filter = ['prediction_type', 'forecast_date', 'algorithm_used']
    search_fields = ['product__name', 'warehouse__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'forecast_date'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product', 'warehouse')
