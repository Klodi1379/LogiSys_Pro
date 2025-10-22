from django.db import models
from django.utils import timezone
from accounts.models import CustomUser
from orders.models import Order, Customer
from inventory.models import Product
from warehousing.models import Warehouse
from transport.models import Vehicle, Driver, Shipment
from datetime import timedelta


class RevenueReport(models.Model):
    """Track revenue metrics over time"""
    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]

    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()

    # Revenue metrics
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_orders = models.IntegerField(default=0)
    average_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Growth metrics
    growth_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']
        unique_together = ['period', 'start_date']

    def __str__(self):
        return f"{self.period} Report: {self.start_date} to {self.end_date}"


class InventoryAnalytics(models.Model):
    """Track inventory performance and turnover"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='analytics')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, null=True, blank=True)

    # Period
    period_start = models.DateField()
    period_end = models.DateField()

    # Inventory metrics
    opening_stock = models.IntegerField(default=0)
    closing_stock = models.IntegerField(default=0)
    stock_received = models.IntegerField(default=0)
    stock_sold = models.IntegerField(default=0)
    stock_adjusted = models.IntegerField(default=0)

    # Performance metrics
    turnover_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    days_of_inventory = models.IntegerField(default=0)
    stockout_days = models.IntegerField(default=0)

    # Financial
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-period_end']
        verbose_name_plural = 'Inventory Analytics'

    def __str__(self):
        return f"{self.product.name} - {self.period_start} to {self.period_end}"

    def calculate_turnover(self):
        """Calculate inventory turnover rate"""
        avg_inventory = (self.opening_stock + self.closing_stock) / 2
        if avg_inventory > 0:
            self.turnover_rate = self.stock_sold / avg_inventory
        else:
            self.turnover_rate = 0


class DeliveryPerformance(models.Model):
    """Track delivery and shipment performance"""
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='performance_records')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, null=True, blank=True)
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='performance')

    # Timing metrics
    scheduled_pickup = models.DateTimeField()
    actual_pickup = models.DateTimeField()
    scheduled_delivery = models.DateTimeField()
    actual_delivery = models.DateTimeField(null=True, blank=True)

    # Performance metrics
    pickup_delay_minutes = models.IntegerField(default=0)
    delivery_delay_minutes = models.IntegerField(default=0, null=True, blank=True)
    is_on_time = models.BooleanField(default=True)

    # Distance and efficiency
    planned_distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    actual_distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0, null=True, blank=True)
    fuel_consumption_liters = models.DecimalField(max_digits=8, decimal_places=2, default=0, null=True, blank=True)

    # Customer satisfaction
    customer_rating = models.IntegerField(default=5, choices=[(i, str(i)) for i in range(1, 6)])
    customer_feedback = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_delivery']

    def __str__(self):
        return f"Delivery Performance - {self.driver.user.get_full_name()} - {self.scheduled_delivery.date()}"

    def calculate_delays(self):
        """Calculate pickup and delivery delays"""
        self.pickup_delay_minutes = int((self.actual_pickup - self.scheduled_pickup).total_seconds() / 60)

        if self.actual_delivery:
            self.delivery_delay_minutes = int((self.actual_delivery - self.scheduled_delivery).total_seconds() / 60)
            self.is_on_time = self.delivery_delay_minutes <= 30  # 30 minutes tolerance

        self.save()


class CustomerAnalytics(models.Model):
    """Track customer behavior and value"""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='analytics')

    # Period
    period_start = models.DateField()
    period_end = models.DateField()

    # Order metrics
    total_orders = models.IntegerField(default=0)
    completed_orders = models.IntegerField(default=0)
    cancelled_orders = models.IntegerField(default=0)

    # Financial metrics
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Behavior metrics
    order_frequency_days = models.IntegerField(default=0)
    last_order_date = models.DateField(null=True, blank=True)
    days_since_last_order = models.IntegerField(default=0)

    # Segmentation
    customer_segment = models.CharField(max_length=20, choices=[
        ('new', 'New Customer'),
        ('active', 'Active Customer'),
        ('vip', 'VIP Customer'),
        ('at_risk', 'At Risk'),
        ('churned', 'Churned'),
    ], default='new')

    # Lifetime value prediction
    predicted_lifetime_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_end']
        verbose_name_plural = 'Customer Analytics'

    def __str__(self):
        return f"{self.customer.name} Analytics - {self.period_start} to {self.period_end}"

    def calculate_segment(self):
        """Determine customer segment based on behavior"""
        if self.total_orders == 0:
            self.customer_segment = 'new'
        elif self.total_spent > 10000:
            self.customer_segment = 'vip'
        elif self.days_since_last_order > 90:
            self.customer_segment = 'at_risk'
        elif self.days_since_last_order > 180:
            self.customer_segment = 'churned'
        else:
            self.customer_segment = 'active'


class WarehousePerformance(models.Model):
    """Track warehouse operational performance"""
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='performance_records')

    # Period
    period_start = models.DateField()
    period_end = models.DateField()

    # Operational metrics
    orders_processed = models.IntegerField(default=0)
    items_shipped = models.IntegerField(default=0)
    items_received = models.IntegerField(default=0)

    # Accuracy metrics
    picking_accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)  # percentage
    packing_accuracy = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)

    # Speed metrics
    average_picking_time_minutes = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    average_packing_time_minutes = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    # Capacity utilization
    capacity_utilization = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # percentage

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-period_end']

    def __str__(self):
        return f"{self.warehouse.name} Performance - {self.period_start} to {self.period_end}"


class PredictiveAnalytics(models.Model):
    """Store predictive analytics and forecasts"""
    PREDICTION_TYPE_CHOICES = [
        ('demand', 'Demand Forecast'),
        ('revenue', 'Revenue Forecast'),
        ('stock', 'Stock Requirement'),
        ('delivery', 'Delivery Time Prediction'),
    ]

    prediction_type = models.CharField(max_length=20, choices=PREDICTION_TYPE_CHOICES)

    # Target
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, null=True, blank=True)

    # Forecast period
    forecast_date = models.DateField()
    forecast_period_days = models.IntegerField(default=30)

    # Prediction
    predicted_value = models.DecimalField(max_digits=12, decimal_places=2)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # 0-100

    # Actual (for accuracy tracking)
    actual_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Model info
    model_version = models.CharField(max_length=50, default='v1.0')
    algorithm_used = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-forecast_date']
        verbose_name_plural = 'Predictive Analytics'

    def __str__(self):
        return f"{self.get_prediction_type_display()} - {self.forecast_date}"

    def calculate_accuracy(self):
        """Calculate prediction accuracy once actual value is known"""
        if self.actual_value is not None:
            error = abs(float(self.predicted_value) - float(self.actual_value))
            mape = (error / float(self.actual_value)) * 100 if self.actual_value > 0 else 0
            self.accuracy = 100 - min(mape, 100)
            self.save()
