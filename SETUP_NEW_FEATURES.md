# Setup Guide for New Features

## Prerequisites

Before setting up the new features, ensure you have:
- Python 3.8+ installed
- Virtual environment activated
- All previous LogiSys Pro setup completed

## Installation Steps

### 1. Install New Dependencies

```bash
# Activate your virtual environment first
# For Windows:
venv\Scripts\activate

# For Linux/Mac:
source venv/bin/activate

# Install new dependencies
pip install reportlab==4.0.7
pip install scipy==1.11.4

# Or install all requirements
pip install -r requirements.txt
```

### 2. Run Database Migrations

```bash
# Create migration files
python manage.py makemigrations analytics
python manage.py makemigrations core

# Apply migrations
python manage.py migrate
```

### 3. Update Celery Configuration

Edit `celery_config.py` or `logistic_system/settings.py` and add:

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Check low stock every 6 hours
    'check-low-stock': {
        'task': 'core.tasks.check_low_stock_alerts',
        'schedule': crontab(hour='*/6'),
    },

    # Generate daily revenue report at midnight
    'daily-revenue-report': {
        'task': 'core.tasks.generate_daily_revenue_report',
        'schedule': crontab(hour=0, minute=0),
    },

    # Calculate inventory analytics daily at 1 AM
    'inventory-analytics': {
        'task': 'core.tasks.calculate_inventory_analytics',
        'schedule': crontab(hour=1, minute=0),
    },

    # Update customer analytics daily at 2 AM
    'customer-analytics': {
        'task': 'core.tasks.update_customer_analytics',
        'schedule': crontab(hour=2, minute=0),
    },

    # Send daily digest at 8 AM
    'daily-digest': {
        'task': 'core.tasks.send_daily_digest_emails',
        'schedule': crontab(hour=8, minute=0),
    },

    # Clean old notifications weekly
    'clean-notifications': {
        'task': 'core.tasks.clean_old_notifications',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),  # Sunday at 3 AM
    },

    # Forecast demand daily at 4 AM
    'forecast-demand': {
        'task': 'core.tasks.forecast_product_demand',
        'schedule': crontab(hour=4, minute=0),
    },

    # Auto-confirm pending orders every hour
    'auto-confirm-orders': {
        'task': 'core.tasks.auto_confirm_pending_orders',
        'schedule': crontab(minute=0),  # Every hour
    },

    # Check at-risk customers daily at 9 AM
    'at-risk-customers': {
        'task': 'core.tasks.identify_at_risk_customers',
        'schedule': crontab(hour=9, minute=0),
    },
}
```

### 4. Configure Email Settings

Add to `logistic_system/settings.py`:

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'  # Change this
EMAIL_HOST_PASSWORD = 'your-app-password'  # Change this
DEFAULT_FROM_EMAIL = 'LogiSys Pro <noreply@logisyspro.com>'

# Company Information (for documents)
COMPANY_NAME = 'LogiSys Pro'
COMPANY_ADDRESS = '123 Main Street, City, Country'
COMPANY_PHONE = '(555) 123-4567'
COMPANY_EMAIL = 'info@logisyspro.com'
SITE_URL = 'http://localhost:8000'
```

### 5. Start Services

You'll need 3 terminal windows/tabs:

**Terminal 1 - Django Server:**
```bash
python manage.py runserver
```

**Terminal 2 - Celery Worker:**
```bash
celery -A logistic_system worker -l info
```

**Terminal 3 - Celery Beat (Scheduler):**
```bash
celery -A logistic_system beat -l info
```

### 6. Verify Installation

Access Django admin at http://127.0.0.1:8000/admin/ and verify new models are available:

**Analytics App:**
- Revenue Reports
- Inventory Analytics
- Delivery Performance
- Customer Analytics
- Warehouse Performance
- Predictive Analytics

**Core App:**
- Notifications
- Notification Preferences
- Audit Logs
- Webhooks
- Webhook Logs
- System Settings
- Scheduled Tasks

## Usage Examples

### 1. Generate an Invoice

```python
from orders.models import Order
from core.utils.document_generator import DocumentGenerator

order = Order.objects.get(order_number='ORD-20250827-ABC123')
pdf_buffer = DocumentGenerator.generate_invoice(order)

# Save to file
with open('invoice.pdf', 'wb') as f:
    f.write(pdf_buffer.read())
```

### 2. Send a Notification

```python
from core.utils.notifications import NotificationService
from accounts.models import CustomUser

user = CustomUser.objects.get(username='admin')
NotificationService.create_notification(
    recipient=user,
    title='Test Notification',
    message='This is a test notification',
    notification_type='info'
)
```

### 3. Log an Audit Event

```python
from core.utils.audit import AuditLogger

AuditLogger.log_create(
    user=request.user,
    object_instance=new_order,
    description='Created new order',
    ip_address=request.META.get('REMOTE_ADDR')
)
```

### 4. Export Data to Excel

