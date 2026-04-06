@echo off
rem Start whisper.cpp HTTP server for Video Live Translate (local ASR).
rem Edit WHISPER_DIR, MODEL_PATH, PORT if needed.

set "WHISPER_DIR=d:\Brian\tools\whisper-cpp\bin\Release"
set "MODEL_PATH=d:\Brian\tools\whisper-cpp\models\ggml-base.bin"

cd /d "%WHISPER_DIR%" || exit /b 1
echo Listening on http://127.0.0.1:8080/inference  (Ctrl+C to stop)
whisper-server.exe -m "%MODEL_PATH%" --host 127.0.0.1 --port 8080 --no-gpu
