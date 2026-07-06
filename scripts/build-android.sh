#!/bin/bash

echo "🚀 Iniciando construcción de la app Android..."

# Limpiar build anterior
echo "📦 Limpiando build anterior..."
rm -rf out android .next

# Build de Next.js
echo "🔨 Construyendo Next.js..."
npm run build

# Agregar plataforma Android
echo "📱 Agregando plataforma Android..."
npx cap add android

# Sincronizar web con Android
echo "🔄 Sincronizando archivos..."
npx cap sync android

# Abrir Android Studio
echo "📂 Abriendo Android Studio..."
npx cap open android

echo "✅ ¡Listo! Android Studio se abrirá para generar el APK"
echo ""
echo "Para generar el APK:"
echo "1. En Android Studio, ve a Build > Build Bundle(s) / APK(s)"
echo "2. Selecciona 'Build APK(s)'"
echo "3. El APK estará en android/app/build/outputs/apk/debug/"
