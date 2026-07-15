# Guía Completa: DNS + Email + Captura de Leads

## Resumen del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUJO DE LEADS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PÁGINA WEB (WordPress/Elementor)                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Formulario  │───▶│   Webhook    │───▶│     CRM      │      │
│  │  de Contacto │    │  /api/webhook│    │   (Vercel)   │      │
│  └──────────────┘    │    /leads    │    └──────────────┘      │
│                      └──────────────┘                           │
│                                                                 │
│  CORREO CORPORATIVO (contacto@tuhipotecafacil.cl)               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Email      │───▶│  Email Piping│───▶│     CRM      │      │
│  │   Recibido   │    │  (cPanel)    │    │   (Vercel)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
│  CRM → ENVÍO DE CORREOS (Resend)                                │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Resend API  │───▶│  DNS (SPF/   │───▶│  Bandeja     │      │
│  │              │    │  DKIM/DMARC) │    │  de Entrada  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PARTE 1: Configurar DNS para Resend (Envío de Correos)

### ¿Qué es Resend?
Resend es el servicio que usa tu CRM para enviar correos (bienvenida, documentos pendientes, etc.). Necesita configurar DNS para que los correos no lleguen a spam.

### Paso 1: Crear cuenta en Resend
1. Ve a https://resend.com y crea una cuenta gratuita
2. En el dashboard, ve a **Domains** → **Add Domain**
3. Escribe: `tuhipotecafacil.cl`

### Paso 2: Obtener registros DNS de Resend
Resend te mostrará 3 registros que necesitas copiar.

### Paso 3: Configurar en Nic.cl o tu proveedor

#### Acceder al panel de DNS:
1. Ingresa a https://www.nic.cl o tu proveedor
2. Ve a **Mis Dominios** → **tuhipotecafacil.cl** → **Administrar DNS**

#### Crear los registros:

**Registro 1 - SPF (autoriza Resend a enviar)**
```
Tipo: TXT
Nombre: @ (o vacío)
Valor: v=spf1 include:send.resend.com ~all
TTL: 3600
```

**Registro 2 - DKIM (firma digital)**
```
Tipo: CNAME
Nombre: resend._domainkey
Valor: [copiar de Resend]
TTL: 3600
```

**Registro 3 - Verificación (temporal)**
```
Tipo: TXT
Nombre: [copiar de Resend]
Valor: [copiar de Resend]
TTL: 3600
```

**Registro 4 - DMARC (política de seguridad)**
```
Tipo: TXT
Nombre: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:dmarc@tuhipotecafacil.cl
TTL: 3600
```

### Paso 4: Verificar en Resend
1. En Resend, haz clic en **Verify DNS**
2. Espera 5-30 minutos a que se propague
3. Cuando aparezca verde, está listo

### Paso 5: Configurar API Key en Vercel
1. En Resend → **API Keys** → **Create API Key**
2. Copia la clave (empieza con `re_`)
3. En Vercel → Settings → Environment Variables
4. Agrega:
   - **Nombre**: `RESEND_API_KEY`
   - **Valor**: `re_xxxxxxxxxxxxxxxx`

### Paso 6: Verificar FROM_EMAIL
En tu `.env` o en Vercel:
```
FROM_EMAIL=CRM <notificaciones@tuhipotecafacil.cl>
```

---

## PARTE 2: Email Piping (Recibir emails como leads)

### ¿Qué es Email Piping?
Es cuando un email enviado a `contacto@tuhipotecafacil.cl` se reenvía automáticamente al CRM y se crea un lead.

### Configuración en cPanel

#### Paso 1: Subir el script PHP
1. Sube `crm-email-handler.php` a tu hosting
2. Ruta sugerida: `/home/usuario/public_html/crm-email-handler.php`
3. Asegúrate de que la ruta en el archivo sea correcta:
   ```php
   $crmUrl = 'https://tuhuipotecafacil-crm.vercel.app/api/webhook/email';
   ```

#### Paso 2: Configurar Email Forwarder en cPanel
1. En cPanel → **Email** → **Forwarders**
2. Haz clic en **Add Forwarder**
3. Configura:
   - **Address to Forward**: `contacto` (o el邮箱 que quieras)
   - **Domain**: `tuhipotecafacil.cl`
   - **Forward to**: Selecciona **"Pipe to a program"**
   - **Program**: `/home/usuario/public_html/crm-email-handler.php`
4. Haz clic en **Add Forwarder**

#### Paso 3: Probar
Envía un email a `contacto@tuhipotecafacil.cl` y verifica que aparezca en el CRM.

### Alternativa: Usar SendGrid Inbound Parse
Si prefieres usar SendGrid en vez de cPanel:

1. Crea cuenta en SendGrid
2. Ve a **Settings** → **Inbound Parse**
3. Agrega:
   - **Hostname**: `tuhipotecafacil.cl`
   - **URL**: `https://tuhuipotecafacil-crm.vercel.app/api/webhook/email`
   - **Spam Check**: No
4. Configura el MX record en tu DNS:
   ```
   Tipo: MX
   Nombre: @
   Valor: mx1.sendgrid.net
   Prioridad: 10
   ```

---

## PARTE 3: Conectar Formularios Web al CRM

