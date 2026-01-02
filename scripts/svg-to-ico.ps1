# PowerShell script to convert SVG to ICO format
# This script creates a multi-resolution ICO file suitable for Windows 7

param(
    [string]$SvgPath = "assets/icon.svg",
    [string]$IcoPath = "assets/icon.ico"
)

Write-Host "Converting SVG to ICO format..." -ForegroundColor Cyan

# Check if SVG file exists
if (-not (Test-Path $SvgPath)) {
    Write-Host "Error: SVG file not found at $SvgPath" -ForegroundColor Red
    exit 1
}

# For Windows, we'll use a simpler approach: create a basic ICO from the SVG
# This requires either ImageMagick or we can use a Node.js package

Write-Host ""
Write-Host "To convert the SVG to ICO, you have several options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use an online converter" -ForegroundColor Green
Write-Host "  1. Go to https://convertio.co/svg-ico/" -ForegroundColor White
Write-Host "  2. Upload assets/icon.svg" -ForegroundColor White
Write-Host "  3. Download the converted icon.ico" -ForegroundColor White
Write-Host "  4. Save it as assets/icon.ico" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Install ImageMagick and run:" -ForegroundColor Green
Write-Host "  magick convert assets/icon.svg -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Use the Node.js sharp package (recommended):" -ForegroundColor Green
Write-Host "  npm install --save-dev sharp" -ForegroundColor White
Write-Host "  node scripts/convert-icon.js" -ForegroundColor White
Write-Host ""

# Try to use Node.js with sharp if available
$sharpInstalled = $false
try {
    $npmList = npm list sharp 2>&1
    if ($LASTEXITCODE -eq 0) {
        $sharpInstalled = $true
    }
} catch {
    $sharpInstalled = $false
}

if ($sharpInstalled) {
    Write-Host "Sharp is installed. Running conversion script..." -ForegroundColor Green
    node scripts/convert-icon.js
} else {
    Write-Host "For automated conversion, install sharp: npm install --save-dev sharp" -ForegroundColor Yellow
}
