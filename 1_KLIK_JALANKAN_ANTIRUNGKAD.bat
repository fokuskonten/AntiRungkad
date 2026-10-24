@echo off
title AntiRungkad WebGL 3D Game Launcher
cd /d "%~dp0"
echo ===================================================
echo   ? MENJALANKAN ANTIRUNGKAD WEBGL 3D
echo   Terintegrasi Server Master Fokus Konten (Port 8090)
echo   URL: http://localhost:8090/antirungkad
echo ===================================================
echo.
echo Membuka antarmuka game WebGL di browser...
start http://localhost:8090/antirungkad
echo.
echo Menyalakan Vite Dev Server (Port 5174)...
npm run dev
pause
