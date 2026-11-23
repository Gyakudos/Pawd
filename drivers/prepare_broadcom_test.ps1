$ErrorActionPreference = 'Stop'
$src = 'F:\Pawd\drivers\BCM20702A0'
$dst = 'F:\Pawd\drivers\BCM20702A0-Test'
$log = 'F:\Pawd\drivers\prepare_broadcom_test.log'
function Log($m) { $line = "$(Get-Date -Format 'HH:mm:ss') $m"; Write-Output $line; Add-Content $log $line }
Set-Content $log '=== Broadcom test-signed package preparation ==='

$kit = 'C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64'
$makecat = Join-Path $kit 'makecat.exe'
$makecert = Join-Path $kit 'makecert.exe'
$signtool = Join-Path $kit 'signtool.exe'
foreach ($f in @($makecat, $makecert, $signtool)) {
    if (-not (Test-Path $f)) { throw "Missing tool: $f" }
}

if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
Copy-Item $src $dst -Recurse -Force
Log "copied package to $dst"

$inf = Join-Path $dst 'bcbtums.inf'
$text = [System.IO.File]::ReadAllText($inf, [System.Text.Encoding]::ASCII)

$text = $text.Replace('CatalogFile = bcbtums-x64.cat', 'CatalogFile = bcbtums-test.cat')
$text = $text.Replace('DriverVer = 07/30/2018,12.0.1.1104', 'DriverVer = 11/23/2026,12.0.1.1105')

$marker = '[Broadcom.NTamd64.10.0]'
$idx = $text.IndexOf($marker)
if ($idx -lt 0) { throw 'Win10 model section not found' }
$insertAt = $idx + $marker.Length
$newline = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }
$line = "$newline%BRCM20702B0.DeviceDesc%=RAMUSB0239,        USB\VID_19FF&PID_0239       ; Bestbuy 20702B0 micro (Win10 test)"
$text = $text.Insert($insertAt, $line)
[System.IO.File]::WriteAllText($inf, $text, [System.Text.Encoding]::ASCII)
Log 'INF updated (Win10 hardware ID + catalog name + DriverVer)'

$files = @()
$files += 'bcbtums.inf'
Get-ChildItem $dst -Filter '*.sys' | ForEach-Object { $files += $_.Name }
Get-ChildItem $dst -Filter '*.hex' | ForEach-Object { $files += $_.Name }
$cdf = Join-Path $dst 'pawd-test.cdf'
$cdfText = @(
    '[CatalogHeader]',
    'Name=bcbtums-test.cat',
    'ResultDir=.\',
    'PublicVersion=0x00000001',
    'EncodingType=',
    '',
    '[CatalogFiles]'
)
for ($i = 0; $i -lt $files.Count; $i++) {
    $cdfText += "file$i=.\\$($files[$i])"
}
[System.IO.File]::WriteAllText($cdf, ($cdfText -join "`r`n") + "`r`n", [System.Text.Encoding]::ASCII)
Log "CDF written with $($files.Count) files"

Push-Location $dst
try {
    & $makecat -v pawd-test.cdf 2>&1 | ForEach-Object { Log "makecat: $_" }
    if (-not (Test-Path (Join-Path $dst 'bcbtums-test.cat'))) { throw 'makecat did not create catalog' }
    Log 'catalog created'

    $certName = 'Pawd Broadcom Test Signing'
    $cer = 'F:\Pawd\drivers\pawd-test.cer'
    & $makecert -r -pe -n "CN=$certName" -ss My -sr CurrentUser -sky code -eku 1.3.6.1.5.5.7.3.3 -len 2048 $cer 2>&1 | ForEach-Object { Log "makecert: $_" }
    if (-not (Test-Path $cer)) { throw 'makecert did not create certificate' }
    Log "certificate created: $cer"

    & $signtool sign /n $certName /fd SHA256 /v 'bcbtums-test.cat' 2>&1 | ForEach-Object { Log "signtool: $_" }
    Log 'catalog signed'
} finally {
    Pop-Location
}
Log '=== done ==='
