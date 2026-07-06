@echo off
echo 🚀 Iniciando construcción de la app Android...

REM Limpiar build anterior
echo 📦 Limpiando build anterior...
if exist out rmdir /s /q out
if exist android rmdir /s /q android
if exist .next rmdir /s /q .next

REM Build de Next.js
echo 🔨 Construyendo Next.js...
call npm run build

REM Agregar plataforma Android
echo 📱 Agregando plataforma Android...
call npx cap add android

REM Sincronizar web con Android
echo 🔄 Sincronizando archivos...
call npx cap sync android

REM Abrir Android Studio
echo 📂 Abriendo Android Studio...
call npx cap open android

echo.
echo ✅ ¡Listo! Android Studio se abrirá para generar el APK
echo.
echo Para generar el APK:
echo 1. En Android Studio, ve a Build ^> Build Bundle(s) / APK(s)
echo 2. Selecciona 'Build APK(s)'
echo 3. El APK estará en android\app\build\outputs\apk\debug\

pause
