# Auditoría del estado actual · rama `diego`

Fecha de corte: 16 de agosto de 2026
Código funcional revisado hasta: `73c7074`
Alcance: repositorio completo, build de producción, pruebas, migraciones y
workflows. No se leyeron secretos, datos personales ni paneles administrados.

## Dictamen ejecutivo

La rama está en un estado de ingeniería muy superior a la línea base: compila,
no tiene errores de lint o tipos, no presenta alertas de dependencias en los
umbrales ejecutados y conserva una suite amplia de regresión. Los flujos de
dinero, documentos, solicitudes, sesión, roles y persistencia cliente-servidor
tienen cobertura específica.

Eso **no certifica todavía la operación productiva**. Las migraciones y la
configuración de Supabase Auth no fueron aplicadas ni comprobadas por Codex en
un proyecto administrado. El respaldo externo y su restauración existen como
código, pero siguen desactivados hasta que una persona configure R2, secretos y
un staging vacío. El ingreso real por cada rol también requiere un smoke de
navegador en ese entorno.

| Evidencia local | Resultado |
| --- | ---: |
| Archivos de prueba | 151 |
| Pruebas | 754/754 |
| Build de Next.js 16.3.1 | 0 errores; 87 páginas |
| ESLint | 0 errores |
| TypeScript | 0 errores |
| `npm audit --audit-level=high` | 0 alertas |
| `npm audit --omit=dev --audit-level=high` | 0 alertas |
| Rutas API | 68 archivos `route.ts` |
| Código TS/TSX en `src/` | 301 archivos; 53.122 líneas |
| Migraciones Supabase | 8 |
| Pruebas pgTAP | 4 archivos; 61 aserciones planificadas |

## Cuántos defectos quedan

`docs/hallazgos/` contiene 133 informes `BUG-*` y una medición `C-07`: son 134
documentos históricos, **no 134 defectos abiertos**. Todas sus casillas de
corrección de código están cerradas. Permanecen diez casillas que dependen de
paneles, secretos, migraciones administradas, respaldo o verificación humana.

No es correcto afirmar que el repositorio tiene cero defectos desconocidos. La
conclusión comprobable es más acotada: no queda un defecto de código ya
documentado sin corregir; la suite conocida está verde; y las brechas abiertas
se enumeran en esta auditoría y en `docs/CHECKLIST-CONFIGURACION.md`.

## Cómo se verificó

1. Inventario reproducible de pruebas, rutas, líneas, migraciones, cuerpos JSON,
   polling, archivos grandes y hallazgos.
2. Revisión de sesión, cookies, Auth, MFA, proxy, matriz de roles, cliente
   administrativo, RLS, Storage, respaldo y restauración.
3. Pruebas de negocio sobre pipeline, comisiones, documentos y solicitudes.
4. Pruebas de regresión sobre roles, propiedad de datos, entradas acotadas,
   errores de proveedor y mutaciones confirmadas por el servidor.
5. `npm run build`, `npm test`, `npm run lint`, `npm run typecheck` y las dos
   auditorías de dependencias.
6. CI reconstruye Supabase local dos veces, ejecuta pgTAP y usa identidades
   sintéticas para comprobar Auth, MFA y RLS por Data API.

No se hizo un recorrido con datos reales. Esa omisión es intencional: las
pruebas usan datos sintéticos y el smoke final debe ejecutarse en staging, no
sobre la cartera productiva.

## Autenticación y sesión

### Implementado y cubierto

- Existen tres modos explícitos: `legacy`, `bridge` y `required`.
- `bridge` migra una cuenta al iniciar sesión y exige una fecha límite de hasta
  30 días; `required` acepta únicamente una identidad Supabase enlazada.
- La creación, edición, desactivación y eliminación de cuentas sincroniza su
  ciclo de vida con Supabase Auth.
- Los tokens de acceso y renovación viven en cookies HttpOnly. El cierre de
  sesión revoca la sesión Supabase actual y elimina las cuatro cookies.
- En modos Supabase, cada solicitud valida el access token con `auth.getUser`,
  resuelve la cuenta vigente mediante `auth_user_id` y compara estado, correo e
  identificador de aplicación.
- `SUPER_ADMIN` y `ADMIN` no reciben sesión CRM hasta completar TOTP/AAL2.
- `/api/auth/me` renueva con refresh token y vuelve a aplicar estado, rol y MFA.
- `proxy.ts` limita navegación por rol; las APIs siguen siendo la autoridad.
- Una prueba de inventario falla si aparece un método de API nuevo sin una
  comprobación de sesión o una excepción pública documentada.
- El contador de intentos fallidos usa una función SQL atómica.

