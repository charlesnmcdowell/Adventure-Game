@echo off
setlocal
cd /d "%~dp0"
title Adventurer
echo Starting Adventurer locally...
echo Artwork needs a local web address, not a double-clicked index.html.
echo.

where node >nul 2>&1
if %errorlevel%==0 (
  node play_local.js
  if errorlevel 1 goto fail
  goto done
)

where py >nul 2>&1
if %errorlevel%==0 (
  echo Opening http://127.0.0.1:8734/index.html
  echo Leave this window open while you play. Close it to stop.
  start "" cmd /c "timeout /t 1 /nobreak >nul && start http://127.0.0.1:8734/index.html"
  py -m http.server 8734 --bind 127.0.0.1
  goto done
)

where python >nul 2>&1
if %errorlevel%==0 (
  echo Opening http://127.0.0.1:8734/index.html
  echo Leave this window open while you play. Close it to stop.
  start "" cmd /c "timeout /t 1 /nobreak >nul && start http://127.0.0.1:8734/index.html"
  python -m http.server 8734 --bind 127.0.0.1
  goto done
)

echo Adventurer needs Node.js or Python installed to run locally.
echo Install one of those, then double-click this file again.
echo.
pause
goto done

:fail
echo.
pause
:done
