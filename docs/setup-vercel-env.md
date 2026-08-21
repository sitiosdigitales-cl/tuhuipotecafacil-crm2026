# Setup: Variables de Entorno en Vercel

## Resumen de Variables Necesarias

| Variable | Estado | Descripción |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Configurada | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configurada | Key anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Pendiente | Key de service role (para backups) |
| `JWT_SECRET` | ✅ Configurada | Secreto para JWT |
| `RESEND_API_KEY` | ⚠️ Pendiente | API key de Resend (emails) |
| `FROM_EMAIL` | ✅ Configurada | Email remitente |
| `BACKUP_API_KEY` | ✅ Configurada | Key para API de backups |
| `CRON_SECRET` | ⚠️ Pendiente | Firma automática de Vercel Cron |
| `ELEMENTOR_WEBHOOK_SECRET` | ⚠️ Pendiente | Secret para webhooks |
| `WHATSAPP_PHONE_NUMBER_ID` | ⚠️ Pendiente | ID del número de teléfono en Meta |
| `WHATSAPP_ACCESS_TOKEN` | ⚠️ Pendiente | Token de acceso de WhatsApp Business |
| `WHATSAPP_VERIFY_TOKEN` | ⚠️ Pendiente | Token para verificar webhook |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ⚠️ Pendiente | ID de la cuenta de WhatsApp Business |

> **Rotación requerida:** versiones anteriores de esta guía y del script manual
> incluyeron valores concretos para `JWT_SECRET` y `BACKUP_API_KEY`. Como Git
> conserva historial, esos valores no deben seguir usándose. Genera valores
> nuevos en Vercel antes del próximo despliegue y elimina los anteriores.

---

## Paso 1: Acceder a Vercel

1. Ve a https://vercel.com/dashboard
2. Selecciona el proyecto: **tuhuipotecafacil-crm**
3. Ve a **Settings** → **Environment Variables**

---

## Paso 2: Variables Pendientes

### 2.1 SUPABASE_SERVICE_ROLE_KEY

Esta key permite al CRM acceder a Supabase sin restricciones de RLS (necesario para backups y webhooks).

1. Ve a https://supabase.com/dashboard
2. Selecciona el proyecto
3. Ve a **Settings** → **API**
4. Copia la **service_role key** (empieza con `eyJ...`)
5. En Vercel, agrega:
   - **Nombre**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Valor**: `eyJ...` (la key completa)
   - **Environment**: Production, Preview, Development

### 2.2 RESEND_API_KEY

Resend es el servicio que usa el CRM para enviar emails (bienvenida, documentos pendientes, etc.).

1. Ve a https://resend.com
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** → **Create API Key**
4. Copia la key (empieza con `re_`)
5. En Vercel, agrega:
   - **Nombre**: `RESEND_API_KEY`
   - **Valor**: `re_xxxxxxxxxxxxxxxx`
   - **Environment**: Production, Preview, Development

**Nota**: Si no tienes cuenta en Resend, puedes crear una gratis. El plan gratuito incluye 100 emails/día.

### 2.3 ELEMENTOR_WEBHOOK_SECRET

Este secreto protege el webhook que recibe leads desde formularios Elementor.

1. Genera un secreto aleatorio de 32 bytes y guárdalo en el gestor de secretos:
   ```
   openssl rand -hex 32
   ```

2. En Vercel, agrega:
   - **Nombre**: `ELEMENTOR_WEBHOOK_SECRET`
   - **Valor**: el resultado completo del comando anterior
   - **Environment**: Production, Preview, Development

3. Instala `crm-webhook-plugin.php` en WordPress y agrega en `wp-config.php`,
   antes de la línea de cierre, la URL canónica y el mismo valor:
   ```
   define('CRM_WEBHOOK_URL', 'https://TU-DOMINIO-CANONICO/api/webhook/leads');
   define('CRM_WEBHOOK_SECRET', 'PEGA_AQUI_EL_SECRETO_GENERADO');
   ```

La URL debe usar HTTPS, no llevar query ni fragmento y terminar exactamente en
`/api/webhook/leads`. No pongas el secreto en la URL, Elementor ni JavaScript.
El plugin lo envía desde el servidor en la cabecera `X-Webhook-Secret`.

### 2.4 JWT_SECRET, BACKUP_API_KEY y CRON_SECRET

