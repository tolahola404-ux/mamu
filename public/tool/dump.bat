@echo off
title Project Dumper
color 0A

echo.
echo  ============================================
echo   Project Content Dumper
echo   Reads project, saves to _PROJECT_DUMP.txt
echo  ============================================
echo.

:: Run from the folder where this bat file lives (project root)
cd /d "%~dp0"

:: Check if node is available
where node >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js is not installed or not on PATH.
    echo  Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Run the dumper
node "%~dp0dump.js"

if errorlevel 1 (
    echo.
    echo  ERROR: Something went wrong running dump.js
    echo.
    pause
    exit /b 1
)

echo  Press any key to close...
pause >nul
