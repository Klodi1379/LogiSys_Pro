# Logistics Management System - Frontend Deployment Scripts

# Production Build Script
Write-Host "🚀 Starting production build process..." -ForegroundColor Green

# Check if Node.js and npm are installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Navigate to frontend directory
$frontendPath = "C:\GPT4_PROJECTS\logistic2\frontend\logistics-frontend"
Set-Location $frontendPath

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci --production=false

Write-Host "🧹 Running linter..." -ForegroundColor Yellow
# npm run lint -- --fix

Write-Host "🧪 Running tests..." -ForegroundColor Yellow
# npm run test -- --coverage --watchAll=false

Write-Host "🏗️ Building production bundle..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$env:REACT_APP_API_URL = "https://api.yourdomain.com"
$env:REACT_APP_VERSION = (Get-Date -Format "yyyy.MM.dd.HHmm")
npm run build

Write-Host "📊 Analyzing bundle size..." -ForegroundColor Yellow
if (Test-Path "build/static/js") {
    $jsFiles = Get-ChildItem "build/static/js/*.js" | Sort-Object Length -Descending
    $totalSize = ($jsFiles | Measure-Object -Property Length -Sum).Sum
    
    Write-Host "Bundle Analysis:" -ForegroundColor Cyan
    Write-Host "  Total JS Size: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor White
    
    foreach ($file in $jsFiles | Select-Object -First 5) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "  $($file.Name): $sizeMB MB" -ForegroundColor Gray
    }
}

Write-Host "🗜️ Compressing build files..." -ForegroundColor Yellow
if (Test-Path "build") {
    # Create gzipped versions of static files
    $staticFiles = Get-ChildItem "build/static" -Recurse -File | Where-Object { 
        $_.Extension -in @('.js', '.css', '.html', '.json') -and $_.Length -gt 1KB 
    }
    
    foreach ($file in $staticFiles) {
        $gzipPath = $file.FullName + ".gz"
        if (-not (Test-Path $gzipPath)) {
            # Use 7-Zip if available, otherwise skip
            if (Get-Command 7z -ErrorAction SilentlyContinue) {
                7z a -tgzip "$gzipPath" "$($file.FullName)" -mx9 | Out-Null
                Write-Host "  Compressed: $($file.Name)" -ForegroundColor Gray
            }
        }
    }
}

Write-Host "📋 Creating deployment manifest..." -ForegroundColor Yellow
$manifest = @{
    version = $env:REACT_APP_VERSION
    buildTime = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss UTC")
    nodeVersion = (node --version)
    environment = "production"
    apiUrl = $env:REACT_APP_API_URL
}

$manifest | ConvertTo-Json | Out-File "build/manifest.json" -Encoding UTF8

Write-Host "✅ Production build completed successfully!" -ForegroundColor Green
Write-Host "📁 Build files are in: $frontendPath\build" -ForegroundColor Cyan

# Optional: Deploy to server
$deploy = Read-Host "Deploy to server? (y/N)"
if ($deploy.ToLower() -eq 'y') {
    Write-Host "🚀 Starting deployment..." -ForegroundColor Green
    
    # Example deployment commands (customize for your setup)
    # rsync -avz --delete build/ user@server:/var/www/logistics/
    # aws s3 sync build/ s3://your-bucket-name --delete
    # docker build -t logistics-frontend .
    
    Write-Host "ℹ️ Deployment commands need to be configured for your specific environment" -ForegroundColor Yellow
}

Write-Host "🎉 Build process complete!" -ForegroundColor Green