Genera un valor distinto para cada variable; nunca reutilices uno entre
autenticación, respaldos y webhooks:

```bash
openssl rand -hex 32
```

`CRON_SECRET` debe tener al menos 16 caracteres; usa también 32 bytes aleatorios
para mantener una política uniforme. Vercel lo envía automáticamente como
`Authorization: Bearer ...` al ejecutar `/api/backup/cron`.

Guarda cada resultado directamente en Vercel. La documentación, los scripts,
los mensajes y el repositorio solo deben mencionar el nombre de la variable,
nunca su valor.

---

## Paso 3: Variables Adicionales (Opcionales)

### 3.1 GOOGLE_CALENDAR (opcional)

Si quieres integrar Google Calendar:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id
NEXT_PUBLIC_GOOGLE_API_KEY=tu-api-key
```

### 3.2 WHATSAPP (futuro)

Cuando se implemente WhatsApp Business API:

```
WHATSAPP_API_KEY=tu-api-key
WHATSAPP_PHONE_NUMBER_ID=tu-phone-id
```

---

## Paso 4: Verificar Variables

En Vercel → **Settings** → **Environment Variables**, deberías ver:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ `https://dcoyjvbhrkarrmetrhiv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ `eyJ...` |
| `JWT_SECRET` | ✅ Configurado sin mostrar el valor |
| `RESEND_API_KEY` | ✅ `re_...` |
| `FROM_EMAIL` | ✅ `CRM <notificaciones@tuhipotecafacil.cl>` |
| `BACKUP_API_KEY` | ✅ Configurado sin mostrar el valor |
| `CRON_SECRET` | ✅ Configurado sin mostrar el valor |
| `ELEMENTOR_WEBHOOK_SECRET` | ✅ Configurado sin mostrar el valor |

---

## Paso 5: Redesplegar

Después de agregar las variables, necesitas redesplegar el proyecto:

1. En Vercel → **Deployments**
2. Haz clic en el último deployment
3. Haz clic en **Redeploy**
4. Selecciona **Redeploy** (no "Redeploy with existing Build Cache")

---

## Paso 6: Verificar que Funciona

### Probar Resend (emails)

1. Ve al CRM → **Dashboard**
2. Crea un lead nuevo
3. Verifica que se envíe un email de bienvenida

### Probar Webhook

```bash
curl -X POST "https://tuhuipotecafacil-crm.vercel.app/api/webhook/leads" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $ELEMENTOR_WEBHOOK_SECRET" \
  -d '{
    "nombre": "Test",
    "apellido": "Webhook",
    "email": "test@ejemplo.com",
    "telefono": "+56912345678"
  }'
```

### Probar Backups

```bash
curl -X POST "https://tuhuipotecafacil-crm.vercel.app/api/backup" \
  -H "Authorization: Bearer $BACKUP_API_KEY"
```

Desde el panel, una sesión `ADMIN` o `SUPER_ADMIN` también puede crear y
eliminar exportaciones. Verifica además en Vercel → Cron Jobs que
`/api/backup/cron` tenga ejecuciones exitosas.

---

## Troubleshooting

### Los emails no se envían

1. Verifica que `RESEND_API_KEY` esté configurada
2. Verifica que el dominio esté verificado en Resend
3. Revisa los logs en Vercel → **Logs**

### El webhook no crea leads

1. Verifica que `ELEMENTOR_WEBHOOK_SECRET` coincida
2. Verifica que el URL sea correcto
3. Revisa los logs en Vercel → **Logs**

### Los backups fallan

1. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
2. Verifica que `BACKUP_API_KEY` y `CRON_SECRET` sean valores distintos
3. Verifica que el bucket `backups` exista en Supabase
4. Revisa los logs de la ruta `/api/backup/cron` en Vercel

---

## Checklist Final

- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada en Vercel
- [ ] `JWT_SECRET`, `BACKUP_API_KEY` y `CRON_SECRET` configuradas con valores distintos
- [ ] `RESEND_API_KEY` configurada en Vercel
- [ ] `ELEMENTOR_WEBHOOK_SECRET` configurada en Vercel
- [ ] Dominio verificado en Resend
- [ ] Proyecto redesplegado en Vercel
- [ ] Prueba de email exitosa
- [ ] Prueba de webhook exitosa
- [ ] Prueba de backup exitosa
