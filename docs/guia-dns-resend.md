# Guía: Configurar DNS para Resend + Conectar Leads

## Paso 1: Crear cuenta en Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta
2. En el dashboard, ve a **Domains** → **Add Domain**
3. Escribe: `tuhipotecafacil.cl`
4. Resend te mostrará los registros DNS que necesitas configurar

## Paso 2: Configurar registros DNS

### ¿Dónde configurar el DNS?

Depende de dónde tengas registrado el dominio:

| Proveedor | Dónde ir |
|-----------|----------|
| **Cloudflare** | Dashboard → tu dominio → DNS → Records |
| **GoDaddy** | My Products → DNS Management |
| **Namecheap** | Domain List → Manage → Advanced DNS |
| **Google Domains** | DNS → Custom resource records |
| **Nic.cl** (Chile) | Panel de administración del dominio |

### Registros a crear:

#### SPF (obligatorio)
```
Tipo: TXT
Nombre/Host: @ (o deja vacío)
Valor: v=spf1 include:send.resend.com ~all
TTL: Auto
```

#### DKIM (obligatorio) - Los valores los da Resend
```
Tipo: CNAME
Nombre/Host: resend._domainkey
Valor: [copiar de Resend]
TTL: Auto
```

#### DMARC (recomendado)
```
Tipo: TXT
Nombre/Host: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:dmarc@tuhipotecafacil.cl
TTL: Auto
```

#### Registro de verificación (temporal)
```
Tipo: TXT
Nombre/Host: [copiar de Resend]
Valor: [copiar de Resend]
TTL: Auto
```

## Paso 3: Verificar en Resend

1. En Resend dashboard, haz clic en **Verify DNS**
2. Espera 5-30 minutos a que se propague
3. Si hay errores, verifica que los registros estén correctos

## Paso 4: Configurar API Key en Vercel

1. En Resend → **API Keys** → **Create API Key**
2. Copia la API Key
3. En tu proyecto de Vercel → Settings → Environment Variables
4. Agrega:
   - `RESEND_API_KEY` = `re_xxxxxxxxxxxxxxxx`

## Paso 5: Configurar el remitente

En tu `.env` o en Vercel:
```
FROM_EMAIL=CRM <notificaciones@tuhipotecafacil.cl>
```

---

## Conexión de formularios web → CRM

### Opción A: Si usas WordPress/Elementor

1. En Elementor → Tu formulario → **Actions After Submit**
2. Agrega **Webhook**
3. En el campo Webhook URL, pon:
   ```
   https://tuhuipotecafacil-crm.vercel.app/api/webhook/leads?secret=TU_SECRET
   ```
4. Configura las variables de entorno en Vercel:
   - `ELEMENTOR_WEBHOOK_SECRET` = `TU_SECRET` (el mismo que pusiste en la URL)

### Opción B: Si usas otro builder (Wix, Squarespace, etc.)

Usa **Zapier** o **Make.com** para conectar:
1. Trigger: Form submission en tu web
2. Action: POST a `https://tuhuipotecafacil-crm.vercel.app/api/webhook/leads`
3. Body format: JSON con los campos del formulario

### Opción C: Formulario directo en React/Next.js

Si tu web es Next.js, puedes hacer fetch directo:
```javascript
fetch('https://tuhuipotecafacil-crm.vercel.app/api/webhook/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@ejemplo.com',
    telefono: '+56912345678',
    monto_credito: 50000000,
    tipo_credito: 'Primera Vivienda',
    situacion_laboral: 'Dependiente'
  })
})
```

---

## Campos soportados por el webhook

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

El webhook es **flexible** - acepta nombres en español e inglés, y formatos de Elementor.

---

## Prueba rápida

Una vez configurado todo, prueba con curl:

```bash
curl -X POST https://tuhuipotecafacil-crm.vercel.app/api/webhook/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellido": "Lead",
    "email": "test@ejemplo.com",
    "telefono": "+56912345678"
  }`
```

Deberías recibir: `{"success":true,"message":"Lead creado correctamente"}`

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Correos van a spam | Verificar SPF y DKIM están activos en Resend |
| Webhook no crea lead | Verificar que el endpoint esté activo: GET a /api/webhook/leads |
| CORS error | El webhook ya tiene CORS habilitado con OPTIONS |
| Lead no aparece en CRM | Verificar que Supabase esté conectado |
