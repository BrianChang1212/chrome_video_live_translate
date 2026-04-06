@echo off
REM Wrapper: run PowerShell smoke test (same as extension: Ollama /api/chat, think=false).
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ollama_translate_smoke_test.ps1" %*
exit /b %ERRORLEVEL%
