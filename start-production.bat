@echo off
setlocal EnableDelayedExpansion

set ROOT=C:\Users\AaUel Knight\Documents\ITAS

REM ── Load master .env file ──────────────────────
for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT%\.env") do (
    if not "%%A"=="" if not "%%A:~0,1%"=="#" (
        set "%%A=%%B"
    )
)

echo ============================================
echo   ITAS Portal - Production Start
echo ============================================
echo   Database: %DATABASE_URL%
echo   Frontend: %NEXTAUTH_URL%
echo   Gateway:  http://localhost:8080
echo ============================================
echo.

REM ── Wait for PostgreSQL to be ready ───────────
echo Checking PostgreSQL connection...
:pg_check
pg_isready -h localhost -p 5432 -U postgres >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo PostgreSQL not ready, waiting 3s...
    timeout /t 3 /nobreak >nul
    goto pg_check
)
echo PostgreSQL is ready.
echo.

REM ── Start backend services ────────────────────
echo [1/7] Starting Auth Service :8081...
start "AUTH" cmd /k "java -Xms256m -Xmx512m -jar "%ROOT%\itas-auth\target\itas-auth-1.0.0.jar" --spring.config.import=optional:file:"%ROOT%\.env[.properties]""
timeout /t 15 /nobreak >nul

echo [2/7] Starting Course Service :8082...
start "COURSE" cmd /k "java -Xms256m -Xmx512m -jar "%ROOT%\itas-course\target\itas-course-1.0.0.jar" --spring.config.import=optional:file:"%ROOT%\.env[.properties]""
timeout /t 10 /nobreak >nul

echo [3/7] Starting Learning Service :8083...
start "LEARNING" cmd /k "java -Xms256m -Xmx512m -jar "%ROOT%\itas-learning\target\itas-learning-1.0.0.jar" --spring.config.import=optional:file:"%ROOT%\.env[.properties]""
timeout /t 10 /nobreak >nul

echo [4/7] Starting Webinar Service :8084...
start "WEBINAR" cmd /k "java -Xms128m -Xmx256m -jar "%ROOT%\itas-webinar\target\itas-webinar-1.0.0.jar" --spring.config.import=optional:file:"%ROOT%\.env[.properties]""
timeout /t 10 /nobreak >nul

echo [5/7] Starting Notification Service :8085...
start "NOTIFY" cmd /k "java -Xms128m -Xmx256m -jar "%ROOT%\itas-notification\target\itas-notification-1.0.0.jar" --spring.config.import=optional:file:"%ROOT%\.env[.properties]""
timeout /t 10 /nobreak >nul

echo [6/7] Starting Admin Service :8086...
start "ADMIN" cmd /k "java -Xms128m -Xmx256m -jar "%ROOT%\itas-admin\target\itas-admin-1.0.0.jar" --spring.config.import=optional:file:"%ROOT%\.env[.properties]""
timeout /t 10 /nobreak >nul

echo [7/7] Starting API Gateway :8080...
start "GATEWAY" cmd /k "java -Xms128m -Xmx256m -jar "%ROOT%\itas-gateway\target\itas-gateway-1.0.0.jar" --spring.config.import=optional:file:"%ROOT%\.env[.properties]""
timeout /t 15 /nobreak >nul

REM ── Start frontend ────────────────────────────
echo [8/8] Starting Frontend :3000...
start "FRONTEND" cmd /k "cd /d "%ROOT%\frontend" && npm start"

echo.
echo ============================================
echo   All services started.
echo   Access the portal at:
echo   http://localhost:3000
echo ============================================
pause
