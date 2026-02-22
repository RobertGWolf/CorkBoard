@echo off
setlocal

echo ============================================
echo  CorkBoard - Starting Application
echo ============================================
echo.

:: Check for conda environment
where conda >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: conda is not installed or not in PATH.
    exit /b 1
)

call conda activate corkboard
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate conda environment.
    echo Run install.bat first.
    exit /b 1
)

:: Run database migrations
echo [1/3] Running database migrations...
pushd backend
alembic upgrade head
if %errorlevel% neq 0 (
    echo WARNING: Alembic migration failed. The database may not be up to date.
)
popd

:: Start backend server in background
echo [2/3] Starting backend server on http://localhost:8000 ...
pushd backend
start "CorkBoard Backend" cmd /c "conda activate corkboard && uvicorn app.main:app --reload"
popd

:: Give the backend a moment to start
timeout /t 2 /nobreak >nul

:: Start frontend dev server
echo [3/3] Starting frontend server on http://localhost:5173 ...
pushd frontend
start "CorkBoard Frontend" cmd /c "conda activate corkboard && npm run dev"
popd

echo.
echo ============================================
echo  CorkBoard is running!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000
echo  API docs: http://localhost:8000/docs
echo.
echo  Close the backend and frontend terminal
echo  windows to stop the servers.
echo ============================================
