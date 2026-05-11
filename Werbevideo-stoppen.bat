@echo off
chcp 65001 >nul
title Werbevideo Generator - Stop
color 0C

echo Stoppe Web-Server und ngrok...
echo.

REM Server auf Port 8080 beenden
powershell -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM ngrok beenden
taskkill /F /IM ngrok.exe >nul 2>&1

REM Etwaige offene Server-CMD-Fenster schliessen (per Title)
taskkill /F /FI "WINDOWTITLE eq Werbevideo Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq ngrok Tunnel*" >nul 2>&1

echo Alle Prozesse beendet.
echo.
timeout /t 2 /nobreak >nul

