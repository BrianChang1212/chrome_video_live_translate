@echo off
setlocal EnableExtensions
REM Start whisper.cpp HTTP server for Video Live Translate (local ASR).
REM Script content is English-only per project convention.
REM
REM Defaults (override with / switches or pre-set env: VLT_WHISPER_PORT, VLT_WHISPER_MODEL, VLT_WHISPER_DIR, VLT_WHISPER_HOST).
REM Command-line arguments take precedence over env vars.

set "WHISPER_DIR=d:\Brian\tools\whisper-cpp\build\bin\Release"
set "MODEL_PATH=d:\Brian\tools\whisper-cpp\models\ggml-base.bin"
set "PORT=8081"
set "HOST=127.0.0.1"
set "USE_NO_GPU=1"
set "NO_PAUSE=0"

if not "%VLT_WHISPER_DIR%"=="" set "WHISPER_DIR=%VLT_WHISPER_DIR%"
if not "%VLT_WHISPER_MODEL%"=="" set "MODEL_PATH=%VLT_WHISPER_MODEL%"
if not "%VLT_WHISPER_PORT%"=="" set "PORT=%VLT_WHISPER_PORT%"
if not "%VLT_WHISPER_HOST%"=="" set "HOST=%VLT_WHISPER_HOST%"
if /i "%VLT_WHISPER_GPU%"=="1" set "USE_NO_GPU=0"

:parse
if "%~1"=="" goto parsed
if /i "%~1"=="/?" goto help
if /i "%~1"=="-?" goto help
if /i "%~1"=="/PORT" (
  set "PORT=%~2"
  shift & shift
  goto parse
)
if /i "%~1"=="/MODEL" (
  set "MODEL_PATH=%~2"
  shift & shift
  goto parse
)
if /i "%~1"=="/DIR" (
  set "WHISPER_DIR=%~2"
  shift & shift
  goto parse
)
if /i "%~1"=="/HOST" (
  set "HOST=%~2"
  shift & shift
  goto parse
)
if /i "%~1"=="/GPU" (
  set "USE_NO_GPU=0"
  shift
  goto parse
)
if /i "%~1"=="/NOPAUSE" (
  set "NO_PAUSE=1"
  shift
  goto parse
)
echo ERROR: Unknown argument: %~1
goto help

:parsed
cd /d "%WHISPER_DIR%" 2>nul
if errorlevel 1 (
  echo ERROR: WHISPER_DIR not found: %WHISPER_DIR%
  if "%NO_PAUSE%"=="0" pause
  exit /b 1
)
if not exist "%MODEL_PATH%" (
  echo ERROR: MODEL file not found: %MODEL_PATH%
  if "%NO_PAUSE%"=="0" pause
  exit /b 1
)

echo WHISPER_DIR=%WHISPER_DIR%
echo MODEL_PATH=%MODEL_PATH%
echo HOST=%HOST%  PORT=%PORT%  GPU=%USE_NO_GPU% ^(0=allow GPU, 1=--no-gpu^)
echo Listening on http://%HOST%:%PORT%/inference  (Ctrl+C to stop)
echo Extension Options: whisper base URL = http://%HOST%:%PORT%
echo.

if "%USE_NO_GPU%"=="1" (
  whisper-server.exe -m "%MODEL_PATH%" --host "%HOST%" --port %PORT% --no-gpu
) else (
  whisper-server.exe -m "%MODEL_PATH%" --host "%HOST%" --port %PORT%
)
if "%NO_PAUSE%"=="0" pause
exit /b 0

:help
echo Usage: %~nx0 [/PORT n] [/MODEL path] [/DIR path] [/HOST host] [/GPU] [/NOPAUSE]
echo.
echo   /PORT n      Listen port (default 8081).
echo   /MODEL path  ggml model .bin file.
echo   /DIR path    Folder containing whisper-server.exe.
echo   /HOST host   Bind address (default 127.0.0.1).
echo   /GPU         Omit --no-gpu (try GPU if build supports it).
echo   /NOPAUSE     Do not pause at exit.
echo.
echo Env overrides (used if not set by / switches^): VLT_WHISPER_PORT, VLT_WHISPER_MODEL,
echo   VLT_WHISPER_DIR, VLT_WHISPER_HOST, VLT_WHISPER_GPU=1 for /GPU.
echo.
echo Example:
echo   %~nx0 /PORT 18080 /MODEL "D:\models\ggml-small.bin"
exit /b 1
