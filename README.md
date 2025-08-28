# Logistics Management System

A comprehensive Django-based logistics and supply chain management system.

## Quick Start

1. Run setup_project.bat to initialize Django project
2. Run python setup_models.py to create models
3. Run python setup_more_models.py to create remaining models
4. Create migrations: python manage.py makemigrations
5. Apply migrations: python manage.py migrate
6. Create superuser: python manage.py createsuperuser
7. Start server: python manage.py runserver

## Features

- Multi-warehouse inventory management
- Order processing and fulfillment
- Vehicle fleet and driver management
- Route optimization capabilities
- Real-time tracking support
- Comprehensive analytics

## Technology Stack

- Django 4.2 with DRF
- Celery for background tasks
- Redis for caching
- SQLite/PostgreSQL database
- OR-Tools for optimization

## Next Steps

After setup, access:
- Admin Panel: http://127.0.0.1:8000/admin/
- API: http://127.0.0.1:8000/api/

See SETUP_CHECKLIST.md for detailed instructions.
