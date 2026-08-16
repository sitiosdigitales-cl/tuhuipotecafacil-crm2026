# Auditoría del estado actual · rama `diego`

Fecha de corte: 16 de agosto de 2026  
Código revisado hasta: `bec9a51`  
Alcance: repositorio completo, ejecución local y documentación oficial. No se
leyeron secretos ni se modificaron datos, cuentas o paneles de producción.

## Resultado ejecutivo

El CRM mejoró de forma importante y el núcleo comprobado ya no está en el
estado de la línea base. La rama compila, pasa su tipado, tiene CI y conserva
una suite amplia de regresión. Eso no equivale a certificar producción: aún hay
comprobaciones humanas, deuda de arquitectura y pantallas incompletas.

| Evidencia | Resultado |
| --- | ---: |
| Archivos de prueba | 114 |
| Pruebas | 592/592 en verde |
| Build de Next.js | 0 errores; 83 páginas generadas |
| ESLint | 0 errores |
| TypeScript | 0 errores |
| `npm audit --audit-level=high` | 0 alertas |
| Rutas API | 65 archivos `route.ts` |
| Código TS/TSX en `src/` | 302 archivos; 54.314 líneas |
| Hallazgos históricos documentados | 116 |

**116 no es el número de defectos abiertos.** Es el total acumulado de casos
en `docs/hallazgos/`, incluyendo los ya corregidos. No queda una casilla de
corrección de código conocida sin cerrar; quedan diez casillas operativas que
requieren acceso humano o una decisión de arquitectura.

Durante el tramo BUG-102 a BUG-116 se corrigieron quince defectos adicionales:
consistencia de comisiones y campañas, tokens de Google, cierre de sesión,
matrices de roles, vista previa HTML, referidos, exportaciones y el falso editor
de permisos.

## Cómo se verificó

1. Inventario reproducible con `rg`, conteo de rutas, pruebas, líneas, cuerpos
   JSON y archivos grandes.
2. Revisión de autenticación, cookies, proxy, matrices de rol, cliente Supabase,
   Storage, migraciones, exportaciones y CI.
3. Pruebas de regresión sobre sesión, roles, aislamiento de datos, documentos,
   solicitudes, comisiones, pipeline, entradas y respuestas de error.
4. `npm run build`, `npm test`, ESLint, `npx tsc --noEmit` y `npm audit` después
   de cada corrección.
5. Smoke HTTP local sin sesión:
   - `/login`, `/simulador-publico` y `/referir/codigo-invalido`: `200`.
   - `/portal-cliente`: `307` hacia login.
   - `/api/leads`, `/api/comisiones`, `/api/campanas`, `/api/flujos` y
     `/api/biblioteca`: `401`.
   - las respuestas revisadas incluyeron `nosniff`, política de referencia y
     una CSP que impide marcos y objetos.

No había navegador gráfico conectado en este entorno. Por eso no se afirma que
el responsive, el foco, los modales o todos los recorridos visuales estén
correctos. Esa comprobación debe hacerse en staging con cuentas y datos
sintéticos por rol.

## Autenticación actual

### Lo que está bien

- Las contraseñas usan bcrypt y no existen credenciales de ejemplo activas.
- El JWT exige un secreto de al menos 32 caracteres, algoritmo, audiencia y
  emisor conocidos, y vence a los 30 minutos.
- La cookie es HttpOnly, `Secure` en producción y `SameSite=Lax`.
- `proxy.ts` verifica la firma y limita pantallas por rol.
- `/api/auth/me` vuelve a leer la cuenta, invalida estados o roles cambiados y
  renueva la sesión; el cliente comprueba cada diez minutos y al volver a la
  pestaña.
- Los endpoints comprobados exigen sesión y las colecciones sensibles aplican
  alcance por rol o propietario.

### Lo que todavía limita el diseño

- Es autenticación propia, no Supabase Auth. No hay MFA, recuperación estándar,
  revocación centralizada ni controles administrados de contraseñas conocidas.
- Las APIs validan el rol firmado del JWT, pero no vuelven a consultar la cuenta
  en cada operación. Un cliente que no invoque `/auth/me` puede conservar su rol
  anterior hasta que expire el token, como máximo 30 minutos.
- El contador de intentos fallidos lee y luego actualiza. Dos solicitudes
  simultáneas pueden partir del mismo contador; conviene mover el incremento a
  una función SQL atómica o a un limitador administrado.
- Diez tareas operativas siguen abiertas: rotación de secretos, bootstrap y
  redundancia de `SUPER_ADMIN`, migraciones, envío real y restauración.

## Supabase: veredicto

**Sí, Supabase es una buena elección para este CRM.** PostgreSQL, Storage,
Auth, reglas por fila, respaldos administrados y una API tipada reducen trabajo
operativo. El problema no es Supabase; es que la aplicación aún usa solo parte
de sus garantías.

El código crea un cliente administrativo únicamente en servidor. Esa separación
evita exponer la clave, pero la clave `service_role` omite siempre RLS. Por lo
tanto, hoy la autorización efectiva vive principalmente en las rutas Next.js.
Supabase recomienda RLS para esquemas expuestos y permite combinarlo con Auth
para aplicar una condición equivalente a propietario en cada consulta.

Fuentes oficiales:

