@echo off
ECHO Starting servers...

REM Start the backend server
ECHO Starting backend server...
start "Backend" cmd /k "python -m uvicorn backend.main:app --reload"

REM Start the frontend server
ECHO Starting frontend server...
start "Frontend" cmd /k "cd frontend && npm run dev"

ECHO Both servers are starting in separate windows.