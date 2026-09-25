# MindGuardAI - Unified Platform Orchestration Script (PowerShell)
# Author: Pasupula Sai Teja & Avuti Anoushka

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "       MindGuardAI: Institutional Mental Health & Digital Phenotyping          " -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Cyan

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# 1. Backend Environment Check
$BackendPython = Join-Path $ProjectRoot "backend\.venv\Scripts\python.exe"
$BackendUvicorn = Join-Path $ProjectRoot "backend\.venv\Scripts\uvicorn.exe"

if (-not (Test-Path $BackendPython)) {
    Write-Host "[!] Backend virtualenv not found at backend\.venv. Creating..." -ForegroundColor Yellow
    python -m venv (Join-Path $ProjectRoot "backend\.venv")
    & $BackendPython -m pip install --upgrade pip
    & $BackendPython -m pip install -r (Join-Path $ProjectRoot "backend\requirements.txt")
}

# 2. Launch Backend Gateway
Write-Host "[*] Launching FastAPI Backend Gateway on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process -FilePath $BackendUvicorn -ArgumentList "app.main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory (Join-Path $ProjectRoot "backend") -WindowStyle Minimized

# 3. Launch Frontend Client
Write-Host "[*] Launching React Vite Frontend Client on http://localhost:5173..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory (Join-Path $ProjectRoot "frontend") -WindowStyle Minimized

# 4. Launch Desktop Agent
Write-Host "[*] Launching Windows Hardware Telemetry Agent..." -ForegroundColor Green
Start-Process -FilePath $BackendPython -ArgumentList "mindguard_pc_agent.py" -WorkingDirectory (Join-Path $ProjectRoot "desktop_agent") -WindowStyle Minimized

# 5. Wait & Launch Browser
Start-Sleep -Seconds 4
Write-Host "`n[+] All MindGuard services active!" -ForegroundColor Cyan
Write-Host "  - Student Portal     : http://localhost:5173/student/dashboard" -ForegroundColor White
Write-Host "  - Counselor Queue    : http://localhost:5173/counselor/dashboard" -ForegroundColor White
Write-Host "  - Admin Analytics    : http://localhost:5173/admin/dashboard" -ForegroundColor White
Write-Host "  - API Documentation  : http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "===============================================================================`n" -ForegroundColor Cyan

Start-Process "http://localhost:5173"
