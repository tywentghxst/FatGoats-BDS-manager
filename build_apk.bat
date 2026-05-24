@echo off
:: Production-grade Android APK Compilation Tool for BDS Manager Mobile
:: Created to wrap and bundle the modern React frontend as a hybrid mobile webview app.

title BDS Manager Android APK Builder
cls
echo =====================================================================
echo                BDS Dedicated Server Manager APK BUILDER              
echo =====================================================================
echo.
echo  This batch script packages your current front-end, initializes a
echo  Capacitor native Android wrapper, and prepares it for APK compilation.
echo.
echo  PREREQUISITES:
echo   - Node.js & npm installed (Active)
echo   - Java JDK 17+ installed 
echo   - Android Studio / Android SDK installed (SDK Manager configured)
echo.
echo =====================================================================

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js was not detected in your PATH. Please install Node.js!
    pause
    exit /b
)

echo [STEP 1/5] Compiling and bundling production React assets...
echo.
call npm run build
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] React / Vite build failed. Cannot bundle APK without compiled assets.
    pause
    exit /b
)
echo.
echo [SUCCESS] Frontend compilation completed! (Assets compiled in /dist)
echo.

echo [STEP 2/5] Inspecting Capacitor dependencies...

:: Ensure @capacitor/core and @capacitor/cli are in dependencies or installed
if not exist node_modules\@capacitor\core (
    echo Installing Capacitor core library...
    call npm install @capacitor/core --save
)
if not exist node_modules\@capacitor\cli (
    echo Installing Capacitor CLI development binary...
    call npm install -D @capacitor/cli
)
if not exist node_modules\@capacitor\android (
    echo Installing Capacitor Android platform adapter...
    call npm install @capacitor/android --save
)

echo.
echo [STEP 3/5] Inspecting Capacitor project configuration...

:: Generate capacitor.config.json if not present
if not exist capacitor.config.json (
    echo Initializing capacitor.config.json...
    (
        echo {
        echo   "appId": "com.bdsmanager.app",
        echo   "appName": "BDS Manager",
        echo   "webDir": "dist",
        echo   "server": {
        echo     "androidScheme": "https",
        echo     "cleartext": true
        echo   }
        echo }
    ) > capacitor.config.json
    echo [SUCCESS] Created default capacitor.config.json template!
) else (
    echo [INFO] capacitor.config.json already exists. Skipping initialization.
)

:: Check if android directory exists, if not initialize it
if not exist android (
    echo Initializing Android Capacitor Workspace...
    npx cap init "BDS Manager" "com.bdsmanager.app" --web-dir=dist
    echo Creating native Android workspace folder...
    npx cap add android
) else (
    echo [INFO] android folder already exists. Skipping platform scaffold.
)

echo.
echo [STEP 4/5] Synchronizing and copying assets to the Android container...
npx cap sync android
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Capacitor sync failed. Please check your asset directories.
    pause
    exit /b
)

echo.
echo [STEP 5/5] Compiling Android Gradle release APK...
echo.
echo Attempting to run local gradlew build command...
if exist android\gradlew.bat (
    cd android
    call gradlew.bat assembleDebug
    if %errorlevel% equ 0 (
        color 0a
        echo.
        echo =====================================================================
        echo               COMPILATION SUCCESSFUL! APK GENERATED                   
        echo =====================================================================
        echo.
        echo  Your debug APK has been compiled successfully. Find it here:
        echo  android\app\build\outputs\apk\debug\app-debug.apk
        echo.
        echo =====================================================================
        cd ..
        pause
        exit /b
    ) else (
        echo [WARNING] Gradle compilation failed or Android SDK was not linked correctly on this host.
        echo We have prepared the Android project files for you anyway!
        cd ..
    )
) else (
    echo [WARNING] Native gradlew wrapper was not found in the android folder.
)

echo.
echo =====================================================================
echo            NATIVE WORKSPACE SYNCED & PREPARED FOR ANDROID            
echo =====================================================================
echo.
echo  You can manually compile or customize the APK by loading this folder:
echo  -  "%CD%\android"
echo.
echo  Steps to build/run inside Android Studio:
echo  1. Open Android Studio
echo  2. Select "Open an existing project" and choose: "%CD%\android"
echo  3. Let Gradle sync and select "Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo  4. Transfer generated APK onto your phone and enjoy!
echo.
echo  Alternatively, you can run: npx cap open android
echo.
echo =====================================================================
pause
