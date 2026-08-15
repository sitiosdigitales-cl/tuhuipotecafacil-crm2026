# Protocolo de trabajo en paralelo — Claude + Codex

Dos agentes trabajan sobre este repositorio al mismo tiempo. Este archivo es el
contrato entre ambos. **Léelo completo antes de tocar un archivo.**

Si algo de tu tarea contradice este documento, gana este documento. Si necesitas
salirte de él, detente y escríbelo en tu bitácora — no improvises.

---

## 1. Rama y sincronización

- Rama única de trabajo: **`diego`**. Nadie hace push a `master`.
- Nadie usa `git push --force`, `git rebase -i`, `git reset --hard` sobre commits
  ya pusheados, ni reescribe historia de ninguna forma.
- Antes de **cada** push: `git pull --rebase origin diego`.

Como los dos agentes escriben en conjuntos de archivos disjuntos (sección 2),
el rebase no debería producir conflictos nunca. **Si aparece un conflicto,
significa que alguien invadió territorio ajeno**: detente, no lo resuelvas a
mano, déjalo escrito en tu bitácora y avisa.

---

## 2. Propiedad de archivos

Cada agente **solo puede escribir** en las rutas de su columna. Leer todo el
repositorio está permitido y es recomendable; escribir fuera de tu zona no.

### Zona de CLAUDE — backend, datos, seguridad

```
src/app/api/**
src/middleware.ts
src/lib/supabase.ts
src/lib/jwt.ts
src/lib/api-auth.ts
src/lib/email.ts
src/lib/whatsapp.ts
src/lib/notificaciones.ts
src/lib/dispatcher-notificaciones.ts
src/lib/eventos-notificaciones.ts
src/lib/services/**
src/lib/cmf/**
supabase/**
prisma/**
docs/agentes/claude.md
```

### Zona de CODEX — interfaz, estado de cliente, rendimiento

```
src/app/(dashboard)/**
src/app/(auth)/**
src/app/portal-cliente/**
src/app/simulador-publico/**
src/app/referir/**
src/app/page.tsx
src/app/layout.tsx
src/app/providers.tsx
src/app/globals.css
src/componentes/**
src/components/**
src/lib/contexts/**
src/lib/hooks/**
src/lib/utils.ts
docs/agentes/codex.md
```

### Zona CONGELADA — nadie escribe sin anunciarlo primero

```
package.json          package-lock.json
next.config.ts        vercel.json         tsconfig.json
eslint.config.mjs     postcss.config.mjs
src/tipos/**
src/modulos/**
AGENTS.md             CLAUDE.md           README.md
docs/agentes/PROTOCOLO.md
```

Si tu tarea necesita tocar un archivo congelado o de la zona del otro:
**no lo toques**. Escribe en tu bitácora qué necesitas y por qué, termina el
resto de tu tarea, y sigue con la siguiente.

---

## 3. Ciclo de trabajo

Una tarea a la vez. Por cada tarea, en este orden exacto:

1. `git pull --rebase origin diego`
2. Hacer el cambio, **solo en archivos de tu zona**
3. `npm run build` — **si falla, no se commitea**. Arregla o revierte.
4. `npx eslint <archivos que tocaste>` — no debe introducir errores nuevos
5. `git add <archivos específicos>` — nunca `git add -A` ni `git add .`
6. `git commit` con el formato de la sección 4
7. `git pull --rebase origin diego`
8. `git push origin diego`
9. Anotar una línea en tu bitácora (`docs/agentes/<tu-nombre>.md`)

**Un commit por tarea.** No agrupes. El objetivo es que Diego pueda ver el
avance en tiempo real y revertir una tarea sin arrastrar otras.

---

## 4. Formato de commit

```
<tipo>(<zona>): <qué cambió, en imperativo>

<por qué, si no es obvio — una o dos líneas>

Agente: claude | codex
Tarea: <ID de la sección 6, ej. SEC-01>
```

Tipos: `fix`, `feat`, `refactor`, `perf`, `chore`, `docs`.
Zonas: `api`, `auth`, `db`, `ui`, `estado`, `build`.

Ejemplo:

```
fix(api): exigir autenticación en GET /api/leads y /api/leads/[id]

Ambos endpoints devolvían la base completa de leads con RUT, renta y
Dicom a cualquier visitante sin sesión.

Agente: claude
Tarea: SEC-01
```

---

## 5. Reglas que no se rompen

1. **Nunca commitear secretos.** Ni `.env`, ni `.env.local`, ni claves en el
   código. Si necesitas variables para probar, créalas y bórralas antes del
   commit.