### Opción A: WordPress + Elementor

1. En Elementor → Tu formulario → **Actions After Submit**
2. Agrega **Webhook**
3. En el campo Webhook URL:
   ```
   https://tuhuipotecafacil-crm.vercel.app/api/webhook/leads?secret=TU_SECRET
   ```
4. En Vercel, agrega la variable:
   - **Nombre**: `ELEMENTOR_WEBHOOK_SECRET`
   - **Valor**: `TU_SECRET` (el mismo que pusiste en la URL)

### Opción B: Formulario HTML genérico

```html
<form action="https://tuhuipotecafacil-crm.vercel.app/api/webhook/leads" method="POST">
  <input type="hidden" name="secret" value="TU_SECRET">
  <input type="text" name="nombre" placeholder="Nombre" required>
  <input type="text" name="apellido" placeholder="Apellido">
  <input type="email" name="email" placeholder="Email" required>
  <input type="tel" name="telefono" placeholder="Teléfono">
  <select name="tipo_credito">
    <option value="Primera Vivienda">Primera Vivienda</option>
    <option value="Segunda Vivienda">Segunda Vivienda</option>
    <option value="Refinanciamiento">Refinanciamiento</option>
  </select>
  <textarea name="mensaje" placeholder="Cuéntanos sobre tu proyecto"></textarea>
  <button type="submit">Enviar</button>
</form>
```

### Opción C: JavaScript fetch

```javascript
const enviarFormulario = async (datos) => {
  const response = await fetch('https://tuhuipotecafacil-crm.vercel.app/api/webhook/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: 'TU_SECRET',
      ...datos
    })
  });
  return response.json();
};

// Uso
enviarFormulario({
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@ejemplo.com',
  telefono: '+56912345678',
  monto_credito: 50000000,
  tipo_credito: 'Primera Vivienda'
});
```

### Campos soportados por el webhook

| Campo Formulario | Nombre en BD | Ejemplo |
|------------------|--------------|---------|
| Nombre / name / first_name | nombre | Juan |
| Apellido / last_name | apellido | Pérez |
| Rut / RUT | rut | 12345678-9 |
| Email / correo | email | juan@ejemplo.com |
| Teléfono / phone | telefono | +56912345678 |
| Monto crédito | monto_solicitado | 50000000 |
| Tipo crédito | tipocredito | Primera Vivienda |
| Situación laboral | situacionlaboral | DEPENDIENTE / INDEPENDIENTE |
| Comentarios / mensaje | notas | Quiero información |

---

## PARTE 4: Variables de Entorno en Vercel

```bash
# Supabase (ya configurado)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Resend (para envío de correos)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
FROM_EMAIL=CRM <notificaciones@tuhipotecafacil.cl>

# Webhook Secret (para formularios Elementor)
ELEMENTOR_WEBHOOK_SECRET=tu-secreto-aqui

# JWT (ya configurado)
JWT_SECRET=tuhuipotecafacil-secret-key-2026
```

---

## PARTE 5: Pruebas

### Probar webhook de formularios
```bash
curl -X POST "https://tuhuipotecafacil-crm.vercel.app/api/webhook/leads?secret=TU_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellido": "Lead",
    "email": "test@ejemplo.com",
    "telefono": "+56912345678"
  }'
```

Respuesta esperada:
```json
{"success":true,"message":"Lead creado correctamente"}
```

### Probar webhook de emails
```bash
curl -X POST "https://tuhuipotecafacil-crm.vercel.app/api/webhook/email" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Juan Pérez <juan@ejemplo.com>",
    "to": "contacto@tuhipotecafacil.cl",
    "subject": "Consulta crédito hipotecario",
    "text": "Hola, quiero información sobre crédito hipotecario. Mi teléfono es +56912345678."
  }'
```

Respuesta esperada:
```json
{"success":true,"message":"Lead creado desde email","leadId":"uuid","nombre":"Juan Pérez","email":"juan@ejemplo.com","tipoConsulta":"Crédito Hipotecario"}
```

---

## Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| Emails van a spam | DNS no verificado | Verificar SPF/DKIM en Resend |
| Webhook no crea lead | Secret incorrecto | Verificar ELEMENTOR_WEBHOOK_SECRET |
| Email piping no funciona | Ruta PHP incorrecta | Verificar ruta en crm-email-handler.php |
| Lead no aparece en CRM | Supabase desconectado | Verificar variables de entorno |
| CORS error | Origen no permitido | El webhook ya tiene CORS habilitado |

---

## Checklist de Configuración

- [ ] Cuenta creada en Resend
- [ ] Dominio verificado en Resend
- [ ] Registro SPF configurado en DNS
- [ ] Registro DKIM configurado en DNS
- [ ] Registro DMARC configurado en DNS
- [ ] API Key de Resend en Vercel
- [ ] FROM_EMAIL configurado
- [ ] crm-email-handler.php subido al hosting
- [ ] Email forwarder configurado en cPanel
- [ ] Webhook URL configurado en Elementor
- [ ] ELEMENTOR_WEBHOOK_SECRET en Vercel
- [ ] Prueba de webhook exitosa
- [ ] Prueba de email piping exitosa
