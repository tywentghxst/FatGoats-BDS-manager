@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Minecraft Bedrock Server - Auto World Importer
echo ===================================================
echo.

:: Define paths relative to the script location
set "SCRIPT_DIR=%~dp0"
set "IMPORT_DIR=%SCRIPT_DIR%auto_import_worlds"
set "WORLDS_DIR=%SCRIPT_DIR%bedrock-server\worlds"
set "PROPERTIES_FILE=%SCRIPT_DIR%bedrock-server\server.properties"
set "DB_FILE=%SCRIPT_DIR%bedrock-server\manager_db.json"

:: Ensure import directory exists
if not exist "%IMPORT_DIR%" (
    mkdir "%IMPORT_DIR%"
    echo Created folder: "auto_import_worlds"
    echo Please drop your .mcworld files in "auto_import_worlds" and run this script again.
    pause
    exit /b
)

:: Create imported directory inside auto_import_worlds to archive finished imports
if not exist "%IMPORT_DIR%\imported" (
    mkdir "%IMPORT_DIR%\imported"
)

:: Check if there are any .mcworld files to import
set "FOUND_FILES=0"
for %%F in ("%IMPORT_DIR%\*.mcworld") do (
    set /a FOUND_FILES+=1
)

if %FOUND_FILES% equ 0 (
    echo No .mcworld files found in "auto_import_worlds".
    echo Drop your files there and double-click this script!
    echo.
    pause
    exit /b
)

echo Found %FOUND_FILES% world(s) to import.
echo.

:: Loop through each .mcworld file
for %%F in ("%IMPORT_DIR%\*.mcworld") do (
    set "FULL_PATH=%%~fF"
    set "FILE_NAME=%%~nxF"
    set "WORLD_NAME=%%~nF"
    
    :: Clean world name to match clean folder naming conventions
    set "CLEAN_NAME=!WORLD_NAME!"
    set "CLEAN_NAME=!CLEAN_NAME: =_!"
    set "CLEAN_NAME=!CLEAN_NAME:(=_!"
    set "CLEAN_NAME=!CLEAN_NAME:)=_!"
    set "CLEAN_NAME=!CLEAN_NAME:[=_!"
    set "CLEAN_NAME=!CLEAN_NAME:]=_!"
    
    echo Processing file: "!FILE_NAME!" --^> Target World: "!CLEAN_NAME!"
    
    set "DEST_DIR=%WORLDS_DIR%\!CLEAN_NAME!"
    
    :: Create destination directory
    if not exist "!DEST_DIR!" (
        mkdir "!DEST_DIR!"
    ) else (
        echo Warning: Target folder "!CLEAN_NAME!" already exists. Overwriting...
    )
    
    :: Perform PowerShell extraction of the .mcworld structure (which is a ZIP)
    echo Extracting archive contents...
    powershell -NoProfile -Command "try { Add-Type -AssemblyName 'System.IO.Compression.FileSystem'; [System.IO.Compression.ZipFile]::ExtractToDirectory('!FULL_PATH!', '!DEST_DIR!', $true); Write-Host 'Extraction completed successfully.' } catch { Write-Error $_.Exception.Message; exit 1 }"
    
    if %ERRORLEVEL% equ 0 (
        echo World folder extracted to: "!DEST_DIR!"
        
        :: Update server.properties level-name
        if exist "%PROPERTIES_FILE%" (
            echo Updating server.properties level-name...
            powershell -NoProfile -Command ^
                "$content = Get-Content '%PROPERTIES_FILE%' -Raw;" ^
                "$content = $content -replace 'level-name=.*', 'level-name=!CLEAN_NAME!';" ^
                "Set-Content '%PROPERTIES_FILE%' $content -NoNewline"
        )
        
        :: Update manager_db.json appConfig levelName
        if exist "%DB_FILE%" (
            echo Updating manager_db.json configuration...
            powershell -NoProfile -Command ^
                "$content = Get-Content '%DB_FILE%' -Raw | ConvertFrom-Json;" ^
                "$content.appConfig.levelName = '!CLEAN_NAME!';" ^
                "$content | ConvertTo-Json -Depth 10 | Set-Content '%DB_FILE%'"
        )
        
        :: Move the imported .mcworld to archiving directory
        echo Archiving original .mcworld file...
        move /y "!FULL_PATH!" "%IMPORT_DIR%\imported\!FILE_NAME!" >nul
        
        echo Success: "!CLEAN_NAME!" is now active!
        echo ---------------------------------------------------
    ) else (
        echo Error: Failed to extract !FILE_NAME!. skipping...
        echo ---------------------------------------------------
    )
)

echo.
echo All imports completed!
echo If your server is running, please restart it to load the newly imported world.
echo.
pause
