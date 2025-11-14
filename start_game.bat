@echo off
echo ========================================
echo   Stock Management Game - Launcher
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv\" (
    echo [ERROR] Virtual environment not found!
    echo Please run: python -m venv .venv
    echo Then run: .\.venv\Scripts\activate
    echo Then run: pip install -r requirements.txt
    pause
    exit /b 1
)

echo [1/3] Activating virtual environment...
call .venv\Scripts\activate.bat

echo [2/3] Starting Flask backend server...
echo.
echo Backend will run on: http://127.0.0.1:5000
echo Keep this window open while playing!
echo.

REM Start Flask in background
start /B python backend\app.py

REM Wait for server to start
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo [3/3] Opening game in browser...
start frontend\game.html

echo.
echo ========================================
echo   Game is now running!
echo ========================================
echo.
echo - Game URL: file:///frontend/game.html
echo - API URL: http://127.0.0.1:5000
echo.
echo Press Ctrl+C to stop the server
echo or simply close this window.
echo ========================================
echo.

REM Keep the window open and show server logs
python backend\app.py
