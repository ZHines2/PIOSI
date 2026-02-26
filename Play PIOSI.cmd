@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run this launcher.
  echo Install Node.js from https://nodejs.org and try again.
  pause
  exit /b 1
)

set "PORT=8080"
start "" "http://localhost:%PORT%/"
node tools\serve.js %PORT%
