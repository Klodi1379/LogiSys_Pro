"""
Notification service for sending in-app, email, and webhook notifications
"""
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from core.models import Notification, NotificationPreference
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Centralized notification service"""

    @staticmethod
    def create_notification(
        recipient,
        title: str,
        message: str,
        notification_type: str = 'info',
        action_url: str = '',
        content_object=None
    ) -> Notification:
        """
        Create an in-app notification

        Args:
            recipient: User object
            title: Notification title
            message: Notification message
            notification_type: Type of notification (info, success, warning, error, etc.)
            action_url: URL to navigate to when clicked
            content_object: Related model object (optional)

        Returns:
            Created Notification object
        """
        notification = Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url,
            content_object=content_object
        )

        logger.info(f"Notification created for {recipient.username}: {title}")
        return notification

    @staticmethod
    def send_email_notification(
        recipient_email: str,
        subject: str,
        message: str,
        html_template: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send email notification

        Args:
            recipient_email: Recipient email address
            subject: Email subject
            message: Plain text message
            html_template: Path to HTML template (optional)
            context: Template context data (optional)

        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            html_message = None
            if html_template and context:
                html_message = render_to_string(html_template, context)

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(f"Email sent to {recipient_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
            return False

    @staticmethod
    def notify_order_created(order) -> None:
        """Send notifications when a new order is created"""
        # Notify customer
        if order.customer.user_account:
            NotificationService.create_notification(
                recipient=order.customer.user_account,
                title="Order Created",
                message=f"Your order {order.order_number} has been created and is being processed.",
                notification_type='order',
                action_url=f'/orders/{order.id}',
                content_object=order
            )

        # Email notification
        if order.customer.email:
            NotificationService.send_email_notification(
                recipient_email=order.customer.email,
                subject=f"Order Confirmation - {order.order_number}",
                message=f"Your order {order.order_number} has been created. Total: ${order.total_amount}"
            )

    @staticmethod
    def notify_order_status_changed(order, old_status: str, new_status: str) -> None:
        """Send notifications when order status changes"""
        status_messages = {
            'confirmed': "Your order has been confirmed and is being prepared.",
            'processing': "Your order is now being processed.",
            'ready_to_ship': "Your order is ready to ship!",
            'shipped': "Your order has been shipped and is on its way.",
            'delivered': "Your order has been delivered. Thank you for your business!",
            'cancelled': "Your order has been cancelled.",
        }

        message = status_messages.get(new_status, f"Your order status has been updated to {new_status}.")

        # Notify customer
        if order.customer.user_account:
            NotificationService.create_notification(
                recipient=order.customer.user_account,
                title=f"Order {order.order_number} Updated",
                message=message,
                notification_type='order',
                action_url=f'/orders/{order.id}',
                content_object=order
            )

    @staticmethod
    def notify_shipment_created(shipment) -> None:
        """Send notifications when a shipment is created"""
        # Notify driver
        if shipment.driver:
            NotificationService.create_notification(
                recipient=shipment.driver.user,
                title="New Shipment Assigned",
                message=f"You have been assigned shipment {shipment.tracking_number}.",
                notification_type='shipment',
                action_url=f'/shipments/{shipment.id}',
                content_object=shipment
            )

    @staticmethod
    def notify_shipment_status_changed(shipment, old_status: str, new_status: str) -> None:
        """Send notifications when shipment status changes"""
        status_messages = {
            'ready_for_pickup': "Your shipment is ready for pickup.",
            'picked_up': "Your shipment has been picked up.",
            'in_transit': "Your shipment is in transit.",
            'delivered': "Your shipment has been delivered!",
        }

        message = status_messages.get(new_status, f"Your shipment status has been updated to {new_status}.")

        # Notify all customers in the shipment's orders
        for order in shipment.orders.all():
            if order.customer.user_account:
                NotificationService.create_notification(
                    recipient=order.customer.user_account,
                    title=f"Shipment {shipment.tracking_number} Updated",
                    message=message,
                    notification_type='shipment',
                    action_url=f'/shipments/{shipment.id}',
                    content_object=shipment
                )

    @staticmethod
    def notify_low_stock(product, current_stock: int) -> None:
        """Send notifications when product stock is low"""
        from accounts.models import CustomUser

        # Notify warehouse managers and admins
        managers = CustomUser.objects.filter(
            role__in=['admin', 'warehouse_manager']
        )

        for manager in managers:
            NotificationService.create_notification(
                recipient=manager,
                title="Low Stock Alert",
                message=f"Product '{product.name}' is low on stock. Current: {current_stock}, Reorder Point: {product.reorder_point}",
                notification_type='inventory',
                action_url=f'/products/{product.id}',
                content_object=product
            )

    @staticmethod
    def notify_out_of_stock(product) -> None:
        """Send notifications when product is out of stock"""
        from accounts.models import CustomUser

        # Notify warehouse managers and admins
        managers = CustomUser.objects.filter(
            role__in=['admin', 'warehouse_manager']
        )

        for manager in managers:
            NotificationService.create_notification(
                recipient=manager,
                title="Out of Stock Alert",
                message=f"Product '{product.name}' is out of stock!",
                notification_type='warning',
                action_url=f'/products/{product.id}',
                content_object=product
            )

    @staticmethod
    def mark_all_as_read(user) -> int:
        """Mark all notifications as read for a user"""
        count = Notification.objects.filter(
            recipient=user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        return count

    @staticmethod
    def get_unread_count(user) -> int:
        """Get count of unread notifications for a user"""
        return Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()

    @staticmethod
    def get_recent_notifications(user, limit: int = 10) -> List[Notification]:
        """Get recent notifications for a user"""
        return Notification.objects.filter(
            recipient=user
        ).order_by('-created_at')[:limit]

    @staticmethod
    def delete_old_notifications(days: int = 30) -> int:
        """Delete notifications older than specified days"""
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        count, _ = Notification.objects.filter(
            created_at__lt=cutoff_date,
            is_read=True
        ).delete()
        return count

    @staticmethod
    def check_user_preferences(user, notification_type: str, channel: str = 'app') -> bool:
        """
        Check if user wants to receive this type of notification

        Args:
            user: User object
            notification_type: Type of notification (order, shipment, inventory, system)
            channel: Channel (app or email)

        Returns:
            True if user wants to receive this notification, False otherwise
        """
        try:
            prefs = NotificationPreference.objects.get(user=user)

            preference_map = {
                'app': {
                    'order': prefs.app_order_updates,
                    'shipment': prefs.app_shipment_updates,
                    'inventory': prefs.app_inventory_alerts,
                    'system': prefs.app_system_notifications,
                },
                'email': {
                    'order': prefs.email_order_updates,
                    'shipment': prefs.email_shipment_updates,
                    'inventory': prefs.email_inventory_alerts,
                    'system': prefs.email_system_notifications,
                }
            }

            return preference_map.get(channel, {}).get(notification_type, True)

        except NotificationPreference.DoesNotExist:
            # Default to True if preferences don't exist
            return True
