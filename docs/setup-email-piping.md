# Correo entrante por email piping de cPanel

El correo del dominio vive en cPanel y no se puede mover. El correo entrante de
Resend exigiría apuntar los MX del dominio a Resend, así que no aplica: este es
el camino que se usa.

## Qué corre dónde

| Pieza | Dónde corre | Qué hace |
|---|---|---|
| `wordpress/email-handler.php` | cPanel, como CLI | recibe el correo por STDIN y lo manda al CRM |
| `POST /api/webhook/email` | Vercel | crea el lead, la notificación y el acuse al remitente |

No confundir con la captura del formulario: esa es `crm-webhook-plugin.php`,
corre dentro de WordPress y postea a `/api/webhook/leads`. Son dos caminos
distintos y ninguno depende del otro.

## Variables de entorno

En **cPanel**, para el script:

| Variable | Obligatoria | Valor |
|---|---|---|
| `CRM_EMAIL_WEBHOOK_URL` | sí | `https://<despliegue>/api/webhook/email` |
| `CRM_EMAIL_WEBHOOK_SECRET` | sí | el mismo valor que `EMAIL_WEBHOOK_SECRET` en Vercel |
| `CRM_EMAIL_LOG` | no | ruta del log operativo; por omisión el temporal del sistema |

En **Vercel**:

| Variable | Obligatoria | Valor |
|---|---|---|
| `EMAIL_WEBHOOK_SECRET` | sí | mismo valor que `CRM_EMAIL_WEBHOOK_SECRET` |

Sin secreto configurado en Vercel el endpoint responde **401 a todo**. Es
deliberado: escribe en la base con la service role key y dispara correos.

El destino tampoco se escribe en el script. Un dominio viejo hardcodeado pierde
correo en silencio, que es justo lo que hay que evitar en el camino de un lead.

El handler rechaza entradas mayores a 1 MiB, recorre multipartes hasta diez
niveles y cien partes, decodifica `base64`/`quoted-printable`, normaliza charsets
y omite adjuntos. Solo `from`, `to`, `subject`, `text`, `date` y `messageId`
llegan al CRM.

## Instalación

1. Subir `email-handler.php` a una ruta **fuera de `public_html`**, por ejemplo
   `/home/<usuario>/crm/email-handler.php`.

   > Fuera del árbol web a propósito. El log se crea con modo `0600` y conserva
   > solo estados y códigos HTTP, nunca remitente, asunto, cuerpo ni respuesta.

2. Permisos `0755` y propietario el usuario de cPanel.

3. Confirmar que la primera línea (`#!/usr/bin/php`) apunta al PHP real del
   hosting. Si no, `which php` en el terminal de cPanel y corregirla.

4. cPanel → **Email** → **Forwarders** → *Add Forwarder*:
   - Address: la casilla que recibe las consultas
   - Destination: **Pipe to a Program**
   - Program: la ruta del paso 1, relativa al home

5. Definir las variables de entorno del script. Si el hosting no permite
   variables para programas invocados por el forwarder, exportarlas desde un
   envoltorio `.sh` que llame al PHP.

## Verificación

Enviar un correo de prueba a la casilla y revisar, en orden:

1. El log (`CRM_EMAIL_LOG`). Debe decir `Recibido N bytes` y `CRM Response (200)`.
   - `STDIN vacío` significa que el forwarder no está entregando por STDIN.
   - `supera el limite de 1 MiB` exige reducir el mensaje; el handler no procesa
     adjuntos como parte de un lead.
   - `falta CRM_EMAIL_WEBHOOK_URL` o `falta CRM_EMAIL_WEBHOOK_SECRET`: paso 5.
2. `CRM Response (401)`: el secreto de cPanel y el de Vercel no coinciden.
3. El lead en el CRM, con `origen = email_corporativo`.

Prueba del endpoint sin pasar por el correo:

```bash
curl -sS -X POST "$CRM_EMAIL_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $CRM_EMAIL_WEBHOOK_SECRET" \
  -d '{"from":"Prueba <prueba@example.invalid>","subject":"Consulta","text":"Telefono: +56 9 1111 1111"}'
```

Usa siempre una dirección sintética: el endpoint crea un lead real y le manda
un acuse al remitente.

## Checklist

- [ ] `email-handler.php` subido fuera de `public_html`, con permisos `0755`
- [ ] Shebang apuntando al PHP del hosting
- [ ] Forwarder con *Pipe to a Program* configurado
- [ ] `CRM_EMAIL_WEBHOOK_URL` y `CRM_EMAIL_WEBHOOK_SECRET` definidos en cPanel
- [ ] `EMAIL_WEBHOOK_SECRET` definido en Vercel, con el mismo valor
- [ ] Correo de prueba que termina en un lead con `origen = email_corporativo`
- [ ] Prueba sintética multipart con cuerpo codificado y adjunto omitido
