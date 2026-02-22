@echo off
setlocal

echo ============================================
echo  CorkBoard - Installation
echo ============================================
echo.

:: Check for conda
where conda >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: conda is not installed or not in PATH.
    echo Please install Miniconda or Anaconda first.
    exit /b 1
)

:: Create conda environment with Python 3.11 and Node.js
echo [1/4] Creating conda environment "corkboard"...
call conda create -n corkboard python=3.11 nodejs=20 -y
if %errorlevel% neq 0 (
    echo ERROR: Failed to create conda environment.
    exit /b 1
)

:: Activate the environment
echo [2/4] Activating environment...
call conda activate corkboard
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate conda environment.
    exit /b 1
)

:: Install backend dependencies
echo [3/4] Installing backend dependencies...
pushd backend
pip install -e ".[dev]"
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies.
    popd
    exit /b 1
)
popd

:: Install frontend dependencies
echo [4/4] Installing frontend dependencies...
pushd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies.
    popd
    exit /b 1
)
popd

echo.
echo ============================================
echo  Installation complete!
echo  Run "run.bat" to start CorkBoard.
echo ============================================