2. **Nunca rotar claves ni tocar el panel de Supabase o Vercel.** Eso lo hace
   una persona. Si tu tarea lo requiere, márcala como bloqueada.
3. **Nunca hacer movimientos masivos de archivos** (`git mv` en lote, renombrar
   carpetas, mover imports en bloque) mientras el otro agente esté activo.
   Eso es la Fase 4 y tiene su propia regla.
4. **Nunca borrar código que no entiendas.** Si parece muerto, verifícalo con
   un grep de importaciones y déjalo escrito en el commit.
5. **No arregles lo que no te tocó.** Si ves un bug fuera de tu tarea, anótalo
   en tu bitácora. No lo arregles de pasada: eso genera diffs que nadie pidió
   y rompe la trazabilidad.
6. **Si el build ya está roto cuando llegas**, no empieces. Alguien pusheó algo
   malo. Anótalo y detente.

---

## 6. Fases y tareas

Las fases son secuenciales. **No empieces una fase hasta que la anterior esté
cerrada.** Dentro de una fase, los dos agentes trabajan en paralelo.

### FASE 0 — Desbloqueo · solo CLAUDE, Codex espera

Sin esto nadie puede verificar nada, porque `npm run build` falla en limpio.

| ID | Tarea | Archivo |
|----|-------|---------|
| B-01 | Mover el `createClient` fuera del ámbito de módulo, dentro de la función | `src/app/api/webhook/leads/route.ts` |
| B-02 | Revisar el resto de rutas por el mismo patrón | `src/app/api/**` |

Cierre de fase: `npm run build` termina con código 0 sin ninguna variable de
entorno definida.

---

### FASE 1 — Seguridad y rendimiento · los dos en paralelo

#### CLAUDE — cerrar la filtración de datos

| ID | Tarea | Archivo |
|----|-------|---------|
| SEC-01 | `requireAuth` en `GET /api/leads` y `GET /api/leads/[id]` | `src/app/api/leads/` |
| SEC-02 | `requireAuth` en `GET /api/usuarios` | `src/app/api/usuarios/route.ts` |
| SEC-03 | Borrar `debug/*`, `seed`, `fix-passwords`, `fix-columns`, `admin/fix-storage` | `src/app/api/` |
| SEC-04 | `JWT_SECRET` obligatorio: lanzar error al arrancar si falta. Eliminar `"fallback-secret"` | `src/lib/jwt.ts` |
| SEC-05 | Secreto del webhook obligatorio, no opcional | `src/app/api/webhook/leads/route.ts` |
| SEC-06 | Límite de intentos en login, usando `intentosfallidos` y `suspendidohasta` | `src/app/api/auth/login/route.ts` |
| SEC-07 | Filtrar por usuario autenticado en listados (leads, tareas, documentos, comisiones) según rol | `src/app/api/**` |
| SQL-01 | `ENABLE ROW LEVEL SECURITY` en vez de la instrucción inventada | `supabase/migrations/create_notificaciones_table.sql:21` |
| SQL-02 | Unificar tipos de clave: `notificaciones.usuarioid`/`leadid` son UUID, `usuarios.id`/`leads.id` son TEXT | `supabase/migrations/` |

> **SEC-07 es la más delicada de todas.** Cambia qué ve cada vendedor.
> Hazla al final de tu fase, en su propio commit, y describe en el mensaje
> exactamente qué rol ve qué.

#### CODEX — bajar el peso y cortar el redibujo

| ID | Tarea | Archivo |
|----|-------|---------|
| PERF-01 | Envolver los 5 usos de Recharts en `next/dynamic` con `ssr: false` y un placeholder | `(dashboard)/reportes`, `resumen`, `simulador`, `usuarios/[id]`, `simulador-publico`, `componentes/dashboard/*` |
| PERF-02 | `useMemo` en el `value` de los 5 contextos y `useCallback` en sus funciones | `src/lib/contexts/**` |
| PERF-03 | Bajar `<Providers>` del layout raíz al layout del dashboard. Las páginas públicas se quedan solo con `ThemeProvider` y `Toaster` | `src/app/layout.tsx`, `src/app/providers.tsx`, `src/app/(dashboard)/layout.tsx` |
| PERF-04 | Eliminar los tres `setInterval` de 30 s; dejar el canal realtime como única sincronización | `LeadContext.tsx:55`, `NotificationContext.tsx:96`, `useTareaCount.ts:25` |
| UI-01 | Búsqueda del portal: exigir RUT exacto, eliminar el `.includes()` parcial | `src/componentes/portal/PortalClienteContent.tsx:147-150` |
| UI-02 | Decidir el modo oscuro: quitar `forcedTheme` y revisar las 399 clases `dark:`, **o** borrar las clases y el botón de la paleta. Hoy el botón existe y no hace nada | `src/app/providers.tsx:13`, `src/components/ui/command-palette.tsx:53` |

