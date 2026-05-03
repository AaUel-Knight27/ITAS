@echo off
echo ============================================
echo   ITAS Portal Health Check
echo ============================================
echo.

set PASS=0
set FAIL=0

powershell -Command "try { $r = Invoke-WebRequest http://localhost:8081/actuator/health -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '  [OK] Auth Service :8081' } else { Write-Host '  [FAIL] Auth Service :8081' } } catch { Write-Host '  [DOWN] Auth Service :8081' }"

powershell -Command "try { $r = Invoke-WebRequest http://localhost:8082/actuator/health -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '  [OK] Course Service :8082' } else { Write-Host '  [FAIL] Course Service :8082' } } catch { Write-Host '  [DOWN] Course Service :8082' }"

powershell -Command "try { $r = Invoke-WebRequest http://localhost:8083/actuator/health -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '  [OK] Learning Service :8083' } else { Write-Host '  [FAIL] Learning Service :8083' } } catch { Write-Host '  [DOWN] Learning Service :8083' }"

powershell -Command "try { $r = Invoke-WebRequest http://localhost:8084/actuator/health -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '  [OK] Webinar Service :8084' } else { Write-Host '  [FAIL] Webinar Service :8084' } } catch { Write-Host '  [DOWN] Webinar Service :8084' }"

powershell -Command "try { $r = Invoke-WebRequest http://localhost:8085/actuator/health -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '  [OK] Notification Service :8085' } else { Write-Host '  [FAIL] Notification Service :8085' } } catch { Write-Host '  [DOWN] Notification Service :8085' }"

powershell -Command "try { $r = Invoke-WebRequest http://localhost:8086/actuator/health -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '  [OK] Admin Service :8086' } else { Write-Host '  [FAIL] Admin Service :8086' } } catch { Write-Host '  [DOWN] Admin Service :8086' }"

powershell -Command "try { $r = Invoke-WebRequest http://localhost:8080/actuator/health -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '  [OK] API Gateway :8080' } else { Write-Host '  [FAIL] API Gateway :8080' } } catch { Write-Host '  [DOWN] API Gateway :8080' }"

powershell -Command "try { $r = Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '  [OK] Frontend :3000' } else { Write-Host '  [FAIL] Frontend :3000' } } catch { Write-Host '  [DOWN] Frontend :3000' }"

echo.
echo ============================================
echo   Run this check after starting services
echo ============================================
pause
