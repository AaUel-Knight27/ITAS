@echo off
echo Stopping all ITAS services...

REM Kill Java processes (all services)
taskkill /F /IM java.exe /T >nul 2>&1

REM Kill Node process (frontend)
taskkill /F /FI "WindowTitle eq FRONTEND*" /T >nul 2>&1

echo All services stopped.
pause
