@echo off
title MindGuardAI - Student Mental Wellness Detection and Early Intervention
color 0A

echo ===============================================================================
echo          MindGuardAI: Student Mental Wellness Detection and Early Intervention
echo ===============================================================================
echo [*] Checking runtime environment...

:: 1. Check Python backend virtualenv
if not exist "backend\.venv\Scripts\python.exe" (
    echo [!] Backend virtual environment not found in backend\.venv
    echo [*] Creating virtual environment...
    python -m venv backend\.venv
    call backend\.venv\Scripts\activate
    pip install -r backend\requirements.txt
) else (
    echo [+] Python virtual environment detected.
)

:: 2. Start Backend FastAPI Server
echo [*] Launching FastAPI Backend Gateway (Port 8000)...
start "MindGuard Backend Gateway" /min cmd /c "cd backend && .venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload"

:: 3. Start Frontend Dev Server
echo [*] Launching React Vite Frontend Client (Port 5173)...
start "MindGuard Frontend Client" /min cmd /c "cd frontend && npm run dev"

:: 4. Start Hardware Telemetry PC Agent
echo [*] Launching Passive Hardware Telemetry Agent...
start "MindGuard PC Telemetry Agent" /min cmd /c "cd desktop_agent && ..\backend\.venv\Scripts\python.exe mindguard_pc_agent.py"

:: 5. Open Platform in Default Web Browser
echo [*] Waiting for services to initialize...
timeout /t 5 /nobreak > nul

echo [+] All MindGuard services launched successfully!
echo.
echo ===============================================================================
echo  - Student Dashboard  : http://localhost:5173/student/dashboard
echo  - Counselor Queue    : http://localhost:5173/counselor/dashboard
echo  - Institution Portal : http://localhost:5173/admin/dashboard
echo  - Interactive Swagger: http://127.0.0.1:8000/docs
echo ===============================================================================
echo.

start http://localhost:5173
pause
