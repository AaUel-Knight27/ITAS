@echo off
setlocal
set "BASE=C:\Users\AaUel Knight\Documents\ITAS"

echo ============================================
echo   ITAS Portal - Starting All Services
echo ============================================
echo.

echo [1/8] Starting itas-auth :8081...
start /b cmd /c "cd /d "%BASE%\itas-auth" && mvnw spring-boot:run"

echo [2/8] Starting itas-course :8082...
start /b cmd /c "cd /d "%BASE%\itas-course" && mvnw spring-boot:run"

echo [3/8] Starting itas-learning :8083...
start /b cmd /c "cd /d "%BASE%\itas-learning" && mvnw spring-boot:run"

echo [4/8] Starting itas-webinar :8084...
start /b cmd /c "cd /d "%BASE%\itas-webinar" && mvnw spring-boot:run"

echo [5/8] Starting itas-notification :8085...
start /b cmd /c "cd /d "%BASE%\itas-notification" && mvnw spring-boot:run"

echo [6/8] Starting itas-admin :8086...
start /b cmd /c "cd /d "%BASE%\itas-admin" && mvnw spring-boot:run"

echo [7/8] Starting itas-gateway :8080...
start /b cmd /c "cd /d "%BASE%\itas-gateway" && mvnw spring-boot:run"

echo [8/8] Starting frontend :3000...
start /b cmd /c "cd /d "%BASE%\frontend" && npm run dev"

echo.
echo All services started in background (single window).
pause