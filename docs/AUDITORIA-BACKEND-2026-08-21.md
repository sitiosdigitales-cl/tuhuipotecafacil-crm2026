# Auditoría canónica del backend · 2026-08-21

Esta auditoría sustituye inventarios históricos como fuente de verdad técnica.
Su medición inicial parte del commit
`30968cf0fd0fe9e9370ac2c9fee8b79aad80591e` y se mantiene junto al historial de
`diego`; no certifica por sí sola la configuración efectiva de Vercel,
Supabase, DNS, cPanel ni producción.

## Resumen verificable

| Superficie | Estado comprobado en repositorio |
| --- | --- |
| Next.js | `16.3.1`; 93 rutas generadas por el último build validado |
| API | 74 archivos `route.ts` bajo `src/app/api/` |
| Pruebas | 165 archivos; la cifra exacta se registra en cada gate |
| Base de datos | 12 migraciones canónicas en `supabase/migrations/` |
| pgTAP | 7 archivos y 161 comprobaciones declaradas |
| CI | seis jobs: audit, lint, typecheck, build, test y database |
| Hallazgos | 142 informes `BUG-*`; ninguno conserva corrección pendiente |
| Auth | modos `legacy`, `bridge` y `required`, TOTP para roles administrativos y recuperación de contraseña |
| Storage | buckets privados y comprobaciones locales de acceso por rol |
| Respaldo | cron interno, backup cifrado externo y ensayo de restauración versionados |

Los números anteriores se obtienen del árbol del commit auditado. Un cambio de
SHA exige volver a medirlos antes de usarlos como criterio de despliegue.

## Estado por capa

### Autenticación y autorización

- La aplicación usa Supabase Auth con puente de identidades heredadas, cookies
  HttpOnly, validación de cuenta vigente y MFA para `SUPER_ADMIN` y `ADMIN`.
- La recuperación de contraseña contempla identidades pendientes, token de un
  solo uso, ventana de 15 minutos y revocación global de sesiones.
- RLS, Auth, recuperación y Storage se reconstruyen y prueban contra Supabase
  local en el job `database`.
- Sigue pendiente repetir la matriz completa en un proyecto de staging vacío y
  confirmar la configuración efectiva de Auth antes de activar `required`.

### Datos y migraciones

- La única cadena instalable es la de 12 archivos timestamp bajo
  `supabase/migrations/`, desde `20260813000000_application_schema.sql` hasta
  `20260820000000_correos_entrantes.sql`.
- Los SQL históricos de `prisma/` no son un instalador y no prueban qué existe
  en un proyecto remoto.
- No existe evidencia versionada suficiente para afirmar que producción tiene
  las 12 migraciones aplicadas o que no existe deriva. Esa comprobación es un
  gate humano, primero en staging y luego en producción.

### Correo y webhooks

- El envío saliente usa Resend y requiere `RESEND_API_KEY`, `FROM_EMAIL` y una
  `APP_URL` canónica configuradas fuera del repositorio.
- El correo entrante dispone de handler PHP para cPanel y webhook protegido por
  secreto. Conversión, MIME, límites, payload estricto e idempotencia
  persistente están cubiertos localmente.
- El plugin WordPress valida un secreto y obtiene la URL HTTPS exacta desde
  `CRM_WEBHOOK_URL` o una opción del servidor, nunca desde el navegador.
- Ninguna prueba local demuestra la entrega real del proveedor, la ruta del PHP
  de cPanel ni los MX efectivos del dominio.

### Backups y recuperación

- `vercel.json` programa `/api/backup/cron` a las 02:00 UTC en `gru1`.
- Los workflows `External Backup` y `Restore Drill` versionan respaldo cifrado,
  verificación por hashes, destino vacío y medición de RTO.
- La presencia del código no demuestra que R2, Restic, environments protegidos,
  alertas o PITR estén habilitados. `BAK-01`, `BAK-02`, `RES-01` y `RES-02`
  permanecen abiertos hasta obtener evidencia operacional.

### CMF e integraciones opcionales

- CMF queda cerrado por decisión operativa: el servicio permanece `SIN_DATOS`
  y no se configurará `CMF_API_KEY`.
- Las tasas específicas por banco pertenecen al catálogo manual del CRM. Los
  roles `EJECUTIVO`, `ADMIN` y `SUPER_ADMIN` pueden actualizar solo esos campos;
  los simuladores publican el valor y fecha guardados como referenciales.
- Stripe, WhatsApp, IA y Google no son dependencias del núcleo productivo y no
  bloquean el despliegue mientras su estado deshabilitado sea explícito.

