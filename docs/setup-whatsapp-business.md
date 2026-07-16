# Setup: WhatsApp Business API para TuHipotecaFacil CRM

## Resumen

Este guide explica cómo configurar la integración de WhatsApp Business API para:
- Enviar mensajes automáticos a leads y clientes
- Recibir mensajes y crear actividades
- Usar plantillas aprobadas por Meta

---

## Requisitos

1. **Cuenta de Meta Business Suite** (gratuita)
2. **Número de teléfono** que no esté registrado en WhatsApp personal
3. **Verificación del negocio** (recomendado para mayor límite de mensajes)

---

## Paso 1: Crear cuenta de Meta Business Suite

1. Ve a https://business.facebook.com
2. Crea una cuenta o usa una existente
3. Verifica tu negocio (opcional pero recomendado)

---

## Paso 2: Crear app de WhatsApp

1. Ve a https://developers.facebook.com
2. Haz clic en **My Apps** → **Create App**
3. Selecciona **Business** como tipo de app
4. Nombre: `TuHipotecaFacil CRM`
5. Haz clic en **Create App**

---

## Paso 3: Configurar WhatsApp

1. En tu app, ve a **Add Products** → **WhatsApp**
2. Selecciona tu **Meta Business Suite account**
3. Crea un **WhatsApp Business Account** (WABA) si no tienes uno

---

## Paso 4: Agregar número de teléfono

1. En WhatsApp → **Phone Numbers** → **Add Phone Number**
2. Ingresa tu número de teléfono (ej: +56 9 1234 5678)
3. Verifica el número por SMS o llamada
4. Una vez verificado, copia el **Phone Number ID**

---

## Paso 5: Obtener credenciales

### 5.1 Phone Number ID
- WhatsApp → Phone Numbers → Tu número → **Phone Number ID**
- Ejemplo: `1234567890123456`

### 5.2 Access Token
- WhatsApp → API Setup → **Access Tokens**
- Haz clic en **Generate Token**
- Copia el token (empieza con `EAA...`)
- **Importante**: Guarda este token, solo se muestra una vez

### 5.3 Business Account ID
- WhatsApp → WhatsApp Accounts → Tu cuenta → **WhatsApp Business Account ID**
- Ejemplo: `1234567890123456`

### 5.4 App Secret (para webhooks)
- Settings → Basic → **App Secret**
- Haz clic en **Show** y copia

---

## Paso 6: Configurar en Vercel

En Vercel → Settings → Environment Variables, agrega:

```
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=1234567890123456
WHATSAPP_VERIFY_TOKEN=tu-token-secreto-aqui
WHATSAPP_APP_SECRET=tu-app-secret-aqui
```

---

## Paso 7: Configurar Webhook

### 7.1 Crear endpoint en Meta

1. En tu app de Meta → WhatsApp → **Configuration**
2. En **Webhook**, haz clic en **Edit**
3. Callback URL: `https://tuhuipotecafacil-crm.vercel.app/api/webhook/whatsapp`
4. Verify Token: Usa el mismo que configuraste en Vercel (`WHATSAPP_VERIFY_TOKEN`)
5. Haz clic en **Verify and Save**

### 7.2 Suscribirse a eventos

En la misma sección de Webhook, suscríbete a:
- ✅ `messages` (para recibir mensajes)
- ✅ `message_deliveries` (para saber si se entregaron)
- ✅ `message_reads` (para saber si leyeron)

---

## Paso 8: Crear plantillas

Las plantillas deben estar aprobadas por Meta antes de usarlas.

### 8.1 Crear plantilla

1. En WhatsApp → **Message Templates**
2. Haz clic en **Create Template**
3. Categoría: **MARKETING** o **UTILITY**
4. Nombre: `bienvenida_lead`
5. Idioma: Spanish
6. Contenido:

**Header** (opcional):
```
🏠 Tu Hipoteca Fácil
```

**Body**:
```
¡Hola {{1}}! 👋

Gracias por contactarnos en Tu Hipoteca Fácil. Un asesor se pondrá en contacto contigo en las próximas 24 horas.

¿Tienes alguna consulta? Responde este mensaje y te ayudamos.
```

**Buttons**:
- `📞 Llamar ahora` (Call Phone: +56966842168)
- `🌐 Visitar sitio` (Visit Website: https://tuhipotecafacil.cl)

### 8.2 Otras plantillas recomendadas

| Nombre | Uso |
|--------|-----|
| `solicitud_documentos` | Pedir documentos al cliente |
| `seguimiento_lead` | Seguimiento a leads fríos |
| `recordatorio_documento` | Recordar documentos pendientes |
| `credito_aprobado` | Notificar aprobación de crédito |

---

## Paso 9: Probar

### 9.1 Enviar mensaje de prueba

```bash
curl -X POST "https://tuhuipotecafacil-crm.vercel.app/api/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "+56912345678",
    "mensaje": "¡Hola! Este es un mensaje de prueba desde Tu Hipoteca Fácil 🏠"
  }'
```

### 9.2 Verificar recepción de mensajes

1. Envía un mensaje al número de WhatsApp Business
2. Ve al CRM → Leads → Actividad
3. Debería aparecer la actividad del mensaje recibido

---

## Paso 10: Configurar plantillas en el CRM

En el CRM, ve a **Plantillas** y crea plantillas con los mismos nombres que configuraste en Meta:

- `bienvenida_lead`
- `solicitud_documentos`
- `seguimiento_lead`
- `recordatorio_documento`
- `credito_aprobado`

---

## Variables de Entorno

```bash
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=1234567890123456
WHATSAPP_VERIFY_TOKEN=tu-token-secreto-aqui
WHATSAPP_APP_SECRET=tu-app-secret-aqui
```

---

## Troubleshooting

### "Phone number not verified"
- Verifica que el número esté verificado en Meta Business Suite
- Asegúrate de que el número no esté registrado en WhatsApp personal

### "Invalid access token"
- Regenera el token en Meta Developer Portal
- Verifica que no haya espacios al copiar

### "Template not found"
- Verifica que el nombre de la plantilla sea exacto
- Asegúrate de que esté aprobada (estado: APPROVED)

### "Webhook verification failed"
- Verifica que `WHATSAPP_VERIFY_TOKEN` coincida con el configurado en Meta
- Asegúrate de que la URL del webhook sea HTTPS

### Límite de mensajes
- Sin verificación: 250 mensajes/día a números nuevos
- Con verificación: 10,000+ mensajes/día
- Para superar el límite, verifica tu negocio en Meta

---

## Checklist de Configuración

- [ ] Cuenta de Meta Business Suite creada
- [ ] App de WhatsApp creada
- [ ] Número de teléfono verificado
- [ ] Phone Number ID obtenido
- [ ] Access Token generado
- [ ] Business Account ID obtenido
- [ ] Variables configuradas en Vercel
- [ ] Webhook configurado y verificado
- [ ] Plantillas creadas y aprobadas
- [ ] Prueba de envío exitosa
- [ ] Prueba de recepción exitosa
