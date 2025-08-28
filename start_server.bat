@echo off
title Logistics Management System - Quick Start
echo.
echo ==========================================
echo   LOGISTICS MANAGEMENT SYSTEM
echo   Quick Start Development Server
echo ==========================================
echo.
echo Starting Django development server...
echo Access your system at: http://127.0.0.1:8000/
echo Admin panel at: http://127.0.0.1:8000/admin/
echo.
echo Credentials:
echo - Admin: admin / admin123
echo - Manager: manager / manager123
echo.
echo Press Ctrl+C to stop the server
echo ==========================================
echo.

REM Activate virtual environment and start server
call venv\Scripts\activate
python manage.py runserver

echo.
echo Server stopped. Press any key to exit...
pause > nul
