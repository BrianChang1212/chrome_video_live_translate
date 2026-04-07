@echo off
setlocal EnableExtensions
REM Ollama rejects requests from chrome-extension:// by default (HTTP 403 in Gin logs).
REM Stops any running Ollama on the chosen port, then starts ollama serve with OLLAMA_ORIGINS.
REM Script content is English-only per project convention.
REM
REM Defaults (override with / switches or env: VLT_OLLAMA_PORT, VLT_OLLAMA_ORIGINS, VLT_OLLAMA_HOST).

set "OLLAMA_PORT=11434"
set "OLLAMA_ORIGINS=chrome-extension://*,*"
set "OLLAMA_HOST_BIND=127.0.0.1"
set "NO_PAUSE=0"

if not "%VLT_OLLAMA_PORT%"=="" set "OLLAMA_PORT=%VLT_OLLAMA_PORT%"
if not "%VLT_OLLAMA_ORIGINS%"=="" set "OLLAMA_ORIGINS=%VLT_OLLAMA_ORIGINS%"
if not "%VLT_OLLAMA_HOST_BIND%"=="" set "OLLAMA_HOST_BIND=%VLT_OLLAMA_HOST_BIND%"

:parse
if "%~1"=="" goto parsed
if /i "%~1"=="/?" goto help
if /i "%~1"=="-?" goto help
if /i "%~1"=="/PORT" (
  set "OLLAMA_PORT=%~2"
  shift & shift
  goto parse
)
if /i "%~1"=="/ORIGINS" (
  set "OLLAMA_ORIGINS=%~2"
  shift & shift
  goto parse
)
if /i "%~1"=="/HOST" (
  set "OLLAMA_HOST_BIND=%~2"
  shift & shift
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
set "OLLAMA_HOST=%OLLAMA_HOST_BIND%:%OLLAMA_PORT%"
echo OLLAMA_HOST=%OLLAMA_HOST%
echo OLLAMA_ORIGINS=%OLLAMA_ORIGINS%
echo.

where ollama >nul 2>&1
if errorlevel 1 (
  echo ERROR: ollama.exe not in PATH. Install Ollama or add its folder to PATH.
  if "%NO_PAUSE%"=="0" pause
  exit /b 1
)

echo Stopping any running Ollama ^(frees port %OLLAMA_PORT%^)...
taskkill /IM ollama.exe /F >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; $port=%OLLAMA_PORT%; $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; $pids = $c | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($procId in $pids) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }"

timeout /t 2 /nobreak >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=%OLLAMA_PORT%; exit ( @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).Count )"
if errorlevel 1 (
  echo ERROR: Port %OLLAMA_PORT% is still in use. Stop the other program manually or reboot.
  if "%NO_PAUSE%"=="0" pause
  exit /b 1
)

echo Starting: ollama serve  ^(set extension Ollama URL to http://%OLLAMA_HOST_BIND%:%OLLAMA_PORT%^)
echo Press Ctrl+C to stop. Restart the extension capture after Ollama is up.
ollama serve
if "%NO_PAUSE%"=="0" pause
exit /b 0

:help
echo Usage: %~nx0 [/PORT n] [/ORIGINS value] [/HOST bindaddr] [/NOPAUSE]
echo.
echo   /PORT n        Listen port (default 11434). Extension base URL must match.
echo   /ORIGINS value OLLAMA_ORIGINS, e.g. chrome-extension://*,*
echo   /HOST addr     Bind address without port (default 127.0.0.1). Full listen is HOST:PORT.
echo   /NOPAUSE       Do not pause at exit.
echo.
echo Env overrides: VLT_OLLAMA_PORT, VLT_OLLAMA_ORIGINS, VLT_OLLAMA_HOST_BIND.
echo.
echo Example:
echo   %~nx0 /PORT 11435 /ORIGINS "chrome-extension://*,*"
exit /b 1
