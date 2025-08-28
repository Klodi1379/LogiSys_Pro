@echo off
echo ========================================
echo Setting up Logistics Management System
echo ========================================

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install required packages
echo Installing Django and dependencies...
pip install django djangorestframework djangorestframework-simplejwt
pip install celery redis
pip install ortools pandas scikit-learn
pip install channels channels-redis
pip install django-cors-headers
pip install python-decouple
pip install pillow

REM Create Django project
echo Creating Django project...
django-admin startproject logistic_system .

REM Create all apps
echo Creating Django applications...
python manage.py startapp accounts
python manage.py startapp inventory  
python manage.py startapp warehousing
python manage.py startapp orders
python manage.py startapp transport
python manage.py startapp analytics
python manage.py startapp api
python manage.py startapp core

echo ========================================
echo Project structure created successfully!
echo Next steps:
echo 1. Run: python setup_models.py to create initial models
echo 2. Run: python manage.py makemigrations
echo 3. Run: python manage.py migrate
echo 4. Run: python manage.py createsuperuser
echo ========================================
pause
