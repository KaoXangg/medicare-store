# MediCare Store - Cai dat tu dong (goi boi CAI-DAT.bat)
# Ban chi can sua DB_SERVER, DB_USER, DB_PASSWORD trong backend\.env

$ErrorActionPreference = "Continue"
$Root = $PSScriptRoot
$failed = $false

function Write-Step($n, $total, $msg) {
    Write-Host ""
    Write-Host "[$n/$total] $msg" -ForegroundColor Yellow
}

function Read-EnvFile($path) {
    $env = @{}
    if (-not (Test-Path $path)) { return $env }
    Get-Content $path | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $env[$Matches[1].Trim()] = $Matches[2].Trim()
        }
    }
    return $env
}

function Test-SqlConnection($server, $user, $pass) {
    $sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
    if (-not $sqlcmd) { return $false }
    $out = & sqlcmd -S $server -U $user -P $pass -Q "SELECT 1" -h -1 -W 2>&1
    return $LASTEXITCODE -eq 0
}

function Test-UsersTable($server, $user, $pass, $db) {
    $sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
    if (-not $sqlcmd) { return $false }
    $qDb = "IF EXISTS (SELECT name FROM sys.databases WHERE name = N'$db') SELECT 1 ELSE SELECT 0"
    $rDb = & sqlcmd -S $server -U $user -P $pass -Q $qDb -h -1 -W 2>&1
    if ($LASTEXITCODE -ne 0 -or "$rDb" -notmatch "1") { return $false }
    $q = "IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Users') SELECT 1 ELSE SELECT 0"
    $out = & sqlcmd -S $server -U $user -P $pass -d $db -Q $q -h -1 -W 2>&1
    return ($LASTEXITCODE -eq 0) -and ("$out" -match "1")
}

Write-Host ""
Write-Host "  MEDICARE STORE - CAI DAT TU DONG" -ForegroundColor Cyan
Write-Host "  =================================" -ForegroundColor Cyan

# --- 1. Node.js ---
Write-Step 1 7 "Kiem tra Node.js"
try {
    $nv = node -v
    Write-Host "  OK - Node $nv" -ForegroundColor Green
} catch {
    Write-Host "  LOI: Chua cai Node.js! Tai https://nodejs.org (LTS)" -ForegroundColor Red
    exit 1
}

# --- 2. File .env ---
Write-Step 2 7 "Cau hinh file .env"

$backendEnvPath = Join-Path $Root "backend\.env"
$envExamplePath = Join-Path $Root "backend\.env.example"
$isNewEnv = $false

if (-not (Test-Path $backendEnvPath)) {
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $backendEnvPath
    } else {
        @"
PORT=5000
NODE_ENV=development
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourPassword
DB_NAME=MediCareStore
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=medicare-jwt-secret-doi-khi-deploy
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
APP_NAME=MediCare Store
APP_URL=http://localhost:5000
"@ | Set-Content $backendEnvPath -Encoding UTF8
    }
    $isNewEnv = $true
    Write-Host "  Da tao backend\.env (file moi)" -ForegroundColor Green
} else {
    Write-Host "  OK - Giu nguyen backend\.env hien co" -ForegroundColor Green
}

# Frontend .env (luon tao/cap nhat - khong can sua)
$frontendEnv = @"
VITE_API_URL=http://localhost:5000/api
VITE_UPLOAD_URL=http://localhost:5000
"@
Set-Content -Path (Join-Path $Root "frontend\.env") -Value $frontendEnv -Encoding UTF8
Write-Host "  OK - frontend\.env" -ForegroundColor Green

if ($isNewEnv) {
    Write-Host ""
    Write-Host "  >>> MO FILE backend\.env VA SUA 3 DONG SAU <<<" -ForegroundColor Magenta
    Write-Host "      DB_SERVER=ten-may-hoac-localhost" -ForegroundColor White
    Write-Host "      DB_USER=ten-dang-nhap-sql" -ForegroundColor White
    Write-Host "      DB_PASSWORD=mat-khau-sql" -ForegroundColor White
    Write-Host ""
    Start-Process notepad $backendEnvPath
    Read-Host "  Sau khi Sua + Luu file .env, nhan Enter de tiep tuc cai dat"
}

$envVars = Read-EnvFile $backendEnvPath
$dbServer = $envVars["DB_SERVER"]
$dbUser   = $envVars["DB_USER"]
$dbPass   = $envVars["DB_PASSWORD"]
$dbName   = if ($envVars["DB_NAME"]) { $envVars["DB_NAME"] } else { "MediCareStore" }

if ([string]::IsNullOrWhiteSpace($dbServer) -or [string]::IsNullOrWhiteSpace($dbUser) -or [string]::IsNullOrWhiteSpace($dbPass)) {
    Write-Host "  LOI: backend\.env thieu DB_SERVER / DB_USER / DB_PASSWORD" -ForegroundColor Red
    exit 1
}

if ($dbPass -eq "YourPassword" -or $dbPass -eq "YourStrongPassword123") {
    Write-Host "  CANH BAO: Ban chua doi DB_PASSWORD trong .env!" -ForegroundColor Red
    Read-Host "  Sua mat khau that roi nhan Enter, hoac nhan Enter de thu tiep"
    $envVars = Read-EnvFile $backendEnvPath
    $dbPass = $envVars["DB_PASSWORD"]
}

