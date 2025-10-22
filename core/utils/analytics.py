"""
Analytics calculation utilities
"""
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from datetime import timedelta, datetime
from typing import Dict, List, Optional
import numpy as np
from scipy import stats
import logging

logger = logging.getLogger(__name__)


class AnalyticsCalculator:
    """Calculate various analytics and metrics"""

    @staticmethod
    def calculate_revenue_metrics(start_date: datetime, end_date: datetime) -> Dict:
        """
        Calculate revenue metrics for a period

        Args:
            start_date: Start of period
            end_date: End of period

        Returns:
            Dict with revenue metrics
        """
        from orders.models import Order

        orders = Order.objects.filter(
            order_date__range=[start_date, end_date],
            status__in=['confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered']
        )

        metrics = orders.aggregate(
            total_revenue=Sum('total_amount'),
            total_orders=Count('id'),
            average_order_value=Avg('total_amount')
        )

        # Calculate growth if previous period data exists
        prev_start = start_date - (end_date - start_date)
        prev_orders = Order.objects.filter(
            order_date__range=[prev_start, start_date],
            status__in=['confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered']
        )
        prev_revenue = prev_orders.aggregate(total=Sum('total_amount'))['total'] or 0

        if prev_revenue > 0:
            current_revenue = float(metrics['total_revenue'] or 0)
            growth = ((current_revenue - float(prev_revenue)) / float(prev_revenue)) * 100
            metrics['growth_percentage'] = round(growth, 2)
        else:
            metrics['growth_percentage'] = 0

        return {
            'period': {'start': start_date, 'end': end_date},
            'total_revenue': float(metrics['total_revenue'] or 0),
            'total_orders': metrics['total_orders'] or 0,
            'average_order_value': float(metrics['average_order_value'] or 0),
            'growth_percentage': metrics['growth_percentage']
        }

    @staticmethod
    def calculate_inventory_turnover(product, period_days: int = 30) -> Dict:
        """
        Calculate inventory turnover for a product

        Args:
            product: Product object
            period_days: Period in days

        Returns:
            Dict with turnover metrics
        """
        from warehousing.models import StockItem
        from orders.models import OrderItem

        end_date = timezone.now()
        start_date = end_date - timedelta(days=period_days)

        # Get stock levels
        current_stock = product.current_stock
        stock_items = StockItem.objects.filter(product=product)

        opening_stock = current_stock  # Simplified - would need historical data

        # Get units sold
        units_sold = OrderItem.objects.filter(
            order__order_date__range=[start_date, end_date],
            product=product,
            order__status__in=['shipped', 'delivered']
        ).aggregate(total=Sum('quantity'))['total'] or 0

        # Calculate turnover
        avg_inventory = (opening_stock + current_stock) / 2
        turnover_rate = units_sold / avg_inventory if avg_inventory > 0 else 0

        # Days of inventory
        days_of_inventory = period_days / turnover_rate if turnover_rate > 0 else 0

        return {
            'product': str(product),
            'period_days': period_days,
            'opening_stock': opening_stock,
            'closing_stock': current_stock,
            'units_sold': units_sold,
            'average_inventory': avg_inventory,
            'turnover_rate': round(turnover_rate, 2),
            'days_of_inventory': round(days_of_inventory, 1)
        }

    @staticmethod
    def calculate_delivery_performance(driver, period_days: int = 30) -> Dict:
        """
        Calculate delivery performance metrics for a driver

        Args:
            driver: Driver object
            period_days: Period in days

        Returns:
            Dict with performance metrics
        """
        from transport.models import Shipment

        end_date = timezone.now()
        start_date = end_date - timedelta(days=period_days)

        shipments = Shipment.objects.filter(
            driver=driver,
            shipment_date__range=[start_date, end_date]
        )

        total_deliveries = shipments.count()
        completed_deliveries = shipments.filter(status='delivered').count()

        # On-time delivery rate
        on_time = 0
        total_delay_minutes = 0

        for shipment in shipments.filter(status='delivered'):
            if shipment.scheduled_delivery and shipment.actual_delivery:
                delay = (shipment.actual_delivery - shipment.scheduled_delivery).total_seconds() / 60
                if delay <= 30:  # 30 min tolerance
                    on_time += 1
                total_delay_minutes += max(0, delay)

        on_time_rate = (on_time / completed_deliveries * 100) if completed_deliveries > 0 else 0
        avg_delay = total_delay_minutes / completed_deliveries if completed_deliveries > 0 else 0

        return {
            'driver': str(driver),
            'period_days': period_days,
            'total_deliveries': total_deliveries,
            'completed_deliveries': completed_deliveries,
            'on_time_deliveries': on_time,
            'on_time_rate': round(on_time_rate, 2),
            'average_delay_minutes': round(avg_delay, 1),
            'completion_rate': round(completed_deliveries / total_deliveries * 100, 2) if total_deliveries > 0 else 0
        }

    @staticmethod
    def calculate_customer_lifetime_value(customer) -> Dict:
        """
        Calculate customer lifetime value (CLV)

        Args:
            customer: Customer object

        Returns:
            Dict with CLV metrics
        """
        from orders.models import Order

        orders = Order.objects.filter(
            customer=customer,
            status__in=['confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered']
        )

        if not orders.exists():
            return {
                'customer': str(customer),
                'total_orders': 0,
                'total_spent': 0,
                'average_order_value': 0,
                'predicted_clv': 0
            }

        metrics = orders.aggregate(
            total_orders=Count('id'),
            total_spent=Sum('total_amount'),
            avg_order_value=Avg('total_amount')
        )

        # Calculate order frequency
        first_order = orders.earliest('order_date')
        last_order = orders.latest('order_date')
        days_active = (last_order.order_date - first_order.order_date).days + 1
        order_frequency = metrics['total_orders'] / (days_active / 30) if days_active > 30 else metrics['total_orders']

        # Simple CLV prediction (can be enhanced with ML)
        avg_order_value = float(metrics['avg_order_value'] or 0)
        predicted_lifetime_months = 24  # Assumption
        predicted_clv = avg_order_value * order_frequency * predicted_lifetime_months

        return {
            'customer': str(customer),
            'total_orders': metrics['total_orders'],
            'total_spent': float(metrics['total_spent'] or 0),
            'average_order_value': avg_order_value,
            'order_frequency_per_month': round(order_frequency, 2),
            'days_active': days_active,
            'predicted_clv': round(predicted_clv, 2)
        }

    @staticmethod
    def forecast_demand(product, days_ahead: int = 30, historical_days: int = 90) -> Dict:
        """
        Forecast product demand using linear regression

        Args:
            product: Product object
            days_ahead: Number of days to forecast
            historical_days: Days of historical data to use

        Returns:
            Dict with forecast
        """
        from orders.models import OrderItem

        end_date = timezone.now()
        start_date = end_date - timedelta(days=historical_days)

        # Get daily sales
        daily_sales = {}
        for i in range(historical_days):
            date = start_date + timedelta(days=i)
            sales = OrderItem.objects.filter(
                product=product,
                order__order_date__date=date.date(),
                order__status__in=['confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered']
            ).aggregate(total=Sum('quantity'))['total'] or 0
            daily_sales[date.date()] = sales

        if not daily_sales or sum(daily_sales.values()) == 0:
            return {
                'product': str(product),
                'forecast_days': days_ahead,
                'predicted_demand': 0,
                'confidence': 0,
                'error': 'Insufficient historical data'
            }

        # Prepare data for regression
        x = np.array(range(len(daily_sales)))
        y = np.array(list(daily_sales.values()))

        # Linear regression
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

        # Forecast
        forecast_x = np.array(range(len(daily_sales), len(daily_sales) + days_ahead))
        forecast_y = slope * forecast_x + intercept

        # Calculate confidence
        confidence = abs(r_value) * 100

        return {
            'product': str(product),
            'historical_days': historical_days,
            'forecast_days': days_ahead,
            'predicted_demand': max(0, round(forecast_y.sum(), 0)),
            'daily_average': max(0, round(forecast_y.mean(), 2)),
            'confidence': round(confidence, 2),
            'trend': 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable'
        }

    @staticmethod
    def calculate_warehouse_utilization(warehouse) -> Dict:
        """
        Calculate warehouse capacity utilization

        Args:
            warehouse: Warehouse object

        Returns:
            Dict with utilization metrics
        """
        from warehousing.models import StockItem

        stock_items = StockItem.objects.filter(warehouse=warehouse)

        # Calculate total volume and weight
        total_volume = 0
        total_weight = 0

        for item in stock_items:
            product = item.product
            total_volume += (product.volume or 0) * item.quantity
            total_weight += (product.weight or 0) * item.quantity

        # Calculate utilization
        capacity_utilization = 0
        if warehouse.capacity:
            capacity_utilization = (total_weight / float(warehouse.capacity)) * 100

        return {
            'warehouse': str(warehouse),
            'total_stock_items': stock_items.count(),
            'total_volume_m3': round(total_volume, 2),
            'total_weight_kg': round(total_weight, 2),
            'capacity_kg': float(warehouse.capacity or 0),
            'capacity_utilization': round(min(capacity_utilization, 100), 2),
            'available_capacity_kg': max(0, float(warehouse.capacity or 0) - total_weight)
        }

    @staticmethod
    def identify_slow_moving_items(warehouse=None, days: int = 90, threshold: int = 5) -> List[Dict]:
        """
        Identify slow-moving inventory items

        Args:
            warehouse: Optional warehouse filter
            days: Period to analyze
            threshold: Maximum number of sales to be considered slow-moving

        Returns:
            List of slow-moving items
        """
        from inventory.models import Product
        from orders.models import OrderItem
        from warehousing.models import StockItem

        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)

        # Get all products with stock
        stock_query = StockItem.objects.all()
        if warehouse:
            stock_query = stock_query.filter(warehouse=warehouse)

        products = Product.objects.filter(
            stockitem__in=stock_query
        ).distinct()

        slow_moving = []

        for product in products:
            # Get sales count
            sales = OrderItem.objects.filter(
                product=product,
                order__order_date__range=[start_date, end_date],
                order__status__in=['confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered']
            ).aggregate(total=Sum('quantity'))['total'] or 0

            if sales <= threshold:
                current_stock = product.current_stock
                stock_value = float(product.price) * current_stock

                slow_moving.append({
                    'product': str(product),
                    'sku': product.sku,
                    'current_stock': current_stock,
                    'sales_in_period': sales,
                    'days_of_stock': (current_stock / sales * days) if sales > 0 else 999,
                    'stock_value': round(stock_value, 2)
                })

        # Sort by stock value (highest first)
        slow_moving.sort(key=lambda x: x['stock_value'], reverse=True)

        return slow_moving
