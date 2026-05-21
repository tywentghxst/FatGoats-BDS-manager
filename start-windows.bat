@echo off
title Bedrock Server Manager Launcher
echo =======================================================
echo     Minecraft Bedrock Server Manager Launcher
echo =======================================================
echo.

REM Verify Node.js presence if running direct node
where node >nul 2>nul
if %errorlevel% neq 0 (
    if not exist bds-manager.exe (
        echo [ERROR] Node.js is not installed or not in your PATH.
        echo Please download and install Node.js from https://nodejs.org/ before continuing.
        pause
        exit /b 1
    )
)

REM Check if first-run setup is needed
if not exist bds-manager.exe (
    if not exist node_modules (
        echo [INFO] First-time setup detected. Installing dependencies...
        call npm install
    )
    if not exist dist (
        echo [INFO] Bundling production application code...
        call npm run build
    )
)

echo Select how you want to start the Bedrock Server Manager:
echo [1] Start as a BACKGROUND service with Windows System Tray Icon (Recommended)
echo [2] Start in FOREGROUND console (standard logs window)
echo.
set /p choice="Enter election [1 or 2]: "

if "%choice%"=="2" (
    echo.
    echo =======================================================
    echo  Server Web Panel is starting!
    echo  - Open your browser to: http://localhost:3000
    echo  - Log in with your administration credentials.
    echo =======================================================
    echo.
    if exist bds-manager.exe (
        bds-manager.exe
    ) else (
        call npm start
    )
    echo.
    echo [INFO] Server process has stopped.
    pause
) else (
    echo.
    echo =======================================================
    echo  Launching Background Service and System Tray Icon...
    echo  - The portal will run silently in the background.
    echo  - You will see an elegant green 'B' icon in your system tray (lower right).
    echo  - Double-click the 'B' icon to open the administration console.
    echo  - Right-click the icon to stop, restart or shutdown the manager.
    echo =======================================================
    echo.
    powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File .\start-windows-tray.ps1
)
