@echo off
chcp 65001 >nul 2>&1
title Urbain Mobility — Wi-Fi Secure Launcher
color 0B

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║                                                          ║
echo  ║   🚀  URBAIN MOBILITY — Lanceur Sécurisé Wi-Fi  🚀     ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo  ✅ Droits administrateur détectés
) else (
    echo  ⚠️  Pas de droits admin — le hotspot ne pourra pas être créé automatiquement
    echo     Le serveur de vérification Wi-Fi fonctionnera quand même.
)
echo.

:: Step 1: Create Wi-Fi hotspot
echo  [1/3] 📡 Création du hotspot Wi-Fi...
echo  ─────────────────────────────────────
cd /d "%~dp0"
python wifi-secure\create_wifi.py 2>nul
if %errorlevel% neq 0 (
    echo  ⚠️  Python non trouvé ou erreur — continuez avec le hotspot manuel
)
echo.

:: Step 2: Start Vite dev server in background
echo  [2/3] ⚡ Démarrage du serveur Vite...
echo  ─────────────────────────────────────
start /min "Vite Dev Server" cmd /c "cd /d "%~dp0" && npm run dev"
timeout /t 3 /nobreak >nul
echo  ✅ Vite lancé en arrière-plan (port 5173)
echo.

:: Step 3: Start Wi-Fi gateway server
echo  [3/3] 🛡️  Démarrage du serveur Wi-Fi Gateway...
echo  ─────────────────────────────────────
echo.
echo  ════════════════════════════════════════
echo   Ouvrez votre navigateur sur :
echo   http://localhost:3333
echo  ════════════════════════════════════════
echo.
node wifi-secure\wifi_server.cjs

pause
