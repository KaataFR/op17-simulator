@echo off
cd /d "%~dp0"
echo OP17 Simulator V10 - http://localhost:8000
start "" http://localhost:8000/index.html
python -m http.server 8000
pause
