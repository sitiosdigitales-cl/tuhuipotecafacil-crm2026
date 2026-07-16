# Setup: Stripe + Google Calendar para TuHipotecaFacil CRM

## Resumen de Integraciones

| Integración | Estado | Descripción |
|-------------|--------|-------------|
| Google Calendar | ✅ Servicio listo | Sincronización de eventos y Google Meet |
| Stripe | ✅ Servicio listo | Pagos y comisiones de ejecutivos |

---

## PARTE 1: Google Calendar

### ¿Qué hace?
- Crea eventos en tu Google Calendar desde el CRM
- Genera links de Google Meet automáticamente
- Sincroniza reuniones con leads
- Envía recordatorios

### Configuración en Google Cloud Console

#### Paso 1: Crear proyecto
1. Ve a https://console.cloud.google.com
2. Crea un proyecto nuevo: `TuHipotecaFacil-CRM`
3. Habilita la API de Google Calendar

#### Paso 2: Crear credenciales
1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **Create Credentials** → **OAuth client ID**
3. Tipo: **Web application**
4. Nombre: `TuHipotecaFacil CRM`
5. Authorized redirect URIs:
   - `http://localhost:3000` (desarrollo)
   - `https://tuhuipotecafacil-crm.vercel.app` (producción)

#### Paso 3: Crear API Key
1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **Create Credentials** → **API key**
3. Copia la key

#### Paso 4: Configurar en Vercel

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=tu-api-key
```

### Uso en el CRM

1. Ve a **Agenda** → **Crear Evento**
2. Haz clic en el ícono de Google Calendar
3. Autoriza acceso a tu calendario
4. Crea eventos que se sincronizan automáticamente

---

## PARTE 2: Stripe

### ¿Qué hace?
- Procesa pagos con tarjeta de crédito/débito
- Crea links de pago para compartir
- Gestiona comisiones de ejecutivos
- Registra todas las transacciones

### Configuración en Stripe

#### Paso 1: Crear cuenta
1. Ve a https://stripe.com
2. Crea una cuenta (o usa una existente)
3. Completa la verificación de negocio

#### Paso 2: Obtener credenciales
1. En Stripe Dashboard → **Developers** → **API Keys**
2. Copia:
   - **Publishable key** (empieza con `pk_`)
   - **Secret key** (empieza con `sk_`)

#### Paso 3: Configurar webhook
1. En Stripe → **Developers** → **Webhooks**
2. Haz clic en **Add endpoint**
3. URL: `https://tuhuipotecafacil-crm.vercel.app/api/webhook/stripe`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copia el **Signing secret** (empieza con `whsec_`)

#### Paso 4: Configurar en Vercel

```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
```

### Uso en el CRM

#### Crear pago de comisión
1. Ve a **Comisiones**
2. Selecciona una comisión pendiente
3. Haz clic en **Cobrar**
4. Se abre Stripe Checkout
5. El ejecutivo paga con tarjeta

#### Crear link de pago rápido
1. Ve a **Comisiones** → **Crear Pago**
2. Ingresa monto y descripción
3. Comparte el link generado

---

## Variables de Entorno

```bash
# Google Calendar
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=tu-api-key

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
```

---

## API Endpoints

### Google Calendar
- OAuth2 flow se maneja en el cliente (`src/lib/services/googleCalendar.ts`)

### Stripe
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/stripe/create-session` | POST | Crear sesión de pago |
| `/api/webhook/stripe` | POST | Recibir eventos de Stripe |

---

## Troubleshooting

### Google Calendar
- **"Access blocked"**: Verifica que la app esté en modo "Testing" o publicada
- **"Invalid client"**: Verifica el Client ID
- **Eventos no aparecen**: Verifica que el usuario haya autorizado el acceso

### Stripe
- **"Invalid API key"**: Verifica que la key sea correcta
- **Webhook no recibe eventos**: Verifica la URL del webhook
- **Pago no se registra**: Verifica que el webhook esté configurado

---

## Checklist

### Google Calendar
- [ ] Proyecto creado en Google Cloud Console
- [ ] API de Google Calendar habilitada
- [ ] OAuth client ID creado
- [ ] API Key creada
- [ ] Variables configuradas en Vercel
- [ ] Prueba de creación de evento exitosa

### Stripe
- [ ] Cuenta de Stripe creada y verificada
- [ ] Publishable key obtenida
- [ ] Secret key obtenida
- [ ] Webhook configurado
- [ ] Variables configuradas en Vercel
- [ ] Prueba de pago exitosa