- [Row Level Security en Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [La service role omite RLS](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z)
- [Supabase Auth con SSR y Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs)
- [Buckets públicos y privados](https://supabase.com/docs/guides/storage/buckets/fundamentals)

`supabase/migrations/20260816000000_lock_down_anon_and_storage.sql` prepara un modo
servidor: revoca acceso de `anon`/`authenticated`, deja `service_role`, retira
Realtime y vuelve privados los buckets. La migración aditiva
`20260816120000_domain_rls.sql` vuelve a conceder solo lectura autenticada en
cuatro dominios según rol, cartera, cuenta vigente y AAL2 administrativo. Las
escrituras continúan en las APIs del servidor. Ninguna se aplicó desde este
repositorio y no deben darse por vigentes hasta probarlas primero en staging.

La evolución Supabase Auth + MFA + RLS por usuario ya está preparada en código,
incluidas pruebas directas con identidades sintéticas. Su activación todavía
requiere migración y navegación verificadas en staging.

## Datos y respaldos

La exportación propia guarda solo filas de `leads` y `documentos`, conserva cinco
JSON y los almacena dentro del mismo proyecto Supabase. No incluye:

- esquema, funciones, políticas o migraciones;
- usuarios y el resto de tablas;
- contenido binario de Supabase Storage;
- procedimiento de restauración;
- copia fuera del proyecto o de la cuenta.

Supabase documenta que sus respaldos de base tampoco contienen los objetos de
Storage; solo conservan sus metadatos. Según el plan, deben verificarse los
respaldos diarios o PITR, mantener una copia externa de Storage y ejecutar un
ensayo de recuperación con tiempo y pérdida de datos medidos.

Fuente: [respaldos de base de Supabase](https://supabase.com/docs/guides/platform/backups).

## Superficie de entrada

Los endpoints más delicados ya usan JSON acotado y esquemas estrictos, pero
quedan 38 archivos de ruta con `await request.json()` directo. No significa que
los 38 estén defectuosos; significa que todavía no comparten límite de tamaño,
rechazo de campos desconocidos y validación homogénea.

Orden recomendado:

1. dinero y administración: comisiones, bancos e integraciones;
2. automatización: plantillas, flujos y triggers;
3. comunicaciones: email, WhatsApp, mensajes y conversaciones;
4. operación: leads, documentos, solicitudes, tareas y eventos.

Cada migración debe usar `parseBoundedJson`, un esquema estricto, una prueba de
cuerpo grande y una prueba de campo inesperado.

## Funcionalidad aún no lista

Estas superficies no deben presentarse como terminadas aunque el build esté
verde:

- La entrega de Resend requiere una prueba real de staging.

Configuración, plantillas y detalle de usuario ya aplican esa decisión: la
primera conserva notificaciones y pipeline persistidos; la segunda es un
catálogo de solo lectura; el tercero calcula la cartera real por identificador
y no ofrece formularios locales. Toda superficie nueva debe seguir una decisión
binaria: conectarse con validación y pruebas, o permanecer oculta. Mantener
controles que parecen funcionales es peor que mostrar “no disponible”.

## Orden de carpetas

La estructura es entendible, pero la lógica está repartida:

- `src/componentes` contiene dominios y `src/components` contiene UI genérica;
- páginas de hasta 1.652 líneas mezclan consulta, reglas y presentación;
- `src/modulos` convive con lógica duplicada dentro de páginas y `src/lib`;
- migraciones viven tanto en `prisma/` como en `supabase/migrations/`;
- logs, resultados de lint y `crm-webhook-plugin.php` siguen versionados en raíz.

Prioridad de orden, sin renombres masivos simultáneos:

1. mover PHP de WordPress a `wordpress/` y borrar artefactos generados;
2. usar `src/components/ui` solo para UI y un único nombre para componentes de
   dominio;
3. extraer de las páginas grandes `schema.ts`, `api.ts`, reglas y UI por dominio;
4. dejar `supabase/migrations` como fuente canónica de SQL;
5. un dominio por commit, con build y pruebas entre movimientos.

## Prioridades reales

### P0 · antes de confiar datos productivos

1. Recuperar el acceso administrativo y confirmar dos cuentas `SUPER_ADMIN`
   independientes y recuperables.
2. Rotar `JWT_SECRET` y `BACKUP_API_KEY`; configurar `CRON_SECRET` y Resend en
   Vercel sin reutilizar secretos.
3. Aplicar las migraciones pendientes en staging y producción, comprobando que
   `anon` y `authenticated` no leen datos y que `documentos`/`backups` son privados.
4. Verificar respaldo administrado/PITR, copiar Storage fuera del proyecto y
   ensayar una restauración completa.
5. Ejecutar smoke visual en staging con `SUPER_ADMIN`, `ADMIN`, `EJECUTIVO`,
   `AGENTE` y `CLIENTE`, usando datos sintéticos.

### P1 · siguiente ciclo de ingeniería

1. Resolver o retirar la superficie de código incompleta descrita arriba.
2. Migrar gradualmente a Supabase Auth, MFA y RLS por propietario.
3. Hacer atómico el bloqueo de login y definir revocación inmediata de sesión.
4. Llevar los 38 cuerpos JSON restantes a límites y esquemas estrictos.
5. Añadir una prueba de restauración y una prueba end-to-end de los flujos con
   dinero y documentos.

### P2 · mantenibilidad

1. Dividir las páginas mayores de 700 líneas.
2. Consolidar carpetas, migraciones y fuentes de tipos.
3. Retirar artefactos generados del historial activo.
4. Endurecer la CSP general con nonces como proyecto separado, porque Next.js
   necesita un diseño compatible con sus scripts.

## Conclusión

El código actual es sustancialmente más confiable que la línea base: CI real,
592 regresiones, sesión firmada, roles verificados, datos aislados y respuestas
de error honestas. No está “perfecto” ni se puede asignar un número total de
bugs sin inventar. La evidencia permite afirmar algo más útil: el núcleo bajo
prueba está verde; la brecha principal ya no es lint, sino operación productiva,
recuperación, uso completo de Supabase y retiro de interfaces incompletas.