### Pendiente operacional o funcional

- Si `SUPABASE_AUTH_MODE` no está configurada, el sistema conserva `legacy`.
  Staging debe probar `bridge`, fijar su fecha límite y luego avanzar a
  `required`.
- `jwt_expiry = 900`, alta pública cerrada, email login y TOTP están versionados
  en `supabase/config.toml`, pero deben replicarse y comprobarse en el proyecto
  administrado.
- No se encontró un recorrido de autoservicio para recuperación de contraseña.
- El bloqueo contra contraseñas conocidas sigue pendiente de configuración o de
  una alternativa documentada.
- Deben confirmarse dos cuentas `SUPER_ADMIN` independientes y recuperables.

## Supabase y reglas de datos

Supabase sigue siendo una elección adecuada para PostgreSQL, Auth, Storage,
respaldo administrado y reglas por fila. El diseño actual usa `service_role`
solo en servidor; esa credencial omite RLS, por lo que las APIs validan rol y
propiedad antes de consultar o mutar.

La cadena local ahora es reproducible: CI ejecuta las ocho migraciones dos veces
desde cero. La primera capa cierra tablas, vistas, secuencias, funciones,
Realtime y los buckets privados para `anon`/`authenticated`. La segunda vuelve
a abrir únicamente `SELECT` directo para usuarios autenticados en cuatro
dominios:

