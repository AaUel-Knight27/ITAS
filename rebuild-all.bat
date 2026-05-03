@echo off
setlocal
set ROOT=C:\Users\AaUel Knight\Documents\ITAS

echo Stopping running services...
call "%ROOT%\stop-all.bat"
timeout /t 3 /nobreak >nul

echo.
echo Building all backend services...

cd /d "%ROOT%\itas-auth"
call .\mvnw clean package -DskipTests -q
if %ERRORLEVEL% neq 0 (echo FAILED: itas-auth && pause && exit /b 1)
echo   itas-auth: OK

cd /d "%ROOT%\itas-course"
call .\mvnw clean package -DskipTests -q
if %ERRORLEVEL% neq 0 (echo FAILED: itas-course && pause && exit /b 1)
echo   itas-course: OK

cd /d "%ROOT%\itas-learning"
call .\mvnw clean package -DskipTests -q
if %ERRORLEVEL% neq 0 (echo FAILED: itas-learning && pause && exit /b 1)
echo   itas-learning: OK

cd /d "%ROOT%\itas-webinar"
call .\mvnw clean package -DskipTests -q
if %ERRORLEVEL% neq 0 (echo FAILED: itas-webinar && pause && exit /b 1)
echo   itas-webinar: OK

cd /d "%ROOT%\itas-notification"
call .\mvnw clean package -DskipTests -q
if %ERRORLEVEL% neq 0 (echo FAILED: itas-notification && pause && exit /b 1)
echo   itas-notification: OK

cd /d "%ROOT%\itas-admin"
call .\mvnw clean package -DskipTests -q
if %ERRORLEVEL% neq 0 (echo FAILED: itas-admin && pause && exit /b 1)
echo   itas-admin: OK

cd /d "%ROOT%\itas-gateway"
call .\mvnw clean package -DskipTests -q
if %ERRORLEVEL% neq 0 (echo FAILED: itas-gateway && pause && exit /b 1)
echo   itas-gateway: OK

echo.
echo Building frontend...
cd /d "%ROOT%\frontend"
call npm run build
if %ERRORLEVEL% neq 0 (echo FAILED: frontend build && pause && exit /b 1)
echo   frontend: OK

echo.
echo All builds successful. Starting services...
call "%ROOT%\start-production.bat"
