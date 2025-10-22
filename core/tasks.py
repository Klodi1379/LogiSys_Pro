"""
Celery tasks for automated workflows
"""
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mass_mail
from datetime import timedelta
from core.utils import NotificationService, AnalyticsCalculator, AuditLogger
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_low_stock_alerts():
    """Check for low stock products and send notifications"""
    from inventory.models import Product

    logger.info("Starting low stock check...")

    low_stock_count = 0
    products = Product.objects.filter(is_active=True)

    for product in products:
        current_stock = product.current_stock

        if current_stock <= product.reorder_point:
            NotificationService.notify_low_stock(product, current_stock)
            low_stock_count += 1

            if current_stock == 0:
                NotificationService.notify_out_of_stock(product)

    logger.info(f"Low stock check completed: {low_stock_count} products below reorder point")
    return {'low_stock_count': low_stock_count}


@shared_task
def generate_daily_revenue_report():
    """Generate daily revenue report"""
    from analytics.models import RevenueReport

    logger.info("Generating daily revenue report...")

    today = timezone.now().date()
    yesterday = today - timedelta(days=1)

    metrics = AnalyticsCalculator.calculate_revenue_metrics(
        start_date=timezone.make_aware(timezone.datetime.combine(yesterday, timezone.datetime.min.time())),
        end_date=timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
    )

    report, created = RevenueReport.objects.update_or_create(
        period='daily',
        start_date=yesterday,
        defaults={
            'end_date': yesterday,
            'total_revenue': metrics['total_revenue'],
            'total_orders': metrics['total_orders'],
            'average_order_value': metrics['average_order_value'],
            'growth_percentage': metrics['growth_percentage']
        }
    )

    logger.info(f"Daily revenue report generated: ${metrics['total_revenue']}")
    return {'report_id': report.id, 'revenue': float(metrics['total_revenue'])}


@shared_task
def calculate_inventory_analytics():
    """Calculate inventory analytics for all products"""
    from inventory.models import Product
    from analytics.models import InventoryAnalytics

    logger.info("Calculating inventory analytics...")

    today = timezone.now().date()
    period_start = today - timedelta(days=30)

    processed = 0
    products = Product.objects.filter(is_active=True)

    for product in products:
        metrics = AnalyticsCalculator.calculate_inventory_turnover(product, period_days=30)

        InventoryAnalytics.objects.update_or_create(
            product=product,
            period_start=period_start,
            period_end=today,
            defaults={
                'opening_stock': metrics['opening_stock'],
                'closing_stock': metrics['closing_stock'],
                'stock_sold': metrics['units_sold'],
                'turnover_rate': metrics['turnover_rate'],
                'days_of_inventory': metrics['days_of_inventory'],
                'total_value': product.price * metrics['closing_stock']
            }
        )
        processed += 1

    logger.info(f"Inventory analytics calculated for {processed} products")
    return {'products_processed': processed}


@shared_task
def update_customer_analytics():
    """Update customer analytics and segmentation"""
    from orders.models import Customer
    from analytics.models import CustomerAnalytics

    logger.info("Updating customer analytics...")

    today = timezone.now().date()
    period_start = today - timedelta(days=90)

    processed = 0
    customers = Customer.objects.filter(is_active=True)

    for customer in customers:
        clv_metrics = AnalyticsCalculator.calculate_customer_lifetime_value(customer)

        orders = customer.orders.filter(
            order_date__date__range=[period_start, today],
            status__in=['confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered']
        )

        total_orders = orders.count()
        completed_orders = orders.filter(status='delivered').count()
        total_spent = sum(order.total_amount for order in orders)

        # Calculate days since last order
        last_order = customer.orders.order_by('-order_date').first()
        days_since_last_order = (today - last_order.order_date.date()).days if last_order else 999

        analytics, created = CustomerAnalytics.objects.update_or_create(
            customer=customer,
            period_start=period_start,
            period_end=today,
            defaults={
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'total_spent': total_spent,
                'average_order_value': total_spent / total_orders if total_orders > 0 else 0,
                'days_since_last_order': days_since_last_order,
                'predicted_lifetime_value': clv_metrics['predicted_clv']
            }
        )

        # Update segmentation
        analytics.calculate_segment()
        analytics.save()
        processed += 1

    logger.info(f"Customer analytics updated for {processed} customers")
    return {'customers_processed': processed}


@shared_task
def send_daily_digest_emails():
    """Send daily digest emails to users who opted in"""
    from accounts.models import CustomUser
    from core.models import NotificationPreference
    from orders.models import Order
    from transport.models import Shipment

    logger.info("Sending daily digest emails...")

    today = timezone.now().date()
    yesterday = today - timedelta(days=1)

    # Get users who want daily digest
    preferences = NotificationPreference.objects.filter(daily_digest=True)

    emails = []
    for pref in preferences:
        user = pref.user

        # Gather stats for the user
        if user.role in ['admin', 'warehouse_manager']:
            orders_yesterday = Order.objects.filter(
                order_date__date=yesterday
            ).count()

            shipments_yesterday = Shipment.objects.filter(
                shipment_date__date=yesterday
            ).count()

            subject = f"Daily Digest - {yesterday}"
            message = f"""
            Hello {user.get_full_name()},

            Here's your daily summary for {yesterday}:

            Orders: {orders_yesterday}
            Shipments: {shipments_yesterday}

            Login to view more details: {settings.SITE_URL}

            Best regards,
            LogiSys Pro Team
            """

            emails.append((subject, message, settings.DEFAULT_FROM_EMAIL, [user.email]))

    if emails:
        send_mass_mail(emails, fail_silently=True)

    logger.info(f"Daily digest emails sent to {len(emails)} users")
    return {'emails_sent': len(emails)}


