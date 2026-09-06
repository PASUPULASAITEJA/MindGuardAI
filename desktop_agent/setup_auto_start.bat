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
echo Setup Complete!
echo MindGuard will now start automatically whenever your PC turns ON.
echo.
pause
