# 📱 App Móvil TuHipotecaFacil CRM

## Instalación como PWA (Recomendado)

La forma más rápida de instalar la app en tu teléfono:

### Android:
1. Abre Chrome en tu teléfono
2. Navega a `https://tuhipotecafacil.cl`
3. Toca el menú (⋮) > "Instalar app" o "Agregar a pantalla de inicio"
4. Sigue las instrucciones

### iPhone/iPad:
1. Abre Safari en tu dispositivo
2. Navega a `https://tuhipotecafacil.cl`
3. Toca el botón de compartir (□↑)
4. Selecciona "Agregar a pantalla de inicio"
5. Confirma

## Generar APK (Para desarrollo)

### Requisitos:
- Android Studio instalado
- Java JDK 11+
- Android SDK

### Pasos:
```bash
# 1. Ejecutar el script de construcción
./scripts/build-android.sh

# 2. En Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)

# 3. El APK estará en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Para APK de producción:
```bash
# En Android Studio:
# Build > Generate Signed Bundle / APK
# Seleccionar APK
# Crear o seleccionar keystore
# Seleccionar release
```

## Funcionalidades de la App

- ✅ Dashboard con KPIs en tiempo real
- ✅ Pipeline Kanban con drag & drop
- ✅ Gestión de leads y clientes
- ✅ Documentos y archivos
- ✅ Tareas y recordatorios
- ✅ Notificaciones push
- ✅ Conversaciones integradas
- ✅ Modo offline (básico)
- ✅ Acceso rápido desde pantalla de inicio

## Notificaciones Push

La app solicitará permiso para enviar notificaciones:
- Nuevos leads asignados
- Tareas vencidas
- Documentos pendientes
- Mensajes de clientes
- Recordatorios

## Permisos de la App

- **Internet**: Para sincronizar datos
- **Cámara**: Para escanear documentos (futuro)
- **Almacenamiento**: Para descargar archivos
- **Notificaciones**: Para alertas push

## Soporte

- Email: soporte@tuhipotecafacil.cl
- Teléfono: +56 2 2123 4567
