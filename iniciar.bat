@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 22.12 ou superior para abrir o Lumi.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  echo Antes de iniciar, execute: npm ci
  echo Depois, execute: npm run build
  pause
  exit /b 1
)
echo Abra http://127.0.0.1:5173/ no navegador.
echo Mantenha esta janela aberta enquanto estiver usando o Lumi.
node scripts\serve.mjs
pause
