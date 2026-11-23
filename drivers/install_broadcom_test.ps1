#Requires -RunAsAdministrator
$ErrorActionPreference = 'Continue'
$log = 'F:\Pawd\drivers\install_broadcom_test.log'
function Log($m) { $line = "$(Get-Date -Format 'HH:mm:ss') $m"; Write-Output $line; Add-Content $log $line }
Set-Content $log '=== Broadcom test-signing setup (elevated) ==='

$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$pr = New-Object Security.Principal.WindowsPrincipal($id)
Log ('IsAdmin=' + $pr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))

$cer = 'F:\Pawd\drivers\pawd-test.cer'
foreach ($store in @('Root', 'TrustedPublisher')) {
    $path = "Cert:\LocalMachine\$store"
    Log "importing certificate into $path"
    $c = Import-Certificate -FilePath $cer -CertStoreLocation $path -ErrorAction SilentlyContinue
    if ($c) { Log "  imported: $($c.Subject)" } else { Log '  import failed or already present' }
}

Log '== platform state =='
try { Log ('SecureBoot=' + (Confirm-SecureBootUEFI)) } catch { Log ('SecureBoot unknown: ' + $_.Exception.Message) }
$hvci = 'HKLM:\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity'
if (Test-Path $hvci) {
    $v = Get-ItemProperty $hvci -Name Enabled -ErrorAction SilentlyContinue
    Log ('HVCI.Enabled=' + $v.Enabled)
} else { Log 'HVCI key not present' }

Log '== enabling test signing =='
bcdedit /set testsigning on 2>&1 | ForEach-Object { Log "bcdedit: $_" }
bcdedit /get testsigning 2>&1 | ForEach-Object { Log "bcdedit get: $_" }
Log '=== done; reboot required for test signing to take effect ==='
