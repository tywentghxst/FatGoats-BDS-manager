@echo off
setlocal

echo ===================================================
echo   Minecraft Bedrock Server - Auto Addons Installer
echo ===================================================
echo.

:: Define paths relative to the script location
set "SCRIPT_DIR=%~dp0"
set "IMPORT_DIR=%SCRIPT_DIR%auto_install_addons"

:: Ensure import directory exists
if not exist "%IMPORT_DIR%" (
    mkdir "%IMPORT_DIR%"
    echo Created folder: "auto_install_addons"
    echo Please drop your .mcpack, .mcaddon or .zip files in "auto_install_addons" and run this script again.
    pause
    exit /b
)

:: Run node script
node "%SCRIPT_DIR%install_addons.js"

echo.
pause
