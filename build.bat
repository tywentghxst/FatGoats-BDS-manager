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
echo [2/3] Building frontend assets and bundling server components...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Production compilation failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Build completed successfully!
echo.
echo To launch the Bedrock Dedicated Server Manager interface, run start-windows.bat
echo or invoke: npm start
echo =======================================================
pause