> **PERF-03 depende de PERF-02.** Si mueves los providers antes de memoizarlos,
> vas a estar depurando dos cambios entrelazados. Respeta el orden.

Cierre de fase: build en verde, `/portal-cliente` sin sesión **no** dispara
`/api/leads`, `/api/usuarios` ni `/api/actividades`.

---

### FASE 2 — Red de seguridad · solo CLAUDE

| ID | Tarea |
|----|-------|
| CI-01 | GitHub Actions: `lint`, `typecheck` y `build` en cada push a `diego` |
| CI-02 | Extraer el esquema real de Supabase a migraciones versionadas en `supabase/migrations/` |
| CI-03 | Pruebas de los tres flujos con dinero: transiciones del pipeline, cálculo de comisiones, checklist de documentos |

Requiere descongelar `package.json`. Anúncialo antes.

---

### FASE 3 — Poda · un agente a la vez

Se descongela `src/modulos/**`. **El otro agente se detiene durante esta fase.**

| ID | Tarea |
|----|-------|
| DEL-01 | Borrar los 10 módulos sin importaciones: `actividad`, `comisiones`, `comunicaciones`, `configuracion`, `marketing`, `mortgage-ai`, `permisos`, `reportes`, `solicitudes`, `workflows` |
| DEL-02 | Borrar `src/lib/validaciones-pipeline.ts` (copia muerta; la viva es `src/modulos/leads/validaciones-pipeline.ts`) |
| DEL-03 | Sacar del repo `crm/*.php`, `crm-webhook-plugin.php`, `setup-bancos.js`, `lint-*.json`, `lint-*.txt`, `eslint-fixable.json`, `dev-output*.log` |
| DEL-04 | Limpiar el README de las 11 líneas de `# redeploy <timestamp>` |
| DEL-05 | Quitar Capacitor y consolidar los tres SDKs de IA en uno |

Verificar cada borrado con un grep de importaciones **antes** de borrar, y
dejar el resultado del grep en el mensaje del commit.

---

### FASE 4 — Reordenar · un agente solo, el otro detenido

Un barrido de renombres no se puede partir entre dos agentes. Esta fase la
hace uno solo, de corrido, y termina con el build en verde antes de que el
otro vuelva.

Estructura destino:

```
src/
├─ features/<dominio>/     leads, documentos, pipeline, tareas, usuarios
│   ├─ api.ts              acceso a datos
│   ├─ schema.ts           zod + tipos derivados
│   ├─ hooks.ts            queries y mutaciones
│   └─ ui/                 componentes del dominio
├─ ui/                     shadcn puro, sin lógica de negocio
├─ lib/                    supabase, auth, utils
└─ app/                    solo rutas y layouts

supabase/migrations/       esquema versionado (reemplaza a prisma/)
docs/                      toda la documentación .md
app/(publico)/             formulario-leads y gracias como rutas reales
```

Se quedan en la raíz porque las herramientas las leen ahí: `AGENTS.md`,
`CLAUDE.md`, `README.md`.

Reglas de la fase: un commit por dominio movido, build en verde entre cada
uno, y `git mv` para que el historial siga los archivos.

---

## 7. Bitácoras

Cada agente escribe **solo** en su archivo. Nunca en el del otro. No hay
archivo compartido de escritura, justamente para que no haya conflictos.

- `docs/agentes/claude.md`
- `docs/agentes/codex.md`

Formato de cada línea:

```
[FASE 1 · SEC-01] hecho — requireAuth en GET /api/leads. Build verde. abc1234
[FASE 1 · SEC-07] BLOQUEADO — necesita definir qué ve el rol GERENTE. Pregunta abierta.
[nota] /api/upload tampoco valida el tipo de archivo. Fuera de mi tarea, queda anotado.
```

---

## 8. Tareas que un agente NO puede hacer

Estas requieren una persona con acceso a los paneles. Ningún agente debe
intentarlas ni darlas por hechas:

- Rotar la anon key y la service role key en Supabase
- Pasar el bucket `documentos` a privado y borrar las políticas
  «Anyone can upload/delete documents»
- Ejecutar las migraciones SQL en la base de producción
- Bajar `/portal-cliente` de producción mientras se arregla
- Configurar variables de entorno en Vercel

Los agentes preparan el código y el SQL. La ejecución en producción es humana.
