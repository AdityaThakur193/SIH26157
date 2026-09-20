@echo off
setlocal

set "ROOT_DIR=%~dp0"

start "Ollama Daemon" cmd /k "ollama serve"
start "SAT-SA Backend" cmd /k "cd /d "%ROOT_DIR%backend" && python -m uvicorn main:app --reload --port 8000"
start "SAT-SA Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo SAT-SA backend, frontend, and Ollama daemon are starting in separate windows.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo Ollama:   http://localhost:11434

endlocal