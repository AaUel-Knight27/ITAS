$ErrorActionPreference = "Stop"

$ROOT = "C:\Users\AaUel Knight\Documents\ITAS"

Write-Host "============================================"
Write-Host " ITAS Environment Setup"
Write-Host "============================================"
Write-Host ""

Write-Host "[1/2] Creating Upload Directories..."
$dirs = @(
    "$ROOT\uploads",
    "$ROOT\uploads\certificates",
    "$ROOT\uploads\thumbnails",
    "$ROOT\uploads\videos",
    "$ROOT\uploads\pdfs"
)

foreach ($dir in $dirs) {
    if (!(Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "  Created: $dir"
    } else {
        Write-Host "  Exists:  $dir"
    }
}
Write-Host ""

Write-Host "[2/2] Registering ITAS Portal to start on boot..."
$TaskName = "ITAS Portal"

try {
    # Check if task already exists and remove it if so
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Write-Host "  Removing existing scheduled task..."
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }

    $action = New-ScheduledTaskAction -Execute "$ROOT\start-production.bat"
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Write-Host "  Successfully registered scheduled task: '$TaskName'"
} catch {
    Write-Host "  [!] Error registering scheduled task. Did you run PowerShell as Administrator?"
    Write-Host "  Error details: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Setup complete!"
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