| Rol | Leads | Documentos | Tareas | Comisiones |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` / `ADMIN` | todos con AAL2 | todos con AAL2 | todas con AAL2 | todas con AAL2 |
| `EJECUTIVO` | todos | todos | todas | ninguna |
| `AGENTE` | cartera asignada | cartera asignada | asignadas | ninguna |
| `CLIENTE` | su ficha por cuenta | documentos de su ficha | ninguna | ninguna |

Las escrituras permanecen detrás de las APIs. Las 61 aserciones pgTAP y el
ensayo CI con cinco roles comprueban la estructura y la Data API local. Nada de
esto demuestra que el SQL ya esté aplicado remotamente: primero debe ejecutarse
en staging vacío, comparar la deriva sin datos y repetir la matriz.

Referencias operativas: `docs/supabase-migrations.md` y
`docs/supabase-hardening.md`.

## Persistencia y reglas de negocio

La interfaz ya no confirma como guardados leads, actividades o mensajes antes
de recibir el objeto persistido. Un fallo conserva el formulario o el estado
confirmado y se comunica a la persona. También se retiraron métricas, actividad
“en vivo”, estados de integración y controles de chat que no tenían operación
real.

Las reglas con efecto económico u operacional tienen pruebas dedicadas:

- transiciones permitidas y bloqueadas del pipeline;
- cálculo y edición controlada de comisiones;
- completitud, estado inicial, solicitud y carga única de documentos;
- creación y edición controlada de solicitudes;
- origen persistido de recompensas de referidos.

La página de integraciones muestra solo inventario persistido y es de solo
lectura. Las tasas CMF fijas fueron eliminadas: hasta implementar una consulta
autenticada y trazable a la fuente oficial, los endpoints responden
`503`/`SIN_DATOS`. No se debe reintroducir una cifra financiera escrita en el
código para llenar esa pantalla.

## API y entradas

Hay 68 rutas API. La regresión de cobertura de sesión inventaría sus métodos y
obliga a declarar cada excepción pública. Las rutas sensibles comprobadas
aplican rol, propiedad o participación además de la existencia de sesión.

Quedan 38 archivos que llaman directamente a `await request.json()`. Este
conteo no implica 38 defectos: varias rutas ya validan el objeto después de
leerlo. Sí indica que aún no existe una política homogénea de límite de bytes,
tipo de contenido, campos desconocidos y respuesta de error.

Orden recomendado para completar esa estandarización:

1. dinero y administración: comisiones, bancos e integraciones;
2. automatización: plantillas, flujos y triggers;
3. comunicaciones: email, WhatsApp, mensajes y conversaciones;
4. operación: leads, documentos, solicitudes, tareas y eventos.

## Respaldos y recuperación

El respaldo interno histórico sigue siendo parcial y vive en el mismo proyecto.
No debe considerarse recuperación ante pérdida del proyecto.

El repositorio sí incluye una alternativa externa:

- `.github/workflows/external-backup.yml` exporta roles, esquema, datos y
  objetos privados, verifica hashes y cifra con Restic hacia Cloudflare R2;
- mantiene 48 horarios, 14 diarios, 8 semanales y 12 mensuales;
- `.github/workflows/restore-drill.yml` exige un staging protegido y vacío,
  restaura todo y mide un RTO máximo de cuatro horas.

Ambos workflows están desactivados por defecto. Hasta configurar sus variables,
ejecutar el primer snapshot y completar una restauración real, el RPO de una
hora y el RTO de cuatro horas son objetivos, no resultados observados.

## Rendimiento

El build actual contiene 3,091 MiB de JavaScript en 79 chunks estáticos. Para
`/simulador-publico`:

| Componente sin comprimir | Tamaño | Archivos |
| --- | ---: | ---: |
| Código atribuible a la ruta | 108.323 bytes · 105,8 KiB | 4 |
| Runtime compartido Next/React | 438.980 bytes · 428,7 KiB | 5 |
| Total declarado para la ruta | 547.303 bytes · 534,5 KiB | 9 |

La regresión de 400 KiB mide solo código atribuible a la ruta; no carga Recharts
y pasa con margen. El runtime compartido se documenta, pero no se imputa a cada
página.

Persisten cinco pollers de datos: chat cada 5 segundos y leads, notificaciones,
tareas y actividades cada 30 segundos. Además existen mantenimiento de sesión
y relojes de interfaz. Esto no rompe la suite, pero eleva consultas, renderizados
y ruido operacional; debe medirse en staging antes de elegir caché coordinada,
eventos o Realtime con políticas probadas.

## Mantenibilidad

- Las páginas de cliente, pipeline, clientes, documentos y detalle de lead
  tienen 1.655, 1.196, 1.089, 985 y 849 líneas respectivamente.
- `src/componentes` contiene dominios y `src/components` UI genérica; la
  convención es entendible, pero fácil de incumplir.
- `src/datos/conversaciones-mock.ts` todavía alberga datasets ficticios y
  utilidades reales importadas por avatar y mensaje. Conviene separar las
  utilidades y retirar datos muertos.
- `crm-webhook-plugin.php`, dos logs de desarrollo y cuatro resultados de lint
  siguen versionados en la raíz.
- `prisma/` conserva SQL histórico, aunque su instalador se detiene; la fuente
  canónica operativa debe seguir siendo `supabase/migrations/`.

Los refactors deben hacerse por dominio, con pruebas antes de dividir páginas;
no mediante un renombre masivo simultáneo.

## Prioridades obligatorias

### P0 · antes de declarar el sistema operativo

1. Preparar un proyecto Supabase de staging sin datos reales.
2. Confirmar respaldo administrado/PITR, activar R2 y completar el ensayo de
   restauración dentro del RTO.
3. Comparar deriva sin datos, aplicar las ocho migraciones en staging y repetir
   pgTAP, Auth, MFA, RLS, buckets y Data API.
4. Configurar `bridge` con fecha límite, correo transaccional y TOTP; verificar
   dos `SUPER_ADMIN`; luego ensayar `required`.
5. Rotar secretos en sus gestores autorizados y comprobar revocación, cambio de
   rol y recuperación de contraseña.
6. Ejecutar smoke de navegador con los cinco roles y datos sintéticos: login,
   panel, cartera, pipeline, documentos, solicitudes, comisiones, mensajes y
   cierre de sesión.
7. Avanzar a producción solo con el mismo commit, respaldo comprobado, ventana
   de cambio, responsable y plan de reversión.

### P1 · siguiente ciclo de ingeniería

1. Implementar recuperación de contraseña y la política de contraseñas
   conocidas.
2. Conectar la API oficial CMF con clave, fecha, trazabilidad y manejo cerrado
   de indisponibilidad, o mantener las tasas ocultas.
3. Estandarizar los 38 cuerpos JSON restantes con límites y esquemas estrictos.
4. Reemplazar polling duplicado después de medir consultas y definir políticas
   para cualquier canal en tiempo real.
5. Añadir recorridos E2E de navegador y monitoreo de errores sin datos
   personales.

### P2 · mantenibilidad

1. Dividir páginas mayores de 700 líneas por dominio.
2. Separar utilidades de datasets ficticios y retirar código muerto.
3. Consolidar carpetas, tipos y fuente canónica de SQL.
4. Mover el plugin WordPress y retirar artefactos generados de la raíz.

## Conclusión

El núcleo bajo prueba está verde y las correcciones recientes eliminan varias
fuentes de estado ficticio. Supabase es una base razonable y el diseño preparado
de Auth, MFA y RLS mejora sustancialmente la situación anterior. La brecha
principal ya no es lint ni ausencia de pruebas: es convertir la preparación
local en evidencia operacional de staging, respaldo restaurable y acceso real
por rol. Hasta cerrar ese P0, el veredicto responsable es **código preparado,
producción aún no certificada**.
