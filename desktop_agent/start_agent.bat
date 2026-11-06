@echo off
title MindGuard AI - Desktop Wellness Agent
echo ========================================================
echo    MindGuard AI - Automatic Desktop Telemetry Agent
echo ========================================================
echo [*] Initializing automatic zero-prompt pairing...

cd /d "%~dp0"
if exist "..\backend\.venv\Scripts\python.exe" (
    "..\backend\.venv\Scripts\python.exe" mindguard_pc_agent.py
) else if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" mindguard_pc_agent.py
) else (
    python mindguard_pc_agent.py
)
pause
