@echo off
REM Optional integration tests (whisper-server + Ollama). Requires Node 18+.
REM Start whisper-server and ollama serve first for full coverage; otherwise tests skip per service.

set VLT_INTEGRATION=1
cd /d "%~dp0.."
node --test tests\integration\live_services.test.mjs
exit /b %ERRORLEVEL%