@shared_task
def clean_old_notifications():
    """Delete old read notifications"""
    from core.models import Notification

    days_to_keep = 30
    deleted_count = NotificationService.delete_old_notifications(days=days_to_keep)

    logger.info(f"Cleaned {deleted_count} old notifications")
    return {'deleted_count': deleted_count}


@shared_task
def forecast_product_demand():
    """Forecast demand for all active products"""
    from inventory.models import Product
    from analytics.models import PredictiveAnalytics

    logger.info("Forecasting product demand...")

    today = timezone.now().date()
    forecast_days = 30

    processed = 0
    products = Product.objects.filter(is_active=True)

    for product in products:
        forecast = AnalyticsCalculator.forecast_demand(product, days_ahead=forecast_days)

        if 'error' not in forecast:
            PredictiveAnalytics.objects.update_or_create(
                prediction_type='demand',
                product=product,
                forecast_date=today,
                defaults={
                    'forecast_period_days': forecast_days,
                    'predicted_value': forecast['predicted_demand'],
                    'confidence_score': forecast['confidence'],
                    'algorithm_used': 'Linear Regression'
                }
            )
            processed += 1

    logger.info(f"Demand forecasted for {processed} products")
    return {'products_processed': processed}


@shared_task
def process_webhook(webhook_id: int, event_type: str, payload: dict):
    """Process and send webhook"""
    from core.models import Webhook, WebhookLog
    import requests
    from time import time

    try:
        webhook = Webhook.objects.get(id=webhook_id, is_active=True)
    except Webhook.DoesNotExist:
        logger.error(f"Webhook {webhook_id} not found or inactive")
        return

    # Create log entry
    log = WebhookLog.objects.create(
        webhook=webhook,
        event_type=event_type,
        payload=payload,
        status='pending'
    )

    try:
        # Prepare headers
        headers = {'Content-Type': 'application/json'}
        if webhook.auth_header:
            headers['Authorization'] = webhook.auth_header

        # Send request
        start_time = time()
        response = requests.post(
            webhook.url,
            json=payload,
            headers=headers,
            timeout=30
        )
        response_time = int((time() - start_time) * 1000)

        # Update log
        log.status_code = response.status_code
        log.response_body = response.text[:5000]  # Limit size
        log.response_time_ms = response_time
        log.completed_at = timezone.now()

        if response.status_code < 400:
            log.status = 'success'
            webhook.successful_calls += 1
            webhook.last_success = timezone.now()
        else:
            log.status = 'failed'
            log.error_message = f"HTTP {response.status_code}"
            webhook.failed_calls += 1
            webhook.last_failure = timezone.now()

    except Exception as e:
        log.status = 'failed'
        log.error_message = str(e)
        log.completed_at = timezone.now()
        webhook.failed_calls += 1
        webhook.last_failure = timezone.now()

        # Retry if enabled
        if webhook.retry_on_failure and log.retry_count < webhook.max_retries:
            log.retry_count += 1
            log.status = 'retrying'
            log.save()

            # Schedule retry
            process_webhook.apply_async(
                args=[webhook_id, event_type, payload],
                countdown=60 * (2 ** log.retry_count)  # Exponential backoff
            )

    finally:
        log.save()
        webhook.total_calls += 1
        webhook.last_called = timezone.now()
        webhook.save()

    logger.info(f"Webhook {webhook.name} processed: {log.status}")
    return {'log_id': log.id, 'status': log.status}


@shared_task
def auto_confirm_pending_orders():
    """Automatically confirm orders that have been pending for a certain time"""
    from orders.models import Order

    logger.info("Auto-confirming pending orders...")

    # Get orders pending for more than 1 hour
    cutoff_time = timezone.now() - timedelta(hours=1)
    pending_orders = Order.objects.filter(
        status='pending',
        order_date__lte=cutoff_time
    )

    confirmed_count = 0
    for order in pending_orders:
        order.status = 'confirmed'
        order.save()

        # Send notification
        NotificationService.notify_order_status_changed(order, 'pending', 'confirmed')
        confirmed_count += 1

    logger.info(f"Auto-confirmed {confirmed_count} orders")
    return {'confirmed_count': confirmed_count}


@shared_task
def identify_at_risk_customers():
    """Identify customers at risk of churning"""
    from orders.models import Customer
    from accounts.models import CustomUser

    logger.info("Identifying at-risk customers...")

    today = timezone.now().date()
    at_risk_threshold_days = 60

    at_risk_customers = []

    for customer in Customer.objects.filter(is_active=True):
        last_order = customer.orders.order_by('-order_date').first()

        if last_order:
            days_since_last_order = (today - last_order.order_date.date()).days

            if days_since_last_order > at_risk_threshold_days:
                at_risk_customers.append(customer)

                # Notify sales team
                sales_team = CustomUser.objects.filter(role__in=['admin', 'analyst'])
                for user in sales_team:
                    NotificationService.create_notification(
                        recipient=user,
                        title="Customer At Risk",
                        message=f"Customer {customer.name} hasn't ordered in {days_since_last_order} days",
                        notification_type='warning',
                        action_url=f'/customers/{customer.id}'
                    )

    logger.info(f"Identified {len(at_risk_customers)} at-risk customers")
    return {'at_risk_count': len(at_risk_customers)}
