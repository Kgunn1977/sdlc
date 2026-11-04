@echo off
title SDLC Office
echo Closing this window closes the office.
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found, so the office cannot start. Install Node.js from nodejs.org, then try again.
  pause
  exit /b 1
)
node "%~dp0office-helper.mjs" %*
if errorlevel 1 pause
