@echo off
setlocal
cd /d "%~dp0"

echo Building frontend...
cd frontend
call npm run build
cd ..

echo.
echo WasteWise is available at: http://127.0.0.1:8000
echo Leave this window open while using the website. Press Ctrl+C to stop.
echo.

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
) else (
    python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
)
pause
