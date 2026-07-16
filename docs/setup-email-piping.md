# Setup: Email Piping para TuHipotecaFacil CRM

## ¿Qué es Email Piping?

Email piping es cuando un email enviado a `contacto@tuhipotecafacil.cl` se reenvía automáticamente al CRM y se crea un lead.

## Archivos incluidos

| Archivo | Descripción |
|---------|-------------|
| `crm/email-handler.php` | Script principal que procesa emails |
| `crm/test-email-webhook.sh` | Script de prueba para el webhook |
| `src/app/api/webhook/email/route.ts` | Endpoint en el CRM |

---

## OPCIÓN 1: cPanel Email Forwarder (Recomendada)

### Paso 1: Subir el script PHP al hosting

1. Accede a tu hosting (cPanel o similar)
2. Ve a **File Manager** → `public_html`
3. Crea una carpeta: `crm`
4. Sube `email-handler.php` a `/home/tu_usuario/public_html/crm/email-handler.php`

### Paso 2: Configurar permisos

En cPanel → **File Manager** → click derecho en `email-handler.php` → **Change Permissions**:
- Owner: Read, Write, Execute (755)
- Group: Read, Execute (555)
- Public: Read, Execute (555)

### Paso 3: Configurar Email Forwarder

1. En cPanel → **Email** → **Forwarders**
2. Haz clic en **Add Forwarder**
3. Configura:
   - **Address to Forward**: `contacto`
   - **Domain**: `tuhipotecafacil.cl`
   - **Forward to**: Selecciona **"Pipe to a program"**
   - **Program**: `/home/tu_usuario/public_html/crm/email-handler.php`
4. Haz clic en **Add Forwarder**

### Paso 4: Probar

Envía un email a `contacto@tuhipotecafacil.cl` y verifica que aparezca en el CRM.

---

## OPCIÓN 2: SendGrid Inbound Parse

### Paso 1: Crear cuenta en SendGrid

1. Ve a https://sendgrid.com y crea una cuenta
2. En **Settings** → **API Keys** → Create API Key

### Paso 2: Configurar Inbound Parse

1. En SendGrid → **Settings** → **Inbound Parse**
2. Haz clic en **Add Host & URL**
3. Configura:
   - **Hostname**: `tuhipotecafacil.cl`
   - **URL**: `https://tuhuipotecafacil-crm.vercel.app/api/webhook/email`
   - **Spam Check**: No
   - **Send Raw**: Yes (para emails completos)
4. Haz clic en **Save**

### Paso 3: Configurar DNS (MX Record)

En tu proveedor de DNS (Nic.cl o similar), agrega:

```
Tipo: MX
Nombre: @
Valor: mx1.sendgrid.net
Prioridad: 10
```

**Nota**: Si ya tienes un MX record para tu correo corporativo, necesitarás agregar SendGrid como secundario o usar un subdominio.

### Paso 4: Probar

```bash
curl -X POST "https://tuhuipotecafacil-crm.vercel.app/api/webhook/email" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Test <test@ejemplo.com>",
    "to": "contacto@tuhipotecafacil.cl",
    "subject": "Prueba email piping",
    "text": "Este es un email de prueba. Teléfono: +56912345678"
  }'
```

---

## OPCIÓN 3: Mailgun Routes

### Paso 1: Crear cuenta en Mailgun

1. Ve a https://www.mailgun.com y crea una cuenta
2. Agrega tu dominio y verifica DNS

### Paso 2: Configurar Route

1. En Mailgun → **Receiving** → **Routes**
2. Click **Create Route**
3. Configura:
   - **Expression Type**: `match recipients`
   - **Pattern**: `contacto@tuhipotecafacil.cl`
   - **Action**: `forward("https://tuhuipotecafacil-crm.vercel.app/api/webhook/email")`
   - **Priority**: 0
4. Click **Create Route**

### Paso 3: Configurar DNS

Agrega los registros DNS que Mailgun te indique (MX, TXT, etc.).

---

## Variables de Entorno

Asegúrate de tener configurada la API key de Resend en Vercel:

```bash
# En Vercel → Settings → Environment Variables
RESEND_API_KEY=re_tu_api_key_aqui
FROM_EMAIL=CRM <notificaciones@tuhipotecafacil.cl>
```

---

## Troubleshooting

### El email no llega al CRM

1. **Verificar que el email fue enviado**: Revisa la bandeja de salida
2. **Verificar logs en cPanel**: Ve a **Metrics** → **Errors** o **Logs**
3. **Verificar el script PHP**: Asegúrate de que la ruta sea correcta
4. **Probar el webhook directamente**:
   ```bash
   curl -X POST "https://tuhuipotecafacil-crm.vercel.app/api/webhook/email" \
     -H "Content-Type: application/json" \
     -d '{"from":"test@test.com","subject":"Prueba","text":"Test"}'
   ```

### El lead se crea pero sin nombre

El script intenta extraer el nombre del campo "From". Asegúrate de que el email tenga formato:
```
Nombre Apellido <email@ejemplo.com>
```

### Errores en los logs

Revisa los logs en:
- **Hosting**: `/home/tu_usuario/public_html/crm/email-handler.log`
- **Vercel**: Dashboard → Logs

---

## Checklist de Configuración

- [ ] `email-handler.php` subido al hosting
- [ ] Permisos del script configurados (755)
- [ ] Email forwarder configurado en cPanel (o SendGrid/Mailgun)
- [ ] `RESEND_API_KEY` configurado en Vercel
- [ ] `FROM_EMAIL` configurado en Vercel
- [ ] Prueba de envío exitosa
- [ ] Prueba de recepción exitosa (lead se crea en CRM)
