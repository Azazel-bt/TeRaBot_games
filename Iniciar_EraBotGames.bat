@echo off
setlocal EnableExtensions
title EraBotGames - Suite Offline (CEMOS / ERA)
cd /d "%~dp0"

echo.
echo  ==============================================================
echo     EraBotGames - Vision Artificial 100%% Offline
echo     Programa hecho por: Carlos Stiven Roa
echo     Grupo: CEMOS  ^|  Semillero: ERA
echo  ==============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] No se detecto Node.js instalado en este equipo.
    echo Instala Node.js LTS una sola vez para ejecutar el servidor local sin internet.
    echo.
    pause
    exit /b 1
)

if not exist "dist\index.html" (
    echo [INFO] Compilando EraBotGames para modo offline...
    if not exist "node_modules" (
        echo [INFO] Instalando dependencias locales...
        call npm install
        if errorlevel 1 (
            echo [ERROR] No se pudieron instalar las dependencias.
            pause
            exit /b 1
        )
    )
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Fallo la compilacion de EraBotGames.
        pause
        exit /b 1
    )
)

echo [OK] Iniciando servidor local offline y abriendo el navegador...
echo.
node scripts\serve-offline.mjs --open
if errorlevel 1 (
    echo.
    echo [ERROR] El servidor local se detuvo inesperadamente.
    pause
)
endlocal
