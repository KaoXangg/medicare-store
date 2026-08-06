@echo off
chcp 65001 >nul
title MediCare Store - Tu dong cai dat
cd /d "%~dp0"

echo.
echo  ========================================
echo   MEDICARE STORE - DANG CAI DAT...
echo  ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-all.ps1"
set ERR=%ERRORLEVEL%

echo.
if %ERR% NEQ 0 (
  echo  [LOI] Co loi trong qua trinh cai dat. Xem thong bao phia tren.
) else (
  echo  [OK] Cai dat hoan tat!
  echo.
  echo  Buoc tiep theo:
  echo    1. Mo VS Code ^> Terminal
  echo    2. cd backend  ^> npm run dev
  echo    3. Terminal moi: cd frontend ^> npm run dev
  echo    4. Mo http://localhost:5173
)
echo.
pause
