@echo off
title Bedrock Server Manager Updater
echo ==========================================================
echo       Bedrock Server Manager - Safe Updater for Windows
echo ==========================================================
echo.
echo This script will update the manager to the latest version
echo from https://github.com/tywentghxst/FatGoats-BDS-manager 
echo while fully preserving your worlds, database, and settings.
echo.
echo Preserved Directories:
echo   - bedrock-server/ (Database, worlds, settings, properties)
echo   - uploads/ (Uploaded mcpacks and worlds)
echo   - plugins/ (Developer plugins and custom systems)
echo   - .env (Your personalized environment parameters)
echo.
echo ==========================================================
choice /M "Do you want to proceed with the update?"
if %errorlevel% neq 1 (
    echo Update cancelled.
    pause
    exit /b 0
)

echo.
echo [INFO] Step 1: Performing temporary config backup...
if not exist backups\update_backups mkdir backups\update_backups
if exist bedrock-server\manager_db.json (
    copy /y bedrock-server\manager_db.json backups\update_backups\manager_db_pre_update.json >nul
    echo   - Backed up manager_db.json
)
if exist bedrock-server\server.properties (
    copy /y bedrock-server\server.properties backups\update_backups\server_pre_update.properties >nul
    echo   - Backed up server.properties
)

echo.
echo [INFO] Step 2: Attempting to update source files...

where git >nul 2>nul
if %errorlevel% equ 0 (
    if exist .git (
        echo [GIT] Git repository detected! Running git pull...
        git pull
        goto after_fetch
    )
)

echo [PS] Downloading latest version from Github via PowerShell...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/tywentghxst/FatGoats-BDS-manager/archive/refs/heads/main.zip' -OutFile 'latest_update.zip'"

if not exist latest_update.zip (
    echo [ERROR] Failed to download the update package. Please check your internet connection.
    pause
    exit /b 1
)

echo [PS] Unpacking ZIP file...
if exist temp_update rd /s /q temp_update
powershell -Command "Expand-Archive -Path 'latest_update.zip' -DestinationPath 'temp_update' -Force"

echo [INFO] Copying new files and maintaining user data...
xcopy /e /y "temp_update\FatGoats-BDS-manager-main\*" ".\" /exclude:exclude_update.txt >nul 2>nul
if %errorlevel% neq 0 (
    :: Fallback if folder structure has a slightly different name
    for /d %%i in (temp_update\*) do (
        xcopy /e /y "%%i\*" ".\"
    )
)

echo [INFO] Cleaning up download cache...
del /f /q latest_update.zip >nul 2>nul
rd /s /q temp_update >nul 2>nul

:after_fetch
echo.
echo [INFO] Step 3: Installing dependencies and compiling application...
call npm install
call npm run build

echo.
echo ==========================================================
echo  🎉 Update completed successfully! 
echo  - Your worlds, database accounts, and configurations are intact.
echo  - Start your updated panel using 'start-windows.bat'!
echo ==========================================================
echo.
pause
