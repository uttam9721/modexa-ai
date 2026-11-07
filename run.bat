@echo off
echo ==============================================
echo       Starting Gemini Studio Fullstack App
echo ==============================================
echo.
echo Starting backend server on port 5000...
cd /d "%~dp0server"
start http://localhost:5000
node server.js
pause

