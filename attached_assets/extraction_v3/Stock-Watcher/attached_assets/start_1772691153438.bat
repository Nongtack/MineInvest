@echo off
echo Portfolio Tracker - Starting server...
echo Open browser: http://localhost:8080
echo.
cd /d "%~dp0"
python -m http.server 8080
pause
