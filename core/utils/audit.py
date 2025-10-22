"""
Audit logging utilities for tracking system actions
"""
from django.contrib.contenttypes.models import ContentType
from core.models import AuditLog
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class AuditLogger:
    """Centralized audit logging service"""

    @staticmethod
    def log_action(
        user,
        action: str,
        description: str,
        object_instance=None,
        changes: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Log an action to the audit trail

        Args:
            user: User who performed the action
            action: Action type (create, update, delete, view, etc.)
            description: Description of the action
            object_instance: The model instance that was acted upon
            changes: Dictionary of changes (old_value -> new_value)
            metadata: Additional context data
            ip_address: IP address of the user
            user_agent: User agent string

        Returns:
            Created AuditLog object
        """
        username = user.username if user else 'system'

        content_type = None
        object_id = None
        object_repr = 'N/A'

        if object_instance:
            content_type = ContentType.objects.get_for_model(object_instance)
            object_id = object_instance.pk
            object_repr = str(object_instance)

        audit_log = AuditLog.objects.create(
            user=user,
            username=username,
            action=action,
            description=description,
            content_type=content_type,
            object_id=object_id,
            object_repr=object_repr[:200],  # Truncate if too long
            changes=changes or {},
            metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else ''
        )

        logger.info(f"Audit log created: {username} - {action} - {object_repr}")
        return audit_log

    @staticmethod
    def log_create(user, object_instance, description: str = None, **kwargs) -> AuditLog:
        """Log object creation"""
        desc = description or f"Created {object_instance._meta.verbose_name}"
        return AuditLogger.log_action(
            user=user,
            action='create',
            description=desc,
            object_instance=object_instance,
            **kwargs
        )

    @staticmethod
    def log_update(
        user,
        object_instance,
        changes: Dict[str, tuple],
        description: str = None,
        **kwargs
    ) -> AuditLog:
        """
        Log object update

        Args:
            user: User who made the update
            object_instance: The updated object
            changes: Dict with field names as keys and (old_value, new_value) tuples as values
            description: Optional custom description
        """
        desc = description or f"Updated {object_instance._meta.verbose_name}"

        # Format changes for storage
        formatted_changes = {
            field: {'old': old, 'new': new}
            for field, (old, new) in changes.items()
        }

        return AuditLogger.log_action(
            user=user,
            action='update',
            description=desc,
            object_instance=object_instance,
            changes=formatted_changes,
            **kwargs
        )

    @staticmethod
    def log_delete(user, object_instance, description: str = None, **kwargs) -> AuditLog:
        """Log object deletion"""
        desc = description or f"Deleted {object_instance._meta.verbose_name}"
        return AuditLogger.log_action(
            user=user,
            action='delete',
            description=desc,
            object_instance=object_instance,
            **kwargs
        )

    @staticmethod
    def log_view(user, object_instance, description: str = None, **kwargs) -> AuditLog:
        """Log object view (for sensitive data)"""
        desc = description or f"Viewed {object_instance._meta.verbose_name}"
        return AuditLogger.log_action(
            user=user,
            action='view',
            description=desc,
            object_instance=object_instance,
            **kwargs
        )

    @staticmethod
    def log_export(user, model_name: str, count: int, format: str = 'csv', **kwargs) -> AuditLog:
        """Log data export"""
        description = f"Exported {count} {model_name} records as {format.upper()}"
        return AuditLogger.log_action(
            user=user,
            action='export',
            description=description,
            metadata={'model': model_name, 'count': count, 'format': format},
            **kwargs
        )

    @staticmethod
    def log_import(user, model_name: str, count: int, format: str = 'csv', **kwargs) -> AuditLog:
        """Log data import"""
        description = f"Imported {count} {model_name} records from {format.upper()}"
        return AuditLogger.log_action(
            user=user,
            action='import',
            description=description,
            metadata={'model': model_name, 'count': count, 'format': format},
            **kwargs
        )

    @staticmethod
    def log_login(user, ip_address: str = None, user_agent: str = None) -> AuditLog:
        """Log user login"""
        return AuditLogger.log_action(
            user=user,
            action='login',
            description=f"User {user.username} logged in",
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def log_logout(user, ip_address: str = None, user_agent: str = None) -> AuditLog:
        """Log user logout"""
        return AuditLogger.log_action(
            user=user,
            action='logout',
            description=f"User {user.username} logged out",
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def get_object_history(object_instance, limit: int = 50):
        """Get audit history for a specific object"""
        content_type = ContentType.objects.get_for_model(object_instance)
        return AuditLog.objects.filter(
            content_type=content_type,
            object_id=object_instance.pk
        ).order_by('-timestamp')[:limit]

    @staticmethod
    def get_user_activity(user, limit: int = 50):
        """Get recent activity for a user"""
        return AuditLog.objects.filter(
            user=user
        ).order_by('-timestamp')[:limit]

    @staticmethod
    def get_request_info(request):
        """
        Extract request information for audit logging

        Args:
            request: Django request object

        Returns:
            Dict with ip_address and user_agent
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')

        user_agent = request.META.get('HTTP_USER_AGENT', '')

        return {
            'ip_address': ip_address,
            'user_agent': user_agent
        }


class AuditMiddleware:
    """
    Middleware to automatically log certain actions
    Can be added to MIDDLEWARE settings
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log login/logout
        if request.user.is_authenticated:
            if request.path == '/api/auth/login/' and response.status_code == 200:
                request_info = AuditLogger.get_request_info(request)
                AuditLogger.log_login(
                    user=request.user,
                    **request_info
                )
            elif request.path == '/api/auth/logout/' and response.status_code == 200:
                request_info = AuditLogger.get_request_info(request)
                AuditLogger.log_logout(
                    user=request.user,
                    **request_info
                )

        return response


def track_model_changes(old_instance, new_instance) -> Dict[str, tuple]:
    """
    Compare two model instances and return changes

    Args:
        old_instance: Original model instance
        new_instance: Updated model instance

    Returns:
        Dict with field names as keys and (old_value, new_value) tuples
    """
    changes = {}

    for field in old_instance._meta.fields:
        field_name = field.name
        old_value = getattr(old_instance, field_name)
        new_value = getattr(new_instance, field_name)

        if old_value != new_value:
            # Convert to string for JSON serialization
            changes[field_name] = (str(old_value), str(new_value))

    return changes
