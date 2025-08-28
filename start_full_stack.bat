@echo off
title Full-Stack Logistics System Launcher
color 0A

echo.
echo =====================================
echo  🚀 LOGISTICS MANAGEMENT SYSTEM
echo  Full-Stack Application Launcher
echo =====================================
echo.
echo Starting backend Django API server...
echo.

REM Start Django backend in a new window
start "Django API Server" cmd /k "cd /d C:\GPT4_PROJECTS\logistic2 && venv\Scripts\activate && python manage.py runserver"

echo Backend server starting...
echo Waiting 5 seconds before starting frontend...
timeout /t 5 /nobreak >nul

echo.
echo Starting React frontend...
echo.

REM Start React frontend in a new window  
start "React Frontend" cmd /k "cd /d C:\GPT4_PROJECTS\logistic2\frontend\logistics-frontend && npm start"

echo.
echo =====================================
echo  ✅ FULL-STACK SYSTEM LAUNCHED!
echo =====================================
echo.
echo 🔗 Your applications will open at:
echo.
echo    🐍 Django Backend API:
echo       http://127.0.0.1:8000/
echo       http://127.0.0.1:8000/admin/
echo       http://127.0.0.1:8000/api/
echo.
echo    ⚛️  React Frontend:
echo       http://localhost:3000/
echo.
echo 👤 Login Credentials:
echo    Admin: admin / admin123
echo    Manager: manager / manager123
echo.
echo 📚 See FULL_STACK_GUIDE.md for complete documentation
echo.
echo Press any key to close this launcher...
pause >nul
