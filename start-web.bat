@echo off
title OpenJuliet Web Server
echo.
echo   ========================================
echo     OpenJuliet - Web Server
echo   ========================================
echo.
echo   Starting server on port 2324...
echo   Open http://localhost:2324 in your browser
echo.

:: Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo   [ERROR] Node.js is not installed!
    echo   Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check if port 2324 is in use
netstat -ano | findstr :2324 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo   [WARNING] Port 2324 is already in use.
    echo   Close the other application or change the port.
)

:: Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Check if the build exists
if not exist "out\renderer\index.html" (
    echo   [INFO] Building application...
    call npx electron-vite build
    if %ERRORLEVEL% neq 0 (
        echo   [ERROR] Build failed!
        pause
        exit /b 1
    )
)

:: Inject API bridge into the built HTML
if exist "public\api-bridge.js" (
    copy /Y "public\api-bridge.js" "out\renderer\api-bridge.js" >nul
    echo   [INFO] API bridge injected
)

:: Check if ws module is installed
if not exist "node_modules\ws" (
    echo   [INFO] Installing WebSocket dependency...
    call npm install ws --save --legacy-peer-deps >nul 2>nul
)

echo.
echo   ========================================
echo     Server starting at http://localhost:2324
echo   ========================================
echo.
echo   Press Ctrl+C in this window to stop the server.
echo.

:: Start the server
node server.js

pause
