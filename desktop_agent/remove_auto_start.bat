@echo off
title MindGuard AI - Remove Windows Startup
color 0C
echo ========================================================
echo   MindGuard AI - Desktop Passive Phenotyping Agent
echo   Uninstall from Windows Startup
echo ========================================================
echo.
cd /d "%~dp0.."
call backend\.venv\Scripts\python.exe desktop_agent\mindguard_pc_agent.py --uninstall-startup
echo.
pause
