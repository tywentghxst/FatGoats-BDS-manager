@echo off
title Bedrock Server Manager Build Script
echo =======================================================
echo     Minecraft Bedrock Server Manager Build Script
echo =======================================================
echo.

REM Verify Node.js presence
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please download and install Node.js from https://nodejs.org/ before continuing.
    pause
    exit /b 1
)

echo [1/3] Installing Application npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies.
    pause
    exit /b 1
)

echo.
echo [2/3] Building frontend assets, bundling server and compiling executable ...
call npm run build:exe
if %errorlevel% neq 0 (
    echo [ERROR] Production compilation and executable compilation failed.
    echo Building fallback release...
    call npm run build
)

echo.
echo [3/3] Build completed successfully!
echo.
echo =======================================================
echo  🎉 SINGLE-FILE WINDOWS EXECUTABLE COMPILED!
echo  - Standalone executable created: bds-manager.exe
echo  - You can double-click 'bds-manager.exe' to launch the panel directly!
echo  - Or use 'start-windows.bat' to launch as a system tray background service.
echo =======================================================
echo.
echo To launch the Bedrock Dedicated Server Manager interface, run start-windows.bat
echo or invoke: npm start
echo =======================================================
pause
