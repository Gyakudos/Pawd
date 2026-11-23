#Requires -RunAsAdministrator
# Run once after rebooting into Test Mode.
$ErrorActionPreference = 'Continue'
$log = 'F:\Pawd\drivers\apply_broadcom_test.log'
function Log($m) { $line = "$(Get-Date -Format 'HH:mm:ss') $m"; Write-Output $line; Add-Content $log $line }
Set-Content $log '=== Apply test-signed Broadcom driver (elevated, post-reboot) ==='

$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$pr = New-Object Security.Principal.WindowsPrincipal($id)
Log ('IsAdmin=' + $pr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))

$boot = bcdedit /enum '{current}' 2>&1 | Out-String
if ($boot -match 'testsigning\s+Yes') { Log 'Test Mode active' } else { Log 'WARNING: Test Mode not active - reboot required' }

$devId = 'USB\VID_19FF&PID_0239\BC14EF677BE3'
$inf = 'F:\Pawd\drivers\BCM20702A0-Test\bcbtums.inf'

Log '== remove old failing driver package =='
pnputil /delete-driver oem145.inf /uninstall /force 2>&1 | ForEach-Object { Log "  $_" }

Log '== install test-signed driver =='
pnputil /add-driver $inf /install 2>&1 | ForEach-Object { Log "  $_" }

Log '== rescan devices =='
pnputil /scan-devices 2>&1 | ForEach-Object { Log "  $_" }

Start-Sleep -Seconds 2
$dev = Get-PnpDevice -InstanceId $devId -ErrorAction SilentlyContinue
if ($dev) {
    Log ("dongle status: " + $dev.Status + " problem=" + $dev.Problem)
    pnputil /restart-device $devId 2>&1 | ForEach-Object { Log "  restart: $_" }
} else {
    Log 'dongle instance not found after install'
}

Log '== Bluetooth radios =='
Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue |
    Where-Object { $_.FriendlyName -match 'Broadcom|BCM|Bluetooth Adapter|Bluetooth Module' } |
    ForEach-Object { Log ("  " + $_.Status + " " + $_.FriendlyName + " [" + $_.InstanceId + "]") }

Log '== driver package in store =='
pnputil /enum-drivers 2>&1 | Select-String -Pattern 'bcbtums|oem' | Select-Object -First 8 | ForEach-Object { Log "  $($_.Line)" }
Log '=== done ==='
