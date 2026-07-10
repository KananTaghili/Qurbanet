# ============================================================
#  Sacrifice Platform - Exe Build Script
#  4 layihe ucun Windows exe yaradır
# ============================================================

$ROOT = "d:\Works\Sacrifice"
$OUT  = "$ROOT\all_exes"

# Renkli output funksiyaları
function OK($msg)  { Write-Host "[OK] $msg" -ForegroundColor Green }
function ERR($msg) { Write-Host "[XETA] $msg" -ForegroundColor Red }
function INFO($msg){ Write-Host "[...] $msg" -ForegroundColor Cyan }
function HEAD($msg){ Write-Host "`n====== $msg ======" -ForegroundColor Yellow }

# all_exes qovluğunu yarat
HEAD "all_exes qovluğu yaradılır"
if (-not (Test-Path $OUT)) { New-Item -ItemType Directory -Path $OUT | Out-Null }
OK "all_exes: $OUT"

# ─────────────────────────────────────────────────────────
# 1. BACKEND
# ─────────────────────────────────────────────────────────
HEAD "1/4 BACKEND"
Set-Location "$ROOT\backend"

INFO "npm install..."
npm install --silent 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { ERR "npm install uğursuz"; exit 1 }
OK "Asılılıqlar quraşdırıldı"

INFO "pkg ile backend.exe yaradılır..."
npx pkg pkg-entry.js --targets node18-win-x64 --output "$OUT\backend.exe" 2>&1
if ($LASTEXITCODE -ne 0) { ERR "Backend pkg uğursuz"; exit 1 }
OK "backend.exe → $OUT\backend.exe"

# .env nümunəsi yarat (istifadəçi dolduracaq)
if (-not (Test-Path "$OUT\backend.env.example")) {
@"
# Bu faylı doldurun ve ".env" adina rename edin
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/sacrifice
PORT=5000
JWT_SECRET=gizli_jwt_secret_buraya
JWT_EXPIRES_IN=7d
ADMIN_JWT_SECRET=gizli_admin_jwt_buraya
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
TEST_MODE=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app_password
"@ | Out-File -FilePath "$OUT\backend.env.example" -Encoding utf8
}
OK ".env.example yaradıldı"

# ─────────────────────────────────────────────────────────
# 2. ADMIN (Vite SPA)
# ─────────────────────────────────────────────────────────
HEAD "2/4 ADMIN PANEL"
Set-Location "$ROOT\admin"

INFO "npm install..."
npm install --silent 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { ERR "npm install uğursuz"; exit 1 }

INFO "vite build..."
npm run build 2>&1
if ($LASTEXITCODE -ne 0) { ERR "Admin build uğursuz"; exit 1 }
OK "Admin dist qovluğu hazır"

INFO "pkg ile admin.exe yaradılır..."
npx pkg serve.cjs --config pkg-admin.json --targets node18-win-x64 --output "$OUT\admin.exe" 2>&1
if ($LASTEXITCODE -ne 0) { ERR "Admin pkg uğursuz"; exit 1 }
OK "admin.exe → $OUT\admin.exe"

# ─────────────────────────────────────────────────────────
# 3. WEB (Next.js)
# ─────────────────────────────────────────────────────────
HEAD "3/4 WEB SAYT"
Set-Location "$ROOT\web"

INFO "npm install..."
npm install --silent 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { ERR "npm install uğursuz"; exit 1 }

INFO "Next.js standalone build... (bu bir az çəkər)"
npm run build 2>&1
if ($LASTEXITCODE -ne 0) { ERR "Web build uğursuz"; exit 1 }
OK "Next.js standalone build hazır"

# .next/static ve public fayllarını standalone qovluğuna kopyala
$standalone = "$ROOT\web\.next\standalone"
INFO ".next/static kopyalanır..."
if (Test-Path "$ROOT\web\.next\static") {
    if (-not (Test-Path "$standalone\.next")) { New-Item -ItemType Directory -Path "$standalone\.next" | Out-Null }
    Copy-Item "$ROOT\web\.next\static" "$standalone\.next\static" -Recurse -Force
}
if (Test-Path "$ROOT\web\public") {
    Copy-Item "$ROOT\web\public" "$standalone\public" -Recurse -Force
}
OK "Static fayllar kopyalandı"

INFO "pkg ile web.exe yaradılır... (böyük ola bilər)"
Set-Location $standalone
npx pkg server.js --config "$ROOT\web\pkg-web.json" --targets node18-win-x64 --output "$OUT\web.exe" 2>&1
if ($LASTEXITCODE -ne 0) { ERR "Web pkg uğursuz"; exit 1 }
OK "web.exe → $OUT\web.exe"

# ─────────────────────────────────────────────────────────
# 4. MOBILE (Expo Web Export)
# ─────────────────────────────────────────────────────────
HEAD "4/4 MOBİL APP (Web versiyası)"
Set-Location "$ROOT\mobile"

INFO "npm install..."
npm install --silent 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { ERR "npm install uğursuz"; exit 1 }

INFO "Expo web export... (bu bir az çəkər)"
npx expo export --platform web 2>&1
if ($LASTEXITCODE -ne 0) { ERR "Expo export uğursuz"; exit 1 }
OK "Mobile web dist hazır"

INFO "pkg ile mobile.exe yaradılır..."
npx pkg serve.cjs --config pkg-mobile.json --targets node18-win-x64 --output "$OUT\mobile.exe" 2>&1
if ($LASTEXITCODE -ne 0) { ERR "Mobile pkg uğursuz"; exit 1 }
OK "mobile.exe → $OUT\mobile.exe"

# ─────────────────────────────────────────────────────────
# START_ALL.bat yaradılır
# ─────────────────────────────────────────────────────────
HEAD "Launcher yaradılır"
Set-Location $OUT

@"
@echo off
title Qurban Platform

echo ================================
echo   Qurban Platform Baslayir...
echo ================================
echo.
echo [1] Backend API:   http://localhost:5000
echo [2] Web Sayt:      http://localhost:3001
echo [3] Admin Panel:   http://localhost:3000
echo [4] Mobil App:     http://localhost:8081
echo.
echo NOT: backend.exe ucun .env fayli lazimdir!
echo      backend.env.example faylini gorun.
echo.

start "Backend API"   backend.exe
timeout /t 3 /nobreak > nul
start "Web Sayt"      web.exe
start "Admin Panel"   admin.exe
start "Mobil App"     mobile.exe

echo Hamisi basladi! Tarayicini ac:
echo   Web:   http://localhost:3001
echo   Admin: http://localhost:3000
echo.
pause
"@ | Out-File -FilePath "$OUT\START_ALL.bat" -Encoding ascii
OK "START_ALL.bat yaradıldı"

# ─────────────────────────────────────────────────────────
# NƏTİCƏ
# ─────────────────────────────────────────────────────────
HEAD "TAMAMLANDI"
Write-Host ""
Write-Host "  Butun exe-ler: $OUT" -ForegroundColor Green
Write-Host ""
Get-ChildItem $OUT | Format-Table Name, @{Label='Boyut';Expression={"{0:N1} MB" -f ($_.Length/1MB)}} -AutoSize
Write-Host ""
Write-Host "  Dostun komputerinde isletmek ucun:" -ForegroundColor Yellow
Write-Host "  1. all_exes qovluğunu kopyala" -ForegroundColor White
Write-Host "  2. backend.env.example -> .env adina rename et ve doldur" -ForegroundColor White
Write-Host "  3. START_ALL.bat-i calis" -ForegroundColor White
Write-Host ""
