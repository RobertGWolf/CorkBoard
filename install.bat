@echo off
setlocal

echo ============================================
echo   CorkBoard - Installation
echo ============================================
echo.

:: Check for conda
where conda >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: conda not found. Please install Miniconda or Anaconda first.
    echo https://docs.conda.io/en/latest/miniconda.html
    exit /b 1
)

:: Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+ first.
    echo https://nodejs.org/
    exit /b 1
)

:: Create conda environment
echo [1/4] Creating conda environment "corkboard" (Python 3.11)...
conda create -n corkboard python=3.11 -y
if %ERRORLEVEL% neq 0 (
    echo WARNING: Environment may already exist. Continuing...
)

:: Install backend dependencies
echo.
echo [2/4] Installing backend dependencies...
call conda activate corkboard
cd backend
pip install -e ".[dev]"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install backend dependencies.
    exit /b 1
)

:: Run database migrations
echo.
echo [3/4] Running database migrations...
alembic upgrade head
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to run database migrations.
    exit /b 1
)
cd ..

:: Install frontend dependencies
echo.
echo [4/4] Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install frontend dependencies.
    exit /b 1
)
cd ..

echo.
echo ============================================
echo   Installation complete!
echo   Run "run.bat" to start CorkBoard.
echo ============================================

endlocal
