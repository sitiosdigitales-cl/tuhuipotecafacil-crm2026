# Configuración de Google Calendar y Meet

## Pasos para conectar Google Calendar

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las APIs:
   - Google Calendar API
   - Google Meet API

### 2. Crear credenciales OAuth2

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth client ID**
3. Selecciona **Web application**
4. Agrega URIs de redirección autorizados:
   - `http://localhost:3000`
   - `https://tuhipotecafacil.cl` (producción)
5. Copia el **Client ID**

### 3. Crear API Key

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **API key**
3. Copia la API Key

### 4. Configurar variables de entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
# Google Calendar Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-aqui
NEXT_PUBLIC_GOOGLE_API_KEY=tu-api-key-aqui
```

### 5. Configurar pantalla de consentimiento

1. Ve a **APIs & Services** > **OAuth consent screen**
2. Selecciona **External** (para usuarios externos)
3. Completa la información requerida
4. Agrega los scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
5. Agrega usuarios de prueba si está en modo testing

## Funcionalidades

### Crear eventos con Google Meet

1. Haz clic en "Nuevo Evento" en la agenda
2. Selecciona "Con Google Meet"
3. Completa los datos del evento
4. El enlace de Google Meet se creará automáticamente

### Sincronización con Google Calendar

- Los eventos creados con Google se sincronizan automáticamente
- Puedes ver el link de Google Meet en los detalles del evento
- Los recordatorios se envían por email y popup

### Cuenta de Google del ejecutivo

Cada ejecutivo puede conectar su propia cuenta de Google:
1. Haz clic en "Conectar Google" en la agenda
2. Inicia sesión con tu cuenta de Gmail
3. Los eventos se crearán en tu calendario personal

## Notas importantes

- La integración usa OAuth2 para autenticación segura
- No se almacenan contraseñas de Google
- El token de acceso se guarda localmente en el navegador
- Para producción, configura el dominio autorizado en Google Cloud Console

## Solución de problemas

### Error "redirect_uri_mismatch"
- Verifica que el URI de redirección coincida con tu dominio actual
- Para desarrollo: `http://localhost:3000`

### Error "access_not_configured"
- Verifica que la Google Calendar API esté habilitada
- Verifica que la API Key sea válida

### El botón "Conectar Google" no aparece
- Verifica que las variables de entorno estén configuradas
- Recarga la página después de cambiar `.env`
