@echo off
title Bedrock Server Manager Launcher
echo =======================================================
echo     Minecraft Bedrock Server Manager Launcher
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

REM Check if first-run setup is needed
if not exist node_modules (
    echo [INFO] First-time setup detected. Installing dependencies...
    call npm install
)

if not exist dist (
    echo [INFO] Bundling production application code...
    call npm run build
)

echo.
echo =======================================================
echo  Server Web Panel is starting!
echo  - Open your browser to: http://localhost:3000
echo  - Log in with your administration credentials.
echo  - Go to the Addons/Software sections to configure!
echo =======================================================
echo.
call npm start
pause