```python
from inventory.models import Product
from core.utils.import_export import ImportExportService

products = Product.objects.all()
excel_buffer = ImportExportService.export_to_excel(products)

# Send as download
response = HttpResponse(
    excel_buffer.read(),
    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
)
response['Content-Disposition'] = 'attachment; filename=products.xlsx'
return response
```

### 5. Optimize a Route

```python
from core.utils.route_optimizer import RouteOptimizer

optimizer = RouteOptimizer()
locations = [
    {'name': 'Warehouse', 'latitude': 40.7128, 'longitude': -74.0060},
    {'name': 'Customer 1', 'latitude': 40.7580, 'longitude': -73.9855},
    {'name': 'Customer 2', 'latitude': 40.7489, 'longitude': -73.9680},
]

result = optimizer.optimize_route(locations, num_vehicles=1)
print(f"Total distance: {result['total_distance_km']} km")
```

### 6. Calculate Analytics

```python
from core.utils.analytics import AnalyticsCalculator
from inventory.models import Product

product = Product.objects.get(sku='SKU001')
turnover = AnalyticsCalculator.calculate_inventory_turnover(product, period_days=30)
print(f"Turnover rate: {turnover['turnover_rate']}")
```

### 7. Create a Webhook

Via Django Admin:
1. Go to Core > Webhooks
2. Click "Add Webhook"
3. Fill in:
   - Name: "Order Notification System"
   - URL: "https://your-external-system.com/webhook"
   - Event Type: "order.created"
   - Auth Header: "Bearer your-token-here"
4. Save

The webhook will automatically fire when the event occurs.

## Testing

### Test Celery Tasks Manually

```python
# In Django shell (python manage.py shell)
from core.tasks import check_low_stock_alerts

# Run immediately
result = check_low_stock_alerts.apply()
print(result.get())

# Or schedule for later
result = check_low_stock_alerts.apply_async(countdown=10)
```

### Test Notifications

```python
from core.utils.notifications import NotificationService
from accounts.models import CustomUser

user = CustomUser.objects.first()
count = NotificationService.get_unread_count(user)
print(f"Unread notifications: {count}")

recent = NotificationService.get_recent_notifications(user, limit=5)
for notif in recent:
    print(f"- {notif.title}: {notif.message}")
```

### Test Document Generation

```python
from orders.models import Order
from core.utils.document_generator import DocumentGenerator

order = Order.objects.first()

# Generate invoice
invoice = DocumentGenerator.generate_invoice(order, output_path='test_invoice.pdf')
print("Invoice generated: test_invoice.pdf")

# Generate packing slip
packing_slip = DocumentGenerator.generate_packing_slip(order, output_path='test_packing_slip.pdf')
print("Packing slip generated: test_packing_slip.pdf")
```

## Troubleshooting

### Issue: Celery tasks not running

**Solution:**
1. Ensure Redis is running: `redis-cli ping` (should return "PONG")
2. Check Celery worker is running
3. Check Celery beat is running
4. Verify CELERY_BROKER_URL in settings.py

### Issue: Email notifications not sending

**Solution:**
1. Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in settings.py
2. For Gmail, use an App Password (not regular password)
3. Check spam folder
4. Test with: `python manage.py shell`
   ```python
   from django.core.mail import send_mail
   send_mail('Test', 'Test message', 'from@example.com', ['to@example.com'])
   ```

### Issue: PDF generation fails

**Solution:**
1. Ensure reportlab is installed: `pip install reportlab`
2. Check file write permissions
3. Verify order has items

### Issue: Route optimization fails

**Solution:**
1. Ensure ortools is installed: `pip install ortools`
2. Check GPS coordinates are valid
3. Ensure at least 2 locations are provided

## Performance Tips

1. **Enable Redis Caching**: Implement Redis caching for frequently accessed data
2. **Database Indexing**: The new models have indexes, ensure they're applied
3. **Celery Optimization**: Increase worker processes: `celery -A logistic_system worker -l info -c 4`
4. **Batch Operations**: Use bulk_create and bulk_update for large datasets
5. **Query Optimization**: Use select_related and prefetch_related

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Set DEBUG=False in production
- [ ] Use environment variables for sensitive data
- [ ] Configure ALLOWED_HOSTS
- [ ] Use HTTPS for webhooks
- [ ] Implement rate limiting
- [ ] Regular backup of audit logs
- [ ] Review webhook authentication

## Next Steps

1. ✅ Install dependencies
2. ✅ Run migrations
3. ✅ Configure Celery
4. ✅ Set up email
5. ✅ Start all services
6. ✅ Test each feature
7. ✅ Configure webhooks
8. ✅ Set up monitoring
9. ✅ Train team members
10. ✅ Deploy to production

## Support

For issues or questions:
- Check `NEW_FEATURES_DOCUMENTATION.md` for detailed feature descriptions
- Review code comments in utility files
- Check Django admin for model management

---

**Congratulations! Your LogiSys Pro system is now equipped with enterprise-grade features!** 🚀
