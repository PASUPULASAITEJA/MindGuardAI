@echo off
title MindGuard AI - Windows Startup Setup
color 0A
echo ========================================================
echo   MindGuard AI - Desktop Passive Phenotyping Agent
echo   Windows Boot-Time Screen Tracking Setup
echo ========================================================
echo.
echo Installing MindGuard Agent to Windows Startup...
cd /d "%~dp0.."
call backend\.venv\Scripts\python.exe desktop_agent\mindguard_pc_agent.py --install-startup
echo.
echo Starting MindGuard Agent in background now...
start "" "%~dp0..\backend\.venv\Scripts\pythonw.exe" "%~dp0mindguard_pc_agent.py" --background
echo.
echo Setup Complete!
echo MindGuard Agent is now running in the background and will
echo start automatically whenever your PC turns ON or wakes up.
echo.
pause
