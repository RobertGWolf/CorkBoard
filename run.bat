@echo off
setlocal

echo ============================================
echo   CorkBoard - Starting...
echo ============================================
echo.

:: Activate conda environment
call conda activate corkboard
if %ERRORLEVEL% neq 0 (
    echo ERROR: Could not activate conda environment "corkboard".
    echo Run install.bat first.
    exit /b 1
)

:: Start backend server
echo Starting backend on http://localhost:8000 ...
cd backend
start "CorkBoard Backend" cmd /k "conda activate corkboard && uvicorn app.main:app --reload"
cd ..

:: Wait for backend to be ready
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

:: Start frontend dev server
echo Starting frontend on http://localhost:5173 ...
cd frontend
start "CorkBoard Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ============================================
echo   CorkBoard is running!
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API docs:  http://localhost:8000/docs
echo.
echo   Close the terminal windows to stop.
echo ============================================

endlocal
