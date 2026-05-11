@echo off
title Werbevideo Generator
color 0B

cd /d "%~dp0"

REM Pruefen ob npm da ist
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [FEHLER] npm nicht gefunden. Node.js installieren?
    echo          https://nodejs.org
    pause
    exit /b 1
)

REM Alte Prozesse aufraeumen
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1
taskkill /F /IM ngrok.exe >nul 2>&1

REM Server + ngrok in einem Fenster
node scripts\start-all.mjs

pause

