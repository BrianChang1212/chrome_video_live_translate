@echo off
REM Ollama rejects requests from chrome-extension:// by default (HTTP 403 in Gin logs).
REM Close the Ollama app from the system tray first so port 11434 is free.
REM Script content is English-only per project convention.

set "OLLAMA_ORIGINS=chrome-extension://*,*"
echo OLLAMA_ORIGINS=%OLLAMA_ORIGINS%
echo.

where ollama >nul 2>&1
if errorlevel 1 (
  echo ERROR: ollama.exe not in PATH. Install Ollama or add its folder to PATH.
  pause
  exit /b 1
)

echo Starting: ollama serve
echo Press Ctrl+C to stop. Restart the extension capture after Ollama is up.
ollama serve
pause
