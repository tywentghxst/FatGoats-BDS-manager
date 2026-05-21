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

echo [INFO] Querying latest branch ZIP files...
set "DOWNLOADED="

where curl >nul 2>nul
if %errorlevel% equ 0 (
    echo [CURL] Downloading master branch...
    curl -f -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BedrockServerManager" -o latest_update.zip https://github.com/tywentghxst/FatGoats-BDS-manager/archive/refs/heads/master.zip
    if exist latest_update.zip (
        set "DOWNLOADED=true"
    ) else (
        echo [CURL] Downloading main branch...
        curl -f -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BedrockServerManager" -o latest_update.zip https://github.com/tywentghxst/FatGoats-BDS-manager/archive/refs/heads/main.zip
        if exist latest_update.zip set "DOWNLOADED=true"
    )
)

if not defined DOWNLOADED (
    echo [PS] Falling back to PowerShell download with User-Agent...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $urls = @('https://github.com/tywentghxst/FatGoats-BDS-manager/archive/refs/heads/master.zip', 'https://github.com/tywentghxst/FatGoats-BDS-manager/archive/refs/heads/main.zip'); foreach ($url in $urls) { try { Write-Host 'Fetching' $url; Invoke-WebRequest -Uri $url -UserAgent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BedrockServerManager' -OutFile 'latest_update.zip' -ErrorAction Stop; if (Test-Path 'latest_update.zip') { Write-Host 'Download successful!'; break } } catch {} }"
)

if not exist latest_update.zip (
    echo [ERROR] Failed to download the update package. Please check your internet connection or repository branch.
    pause
    exit /b 1
)

echo [PS] Unpacking ZIP archive...
if exist temp_update rd /s /q temp_update
powershell -Command "Expand-Archive -Path 'latest_update.zip' -DestinationPath 'temp_update' -Force"

echo [INFO] Generating temporary backup exceptions...
(
echo bedrock-server\
echo uploads\
echo plugins\
echo backups\
echo .env
echo .git\
) > exclude_update.txt

echo [INFO] Restoring new assets and applying user protection rules...
for /d %%i in (temp_update\*) do (
    echo   - Copying from repository folder: %%~nxi
    xcopy /e /y "%%i\*" ".\" /exclude:exclude_update.txt >nul 2>nul
)

echo [INFO] Cleaning up download cache...
del /f /q latest_update.zip >nul 2>nul
del /f /q exclude_update.txt >nul 2>nul
rd /s /q temp_update >nul 2>nul

:after_fetch
echo.
echo [INFO] Step 3: Installing dependencies and compiling application...
call npm install
if exist bds-manager.exe (
    echo [INFO] Existing bds-manager.exe detected. Re-bundling executable with new updates...
    call npm run build:exe
) else (
    call npm run build
)

echo.
echo ==========================================================
echo  🎉 Update completed successfully! 
echo  - Your worlds, database accounts, and configurations are intact.
echo  - Start your updated panel using 'start-windows.bat'!
echo ==========================================================
echo.
pause