### Monitoreo

- `GET /api/health` comprueba conectividad con Supabase y responde únicamente
  `{"status":"ok"}` o `{"status":"unavailable"}` con caché deshabilitada.
- La configuración del monitor, canal de alerta y prueba de recuperación son
  acciones humanas abiertas bajo `MON-01`.

## Discrepancias del inventario recibido

El archivo externo `INVENTARIO_TECNICO_TUHIPOTECAFACIL.md`, generado el
2026-08-20, se usa solo como pista para solicitar evidencia. No se incorpora al
repositorio porque mezcla afirmaciones actuales, historial y datos de panel sin
trazabilidad. Las discrepancias principales son:

| Inventario externo | Repositorio auditado |
| --- | --- |
| Lista scripts SQL antiguos como migraciones aplicadas | Hay 12 migraciones canónicas timestamp; el estado remoto no está probado |
| Describe RLS permisivo y buckets públicos | El código vigente restringe RLS y declara `documentos` y `backups` privados |
| Afirma que existe `.env` versionado | No hay archivos `.env*` rastreados y están ignorados |
| Indica que no existe forwarder PHP | Existe `wordpress/email-handler.php` |
| Usa `main` como rama productiva | El repositorio usa `master` como rama por defecto y `diego` como rama de trabajo |
| Describe región `scl1` y cron `/api/backup` | `vercel.json` usa `gru1` y `/api/backup/cron` |
| Enumera endpoints de registro, Stripe y health | No corresponden al inventario actual; health se mantiene pendiente |
| Omite MFA y recuperación de contraseña | Ambos flujos están implementados y probados localmente |
| Incluye OpenAI y Capacitor | No figuran como dependencias instaladas |

Una diferencia entre código e inventario no demuestra qué está desplegado. La
resuelve evidencia del panel asociada a un SHA, no una suposición.

## Matriz de evidencia

| Afirmación | Código/CI | Staging | Producción |
| --- | --- | --- | --- |
| Build, lint, tipos y pruebas | comprobable | repetir para SHA desplegado | repetir para SHA desplegado |
| 12 migraciones ordenadas | comprobable localmente | `migration list` y dry-run pendientes | pendiente después de staging |
| RLS y buckets privados | comprobable localmente | matriz sintética pendiente | smoke sin datos personales pendiente |
| Auth bridge, MFA y recuperación | comprobable localmente | proveedor alojado y correo real pendientes | pendiente después de staging |
| Resend y DNS | no comprobable solo con código | entrega sintética pendiente | evidencia del proveedor pendiente |
| Piping cPanel | no comprobable solo con código | prueba sintética pendiente | instalación y prueba pendientes |
| Backup restaurable | workflow comprobable | restore drill pendiente | política/PITR y snapshot pendientes |
| URL canónica pública | parcialmente comprobable | decisión y smoke pendientes | decisión y smoke pendientes |

## Evidencia requerida del responsable de plataforma

No enviar secretos, tokens, cadenas de conexión, correos, RUT, nombres ni datos
de clientes. Para cerrar los gates se necesita:

1. URL canónica de producción y confirmación de que exige Auth/MFA del CRM, no
   Vercel SSO; previews y staging pueden conservar protección de Vercel.
2. SHA desplegado y rama de producción configurada en Vercel.
3. Lista de nombres de variables presentes por entorno, sin sus valores.
4. `migration list` y dry-run saneados de un proyecto de staging vacío.
5. Configuración no secreta de Auth: expiración, redirects, registro, refresh y
   TOTP.
6. Estado de buckets y políticas, sin rutas ni identificadores de objetos.
7. Estado de PITR/backup, retención y último punto recuperable.
8. Resultado del restore drill en destino desechable.
9. Estado SPF, DKIM, DMARC y una entrega a buzón sintético.
10. MX efectivo, ruta real del PHP del forwarder y módulos disponibles para ese
    binario.
11. Resultado de un webhook WordPress sintético y un correo entrante sintético.
12. Responsable, fuente comercial y frecuencia de revisión del catálogo manual.

## Orden de cierre

1. Configurar la URL canónica ya centralizada en cada entorno y servidor.
2. Validar robustez e idempotencia del correo entrante en cPanel con sintéticos.
3. Añadir health mínimo sin filtrar detalles internos.
4. Mantener CMF en `SIN_DATOS` y revisar semanalmente las tasas manuales.
5. Endurecer por dominio las entradas JSON aún no tipadas.
6. Ejecutar staging, backup, restore y smoke con la plantilla de evidencia.
7. Autorizar producción solo si todos los gates pertenecen al mismo SHA.
