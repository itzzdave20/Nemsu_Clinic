@echo off
title NEMSU HealthHub - Dev Servers
cd /d "%~dp0"

echo Starting MySQL check...
if exist "C:\xampp\mysql\bin\mysql.exe" (
  "C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1" >nul 2>&1
  if errorlevel 1 (
    echo MySQL is not running. Start XAMPP MySQL first, then run this again.
    pause
    exit /b 1
  )
)

echo Starting backend on http://localhost:5000 ...
start "NEMSU API" cmd /k "cd /d %~dp0backend && npm.cmd run dev"

timeout /t 2 /nobreak >nul

echo Starting frontend on http://localhost:5173 ...
start "NEMSU Frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo HealthHub should open in your browser.
echo Keep both terminal windows open while using the site.
pause
