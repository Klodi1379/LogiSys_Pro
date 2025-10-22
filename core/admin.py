from django.contrib import admin
from .models import (
    Notification, NotificationPreference, AuditLog, Webhook, WebhookLog,
    SystemSetting, ScheduledTask
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['recipient__username', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('recipient')


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_order_updates', 'email_shipment_updates', 'daily_digest', 'weekly_digest']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['username', 'action', 'object_repr', 'timestamp', 'ip_address']
    list_filter = ['action', 'timestamp']
    search_fields = ['username', 'object_repr', 'description']
    readonly_fields = ['user', 'username', 'action', 'description', 'object_repr', 'changes', 'metadata', 'ip_address', 'user_agent', 'timestamp']
    date_hierarchy = 'timestamp'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        # Only superusers can delete audit logs
        return request.user.is_superuser


@admin.register(Webhook)
class WebhookAdmin(admin.ModelAdmin):
    list_display = ['name', 'event_type', 'url', 'is_active', 'total_calls', 'successful_calls', 'failed_calls', 'last_called']
    list_filter = ['event_type', 'is_active']
    search_fields = ['name', 'url']
    readonly_fields = ['total_calls', 'successful_calls', 'failed_calls', 'last_called', 'last_success', 'last_failure', 'created_at', 'updated_at']


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = ['webhook', 'event_type', 'status', 'status_code', 'response_time_ms', 'retry_count', 'created_at']
    list_filter = ['status', 'event_type', 'created_at']
    search_fields = ['webhook__name']
    readonly_fields = ['webhook', 'event_type', 'payload', 'headers', 'status_code', 'response_body', 'response_time_ms', 'status', 'error_message', 'retry_count', 'created_at', 'completed_at']
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'setting_type', 'is_public', 'updated_at']
    list_filter = ['setting_type', 'is_public']
    search_fields = ['key', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ScheduledTask)
class ScheduledTaskAdmin(admin.ModelAdmin):
    list_display = ['name', 'task_type', 'status', 'progress', 'scheduled_at', 'started_at', 'completed_at']
    list_filter = ['status', 'task_type', 'scheduled_at']
    search_fields = ['name', 'task_type']
    readonly_fields = ['celery_task_id', 'created_at']
    date_hierarchy = 'scheduled_at'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by')
