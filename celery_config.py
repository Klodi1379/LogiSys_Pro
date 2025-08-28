"""
Celery Configuration for Logistics Management System
Handles background tasks like route optimization and demand forecasting
"""

import os
from celery import Celery
from django.conf import settings

# Set default Django settings module for Celery
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "logistic_system.settings")

# Create Celery app
app = Celery("logistic_system")

# Configure Celery using Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks from all Django apps
app.autodiscover_tasks()

# Task routing for different types of operations
app.conf.task_routes = {
    "inventory.tasks.*": {"queue": "inventory"},
    "transport.tasks.*": {"queue": "transport"},
    "analytics.tasks.*": {"queue": "analytics"},
    "orders.tasks.*": {"queue": "orders"},
}

# Task priorities
app.conf.task_acks_late = True
app.conf.worker_prefetch_multiplier = 1

# Periodic tasks schedule
from celery.schedules import crontab

app.conf.beat_schedule = {
    # Run inventory forecasting daily at 2 AM
    "daily-inventory-forecast": {
        "task": "inventory.tasks.generate_demand_forecast",
        "schedule": crontab(hour=2, minute=0),
    },
    # Update driver performance metrics daily
    "update-driver-performance": {
        "task": "transport.tasks.update_driver_performance",
        "schedule": crontab(hour=3, minute=0),
    },
    # Generate daily analytics report
    "daily-analytics-report": {
        "task": "analytics.tasks.generate_daily_report",
        "schedule": crontab(hour=4, minute=0),
    },
    # Clean up old tracking data weekly
    "weekly-cleanup": {
        "task": "core.tasks.cleanup_old_data",
        "schedule": crontab(hour=1, minute=0, day_of_week=1),
    },
}

app.conf.timezone = "UTC"


@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery configuration"""
    print(f"Request: {self.request!r}")
    return "Celery is working!"