# --- 3. Thu muc uploads ---
Write-Step 3 7 "Tao thu muc uploads"
$uploadDirs = @("products", "categories", "banners", "brands", "avatars", "reviews", "pages")
foreach ($sub in $uploadDirs) {
    $dir = Join-Path $Root "backend\uploads\$sub"
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}
Write-Host "  OK" -ForegroundColor Green

# --- 4. npm install ---
Write-Step 4 7 "Cai dat thu vien npm (co the mat 2-5 phut)"

Push-Location (Join-Path $Root "backend")
Write-Host "  Backend..." -ForegroundColor DarkGray
npm install 2>&1 | ForEach-Object { if ($_ -match "error|ERR!") { Write-Host $_ -ForegroundColor Red } }
if ($LASTEXITCODE -ne 0) { $failed = $true; Write-Host "  LOI npm install backend" -ForegroundColor Red }
else { Write-Host "  OK - Backend" -ForegroundColor Green }
Pop-Location

Push-Location (Join-Path $Root "frontend")
Write-Host "  Frontend..." -ForegroundColor DarkGray
npm install 2>&1 | ForEach-Object { if ($_ -match "error|ERR!") { Write-Host $_ -ForegroundColor Red } }
if ($LASTEXITCODE -ne 0) { $failed = $true; Write-Host "  LOI npm install frontend" -ForegroundColor Red }
else { Write-Host "  OK - Frontend" -ForegroundColor Green }
Pop-Location

# --- 5. SQL Database ---
Write-Step 5 7 "Cau hinh SQL Server"

$sqlcmdOk = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmdOk) {
    Write-Host "  Khong co sqlcmd - bo qua chay SQL" -ForegroundColor Yellow
    Write-Host "  Hay mo SSMS chay file: SQL\install-safe.sql (an toan)" -ForegroundColor Yellow
    Write-Host "  Hoac may moi: SQL\SQLQuery1.sql" -ForegroundColor Yellow
} elseif (-not (Test-SqlConnection $dbServer $dbUser $dbPass)) {
    Write-Host "  LOI ket noi SQL! Kiem tra lai backend\.env:" -ForegroundColor Red
    Write-Host "    DB_SERVER=$dbServer" -ForegroundColor DarkGray
    Write-Host "    DB_USER=$dbUser" -ForegroundColor DarkGray
    Write-Host "  - SQL Server da bat chua?" -ForegroundColor Yellow
    Write-Host "  - Mixed Mode + mat khau dung chua?" -ForegroundColor Yellow
    $failed = $true
} else {
    Write-Host "  OK - Ket noi SQL thanh cong" -ForegroundColor Green

    $hasUsers = Test-UsersTable $dbServer $dbUser $dbPass $dbName
    if ($hasUsers) {
        $sqlFile = Join-Path $Root "SQL\install-safe.sql"
        Write-Host "  DB da co du lieu -> chay install-safe.sql (giu nguyen data)" -ForegroundColor DarkGray
    } else {
        $sqlFile = Join-Path $Root "SQL\SQLQuery1.sql"
        Write-Host "  DB moi -> chay SQLQuery1.sql (du lieu mau)" -ForegroundColor DarkGray
    }

    if (Test-Path $sqlFile) {
        & sqlcmd -S $dbServer -U $dbUser -P $dbPass -i $sqlFile 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  OK - SQL hoan tat" -ForegroundColor Green
        } else {
            Write-Host "  CANH BAO: SQL co loi - thu chay tay trong SSMS: $sqlFile" -ForegroundColor Yellow
        }
    }
}

# --- 6. ensureSchema + seed ---
Write-Step 6 7 "Dong bo schema & tai khoan demo"

Push-Location (Join-Path $Root "backend")
try {
    node -e "import('./src/config/ensureSchema.js').then(m=>m.ensureSchema()).then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})" 2>&1 | Out-Host
    if ($LASTEXITCODE -eq 0) { Write-Host "  OK - ensureSchema" -ForegroundColor Green }
    else { Write-Host "  CANH BAO: ensureSchema - kiem tra ket noi DB" -ForegroundColor Yellow }
} catch {
    Write-Host "  CANH BAO: ensureSchema bo qua" -ForegroundColor Yellow
}

try {
    npm run seed 2>&1 | Out-Host
    if ($LASTEXITCODE -eq 0) { Write-Host "  OK - Tai khoan admin/user" -ForegroundColor Green }
} catch {
    Write-Host "  CANH BAO: seed bo qua (co the da co tai khoan)" -ForegroundColor Yellow
}
Pop-Location

# --- 7. Ket thuc ---
Write-Step 7 7 "Hoan tat"

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "   CAI DAT XONG!" -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Mo VS Code, 2 terminal:" -ForegroundColor White
Write-Host ""
Write-Host "    Terminal 1:" -ForegroundColor Cyan
Write-Host "      cd backend" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "    Terminal 2:" -ForegroundColor Cyan
Write-Host "      cd frontend" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Truy cap: http://localhost:5173" -ForegroundColor Green
Write-Host "  Admin:    http://localhost:5173/admin" -ForegroundColor Green
Write-Host ""
Write-Host "  Dang nhap:" -ForegroundColor White
Write-Host "    admin@medicarestore.com / Admin@123" -ForegroundColor DarkGray
Write-Host "    user@medicarestore.com  / User@123" -ForegroundColor DarkGray
Write-Host ""

if ($failed) { exit 1 }
exit 0
