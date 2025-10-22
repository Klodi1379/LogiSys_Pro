from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from accounts.models import CustomUser
import json


class Notification(models.Model):
    """In-app notifications for users"""
    NOTIFICATION_TYPES = [
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('order', 'Order Update'),
        ('shipment', 'Shipment Update'),
        ('inventory', 'Inventory Alert'),
        ('system', 'System Notification'),
    ]

    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')

    title = models.CharField(max_length=200)
    message = models.TextField()

    # Link to related object (optional)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    # URL to navigate to when clicked
    action_url = models.CharField(max_length=500, blank=True)

    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"{self.title} - {self.recipient.username}"

    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class NotificationPreference(models.Model):
    """User notification preferences"""
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='notification_preferences')

    # Email notifications
    email_order_updates = models.BooleanField(default=True)
    email_shipment_updates = models.BooleanField(default=True)
    email_inventory_alerts = models.BooleanField(default=True)
    email_system_notifications = models.BooleanField(default=False)

    # In-app notifications
    app_order_updates = models.BooleanField(default=True)
    app_shipment_updates = models.BooleanField(default=True)
    app_inventory_alerts = models.BooleanField(default=True)
    app_system_notifications = models.BooleanField(default=True)

    # Digest settings
    daily_digest = models.BooleanField(default=False)
    weekly_digest = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification Preferences - {self.user.username}"


class AuditLog(models.Model):
    """Track all important actions in the system"""
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('export', 'Export'),
        ('import', 'Import'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]

    # Who performed the action
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    username = models.CharField(max_length=150)  # Store username in case user is deleted

    # What action was performed
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField()

    # On what object
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    object_repr = models.CharField(max_length=200)  # String representation of the object

    # Additional data
    changes = models.JSONField(default=dict, blank=True)  # Store what changed (old -> new)
    metadata = models.JSONField(default=dict, blank=True)  # Additional context

    # Request information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"{self.username} - {self.action} - {self.object_repr} - {self.timestamp}"


class Webhook(models.Model):
    """Webhooks for external integrations"""
    EVENT_TYPES = [
        ('order.created', 'Order Created'),
        ('order.updated', 'Order Updated'),
        ('order.completed', 'Order Completed'),
        ('shipment.created', 'Shipment Created'),
        ('shipment.updated', 'Shipment Updated'),
        ('shipment.delivered', 'Shipment Delivered'),
        ('inventory.low_stock', 'Low Stock Alert'),
        ('inventory.out_of_stock', 'Out of Stock'),
    ]

    name = models.CharField(max_length=200)
    url = models.URLField(max_length=500)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)

    # Authentication
    auth_header = models.CharField(max_length=500, blank=True, help_text="e.g., Bearer token123")
    secret_key = models.CharField(max_length=200, blank=True, help_text="For signature verification")

    # Configuration
    is_active = models.BooleanField(default=True)
    retry_on_failure = models.BooleanField(default=True)
    max_retries = models.IntegerField(default=3)

    # Statistics
    total_calls = models.IntegerField(default=0)
    successful_calls = models.IntegerField(default=0)
    failed_calls = models.IntegerField(default=0)
    last_called = models.DateTimeField(null=True, blank=True)
    last_success = models.DateTimeField(null=True, blank=True)
    last_failure = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.event_type}"


class WebhookLog(models.Model):
    """Log of webhook calls"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('retrying', 'Retrying'),
    ]

    webhook = models.ForeignKey(Webhook, on_delete=models.CASCADE, related_name='logs')
    event_type = models.CharField(max_length=50)

    # Request
    payload = models.JSONField()
    headers = models.JSONField(default=dict)

    # Response
    status_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    response_time_ms = models.IntegerField(null=True, blank=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['webhook', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self):
        return f"{self.webhook.name} - {self.event_type} - {self.status}"


class SystemSetting(models.Model):
    """Store system-wide settings"""
    SETTING_TYPES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('float', 'Float'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
    ]

    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES, default='string')

    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False, help_text="Can be accessed by non-admin users")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['key']

    def __str__(self):
        return f"{self.key} = {self.value}"

    def get_value(self):
        """Return the value in the correct type"""
        if self.setting_type == 'integer':
            return int(self.value)
        elif self.setting_type == 'float':
            return float(self.value)
        elif self.setting_type == 'boolean':
            return self.value.lower() in ['true', '1', 'yes']
        elif self.setting_type == 'json':
            return json.loads(self.value)
        return self.value


class ScheduledTask(models.Model):
    """Track scheduled background tasks"""
    TASK_STATUS = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    name = models.CharField(max_length=200)
    task_type = models.CharField(max_length=100)  # e.g., 'generate_report', 'send_emails'

    # Schedule
    scheduled_at = models.DateTimeField()
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Configuration
    parameters = models.JSONField(default=dict)

    # Status
    status = models.CharField(max_length=20, choices=TASK_STATUS, default='pending')
    progress = models.IntegerField(default=0, help_text="Progress percentage 0-100")
    result = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)

    # Celery task ID
    celery_task_id = models.CharField(max_length=100, blank=True)

    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_at']
        indexes = [
            models.Index(fields=['status', 'scheduled_at']),
        ]

    def __str__(self):
        return f"{self.name} - {self.status}"
