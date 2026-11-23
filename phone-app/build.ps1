param(
    [string]$Sdk = "F:\dev\android-sdk",
    [string]$Out = "",
    [switch]$SkipPackage
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($Out)) {
    $Out = Join-Path (Split-Path -Parent $Root) "static\pawd-selftest.apk"
}

$Build = Join-Path $Root "build"
$ResZip = Join-Path $Build "res.zip"
$Gen = Join-Path $Build "gen"
$Classes = Join-Path $Build "classes"
$Dex = Join-Path $Build "dex"
$BaseApk = Join-Path $Build "base.apk"
$Unaligned = Join-Path $Build "unaligned.apk"
$Aligned = Join-Path $Build "aligned.apk"
$Signed = Join-Path $Build "signed.apk"
$Keystore = Join-Path $Root "debug.keystore"

$AndroidJar = Join-Path $Sdk "platforms\android-36\android.jar"
$BuildTools = Join-Path $Sdk "build-tools\36.0.0"
$aapt2 = Join-Path $BuildTools "aapt2.exe"
$d8 = Join-Path $BuildTools "d8.bat"
$zipalign = Join-Path $BuildTools "zipalign.exe"
$apksigner = Join-Path $BuildTools "apksigner.bat"

foreach ($tool in @($aapt2, $d8, $zipalign, $apksigner, $AndroidJar)) {
    if (!(Test-Path $tool)) { throw "Missing required tool: $tool" }
}
foreach ($cmd in @("javac", "jar", "keytool")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        throw "Required command not found on PATH: $cmd"
    }
}

if (Test-Path $Build) { Remove-Item $Build -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Build, $Gen, $Classes, $Dex | Out-Null

if (!(Test-Path $Keystore)) {
    Write-Host "Generating debug keystore..."
    & keytool -genkeypair -keystore $Keystore -storepass android -keypass android `
        -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 `
        -dname "CN=Android Debug,O=Android,C=US" -noprompt
    if ($LASTEXITCODE -ne 0) { throw "keytool failed" }
}

Write-Host "Compiling resources..."
& $aapt2 compile --dir (Join-Path $Root "res") -o $ResZip
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed" }

Write-Host "Linking APK resources..."
& $aapt2 link -o $BaseApk -I $AndroidJar `
    --manifest (Join-Path $Root "AndroidManifest.xml") `
    -R $ResZip --java $Gen `
    --min-sdk-version 26 --target-sdk-version 36 `
    --version-code 1 --version-name "1.0" --auto-add-overlay
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed" }

Write-Host "Compiling Java sources..."
$rJava = Join-Path $Gen "com\pawd\selftest\R.java"
$sources = @(Get-ChildItem (Join-Path $Root "java") -Recurse -Filter *.java |
    ForEach-Object { $_.FullName })
$javacArgs = @("--release", "11", "-encoding", "UTF-8", "-classpath", $AndroidJar,
    "-d", $Classes, $rJava) + $sources
& javac @javacArgs
if ($LASTEXITCODE -ne 0) { throw "javac failed" }

Write-Host "Dexing classes..."
$classFiles = @(Get-ChildItem $Classes -Recurse -Filter *.class |
    ForEach-Object { $_.FullName })
& $d8 --release --lib $AndroidJar --min-api 26 --output $Dex @classFiles
if ($LASTEXITCODE -ne 0) { throw "d8 failed" }

Write-Host "Packaging dex into APK..."
Copy-Item $BaseApk $Unaligned -Force
& jar uf $Unaligned -C $Dex classes.dex
if ($LASTEXITCODE -ne 0) { throw "jar update failed" }

Write-Host "Aligning APK..."
& $zipalign -f 4 $Unaligned $Aligned
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

Write-Host "Signing APK..."
& $apksigner sign --ks $Keystore --ks-key-alias androiddebugkey `
    --ks-pass pass:android --key-pass pass:android `
    --out $Signed $Aligned
if ($LASTEXITCODE -ne 0) { throw "apksigner sign failed" }

& $apksigner verify --print-certs $Signed
if ($LASTEXITCODE -ne 0) { throw "apksigner verify failed" }

if (-not $SkipPackage) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Out) | Out-Null
    Copy-Item $Signed $Out -Force
    Write-Host "Built: $Out"
} else {
    Write-Host "Built: $Signed"
}
