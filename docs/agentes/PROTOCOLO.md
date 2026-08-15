# Protocolo de trabajo en paralelo — Claude + Codex

Dos agentes trabajan sobre este repositorio al mismo tiempo. Este archivo es el
contrato entre ambos. **Léelo completo antes de tocar un archivo.**

Si algo de tu tarea contradice este documento, gana este documento. Si necesitas
salirte de él, detente y escríbelo en tu bitácora — no improvises.

---

## 1. Reparto de roles

El reparto es por **capacidad**, no por módulo.

| | CODEX | CLAUDE |
|---|---|---|
| Fuerte en | encontrar bugs | lógica y refactor |
| Escribe en | pruebas, CI, hallazgos | código fuente, SQL |
| Su trabajo produce | una prueba que falla | esa prueba en verde |

**Codex ataca, Claude arregla.** Codex busca el fallo, escribe la prueba que lo
demuestra y la deja fallando. Claude lee la cola de hallazgos, corrige el código
fuente y la prueba pasa a verde.

Esto hace la partición disjunta por construcción: **Codex nunca escribe en
`src/`, Claude nunca escribe en `tests/`.** No hay forma de que choquen.

---

## 2bis. MODO LOCAL — vigente ahora

Los dos agentes comparten **un solo working tree**: el mismo clon, el mismo
directorio. Y `git push` devuelve 403 porque `Godblessdiego` tiene lectura pero
no escritura sobre `sitiosdigitales-cl/tuhuipotecafacil-crm2026`. `origin/diego`
no existe y no puede crearse sin ese permiso.

Mientras dure esta situación:

1. **El paso `git pull --rebase origin diego` es un no-op. Sáltalo.** Estaba
   pensado para dos agentes en clones distintos. En un árbol compartido ya se
   ven los commits del otro al instante: no hay nada que sincronizar y el
   comando falla con `couldn't find remote ref diego`.
2. **`git push` también se salta.** Los commits se acumulan locales y se suben
   en un solo lote cuando se resuelva el acceso. Nada se pierde.
3. **Ningún bloqueo de push justifica detener una tarea local.** Si tu tarea no
   necesita código del otro agente, se hace igual y se commitea.

### Prohibido en árbol compartido

Estos comandos operan sobre todo el directorio y pisan el trabajo sin commitear
del otro agente, aunque los archivos sean de zonas distintas:

```
git stash          ← esconde los cambios del otro
git checkout .     ← los descarta
git clean          ← borra sus archivos nuevos
git add -A / .     ← los incluye en tu commit
git reset --hard   ← los destruye
```

Para comparar lint antes y después de un cambio, usa `git diff` o revisa el
archivo commiteado con `git show HEAD:<ruta>`. Nunca `stash`.

> Esto ya pasó: durante la Fase 1, Claude usó `git stash` dos veces para
> comparar errores de eslint. Si Codex hubiera tenido cambios sin commitear en
> ese momento, se habrían escondido sin aviso.

### Builds

`npm run build` escribe en `.next/`, que es único para el directorio. Dos builds
simultáneos se pisan y producen fallos que no corresponden al código.

Antes de compilar, anota `[build] ocupado` en tu bitácora, y `[build] libre` al
terminar. Si ves la marca del otro agente, espera. Es tosco, pero es el
mecanismo más simple que funciona sin coordinación en tiempo real.

### Commitea seguido

En árbol compartido, el trabajo sin commitear es el único que corre riesgo.
Commitea apenas una tarea esté verificada; no acumules cambios en el working
tree.

---

## 2. Rama y sincronización

> Esta sección describe el modo con remoto. Mientras rija el **modo local**
> (sección 2bis), los pasos de `pull` y `push` no aplican.

- Rama única de trabajo: **`diego`**. Nadie hace push a `master`.
- Nadie usa `git push --force`, ni `reset --hard` sobre commits pusheados, ni
  reescribe historia de ninguna forma.
- Antes de **cada** push: `git pull --rebase origin diego`.

Si aparece un conflicto de rebase, **alguien invadió territorio ajeno**. No lo
resuelvas a mano: detente, anótalo en tu bitácora y avisa.

### Identidad de los commits

Ya está configurada correctamente y **ningún agente debe modificarla**:

```
user.name   Diego Figueroa
user.email  diego.figueroa@tuta.com
```

**Prohibido agregar `Co-Authored-By` en los mensajes de commit.** Ni de Claude,
ni de Codex, ni de ninguna herramienta. El autor es Diego y punto.

---

## 3. Propiedad de archivos

Cada agente **solo escribe** en su columna. Leer todo el repositorio está
permitido y es necesario para hacer bien el trabajo.

### Zona de CODEX

```
tests/**
.github/**
docs/hallazgos/**
docs/agentes/codex.md
vitest.config.ts
```

### Zona de CLAUDE

```
src/**
supabase/**
prisma/**
wordpress/**
docs/agentes/claude.md
```

### Zona CONGELADA — se descongela por fase, con aviso en bitácora

```
package.json          package-lock.json
next.config.ts        vercel.json         tsconfig.json
eslint.config.mjs     postcss.config.mjs
AGENTS.md             CLAUDE.md           README.md
docs/agentes/PROTOCOLO.md
```

`package.json` lo descongela **solo Codex** en la Fase 0, para instalar el
runner de pruebas. Después vuelve a congelarse.

Si necesitas algo fuera de tu zona: **no lo toques**. Anótalo, termina el resto,
sigue con la siguiente tarea.

---

## 4. Cola de hallazgos

Codex no arregla lo que encuentra. Lo documenta y lo prueba.

Un archivo por hallazgo en `docs/hallazgos/`, nombrado `<ID>.md`. **Un archivo
por hallazgo, nunca uno compartido** — así dos hallazgos simultáneos no
producen conflicto.

```markdown
# BUG-014 · El portal acepta RUT parcial

Severidad: crítico
Archivo: src/componentes/portal/PortalClienteContent.tsx:147-150
Prueba: tests/portal/busqueda-rut.test.ts

## Cómo reproducirlo
Escribir "123456" en el buscador del portal devuelve la ficha completa
del primer lead cuyo RUT contenga esa secuencia.

## Qué debería pasar
Coincidencia exacta de RUT normalizado, o ningún resultado.

## Estado
- [x] prueba escrita y fallando
- [ ] corregido por Claude
```

Claude marca la segunda casilla en el mismo archivo cuando la prueba queda en
verde, y referencia el ID en su commit. Ese archivo es el único que ambos
escriben, y solo en momentos distintos: Codex al crearlo, Claude al cerrarlo.

---

## 5. Ciclo de trabajo

Una tarea a la vez. En este orden exacto:

1. `git pull --rebase origin diego`
2. El cambio, **solo en archivos de tu zona**
3. `npm run build` — si falla, **no se commitea**
4. `npm test` — no debe romper pruebas que estaban en verde
5. `npx eslint <archivos tocados>` — sin errores nuevos
6. `git add <archivos específicos>` — nunca `git add -A` ni `git add .`
7. `git commit` con el formato de la sección 6
8. `git pull --rebase origin diego && git push origin diego`
9. Una línea en tu bitácora

**Un commit por tarea.** No agrupes: la idea es que Diego vea el avance en vivo
y pueda revertir una tarea sin arrastrar otras.

---

## 6. Formato de commit

```
<tipo>(<zona>): <qué cambió, en imperativo>

<por qué, una o dos líneas si no es obvio>

Agente: claude | codex
Tarea: <ID>
```

Tipos: `fix`, `feat`, `refactor`, `perf`, `test`, `chore`, `docs`.
Zonas: `api`, `auth`, `db`, `ui`, `estado`, `build`, `test`, `wp`.

**Sin `Co-Authored-By`. Sin firmas de herramientas. Sin emojis.**

```
fix(api): exigir autenticación en GET /api/leads y /api/leads/[id]

Ambos devolvían la base completa con RUT, renta y Dicom a cualquier
visitante sin sesión. Cierra la prueba de tests/api/leads-auth.test.ts.

Agente: claude
Tarea: BUG-003
```

---

## 7. Menos código

El objetivo es un repositorio **más liviano**, y eso se logra **borrando**, no
comprimiendo. Escribir el mismo comportamiento en menos líneas produce código
denso que nadie puede mantener; eso no cuenta como mejora y será revertido.

**Sí cuenta:**

| Qué | Líneas |
|---|---|
| 10 módulos en `src/modulos/` sin una sola importación | ~2.500 |
| `src/lib/validaciones-pipeline.ts`, copia muerta | 149 |
| Capa fachada: `modulos/*/hooks.ts` que solo reexportan | ~200 |
| 399 clases `dark:` anuladas por `forcedTheme="light"` | ~400 |
| 3 `setInterval` + estado duplicado que el realtime ya cubre | ~120 |
| Endpoints `debug/*`, `seed`, `fix-passwords`, `fix-columns` | ~350 |
| `jwt.ts` + `api-auth.ts` + `auth/*` al migrar a Supabase Auth | ~400 |

Objetivo realista: **−4.000 líneas de 53.114**, sin perder una sola función que
alguien use.

**No cuenta como mejora:**

- Encadenar ternarios para ahorrar un `if`
- Quitar nombres intermedios que explican qué hace una expresión
- Comprimir varias sentencias en una línea
- Borrar comentarios que explican *por qué* algo es así

**Antes de borrar cualquier cosa**, verifica con un grep de importaciones y deja
el resultado en el mensaje del commit. Nunca borres código que no entiendas.

---

## 8. Regla de PHP

Vercel **no ejecuta PHP**. No existe forma de agregar PHP dentro de la
aplicación Next.js. Los dos archivos PHP que hay corren en hosts distintos:

| Archivo | Dónde corre | Veredicto |
|---|---|---|
| `crm-webhook-plugin.php` | WordPress del cliente | **Se queda.** Es el puente que captura los leads del sitio. PHP es correcto ahí. |
| `crm/email-handler.php` | cPanel, email piping | Reemplazable por correo entrante de Resend. Decisión de Diego, no de un agente. |

Reglas:

1. **Nunca** crear archivos `.php` dentro de `src/`, `app/` o `public/`.
2. El código PHP vive en `wordpress/`, separado del build de Next.js, porque se
   despliega a otra máquina. Mezclarlo con la app es parte de por qué este repo
   se volvió confuso.
3. PHP se justifica **solo** cuando el código tiene que correr dentro de
   WordPress o de cPanel. Para cualquier otra cosa hay un endpoint en
   `src/app/api/`, que además comparte tipos con el resto del sistema.

---

## 9. Reglas que no se rompen

1. **Nunca commitear secretos.** Ni `.env`, ni claves en el código.
2. **Nunca tocar los paneles de Supabase, Vercel ni WordPress.** Ver sección 11.
3. **Nunca hacer movimientos masivos de archivos** mientras el otro agente esté
   activo. Eso es la Fase 5 y tiene regla propia.
4. **No arregles lo que no te tocó.** Si ves un bug fuera de tu tarea: Codex lo
   documenta en `docs/hallazgos/`, Claude lo anota en su bitácora. Arreglarlo de
   pasada genera diffs que nadie pidió y rompe la trazabilidad.
5. **Si el build ya está roto cuando llegas**, no empieces. Anótalo y detente.

---

## 10. Fases

Secuenciales. No empieces una fase hasta que la anterior esté cerrada.

### FASE 0 — Desbloqueo

Hoy `npm run build` falla en limpio y no hay runner de pruebas. Sin esto nadie
puede verificar nada.

| Agente | ID | Tarea |
|---|---|---|
| Claude | B-01 | Mover el `createClient` de `src/app/api/webhook/leads/route.ts` dentro de la función. Hoy se evalúa en el módulo y revienta el build sin variables de entorno. |
| Claude | B-02 | Revisar el resto de `src/app/api/**` por el mismo patrón |
| Codex | T-01 | Instalar Vitest, `npm test`, y un primer test de humo. Descongela `package.json` solo para esto. |
| Codex | T-02 | GitHub Actions: `lint`, `typecheck`, `build`, `test` en cada push a `diego` |

**Cierre:** `npm run build` termina en 0 sin variables de entorno, `npm test`
corre, y el CI está en verde.

---

### FASE 1 — Seguridad

#### CODEX — cazar

| ID | Tarea |
|---|---|
| C-01 | Barrer los 105 endpoints de `src/app/api/**`: para cada uno, qué método, qué auth exige, qué devuelve sin sesión. Un hallazgo por cada uno que exponga datos. |
| C-02 | Prueba que arranca la app sin sesión, llama a `/api/leads`, `/api/leads/[id]`, `/api/usuarios`, `/api/actividades` y **exige 401** |
| C-03 | Prueba de la búsqueda del portal: un RUT parcial no puede devolver la ficha de otra persona |
| C-04 | Prueba de aislamiento: un vendedor no puede leer ni modificar leads de otro vendedor |
| C-05 | Verificar que los 16 archivos SQL de `prisma/` y `supabase/` corren sin error contra una base limpia. Hay al menos uno con SQL inválido. |
| C-06 | Buscar bugs que la auditoría no encontró. Zonas sin revisar a fondo: `/api/upload`, `/api/documentos`, `/api/comisiones`, `/api/flujos`, `/api/triggers`. |

#### CLAUDE — arreglar

| ID | Tarea | Archivo |
|---|---|---|
| SEC-01 | `requireAuth` en `GET /api/leads` y `/api/leads/[id]` | `src/app/api/leads/` |
| SEC-02 | `requireAuth` en `GET /api/usuarios` | `src/app/api/usuarios/route.ts` |
| SEC-03 | Borrar `debug/*`, `seed`, `fix-passwords`, `fix-columns`, `admin/fix-storage` | `src/app/api/` |
| SEC-04 | `JWT_SECRET` obligatorio: error al arrancar si falta. Eliminar `"fallback-secret"` | `src/lib/jwt.ts` |
| SEC-05 | Secreto del webhook obligatorio, no opcional | `src/app/api/webhook/leads/route.ts` |
| SEC-06 | Límite de intentos en login, con `intentosfallidos` y `suspendidohasta` | `src/app/api/auth/login/route.ts` |
| SEC-07 | Aislamiento por vendedor en todos los listados, según rol | `src/app/api/**` |
| SQL-01 | `ENABLE ROW LEVEL SECURITY` en vez de la instrucción inventada | `supabase/migrations/create_notificaciones_table.sql:21` |
| SQL-02 | Unificar tipos de clave: `notificaciones` usa UUID, `usuarios`/`leads` usan TEXT | `supabase/migrations/` |

> **SEC-07 va al final, en su propio commit.** Cambia qué ve cada persona del
> equipo. Describe en el mensaje exactamente qué ve cada rol. Si la regla para
> `GERENTE` o `ADMIN` no está clara en el código, no la inventes: márcala como
> bloqueada y pregunta.

**Cierre:** las pruebas C-02, C-03 y C-04 en verde.

---

### FASE 2 — Rendimiento

#### CLAUDE — refactor

| ID | Tarea | Archivo |
|---|---|---|
| PERF-01 | Envolver los 5 usos de Recharts en `next/dynamic` con `ssr: false`. Son 1,86 MB repartidos en 11 chunks, el 39% del bundle. | `(dashboard)/reportes`, `resumen`, `simulador`, `usuarios/[id]`, `simulador-publico`, `componentes/dashboard/*` |
| PERF-02 | `useMemo` en el `value` de los 5 contextos, `useCallback` en sus funciones. Hoy son objetos literales nuevos en cada render y `useLeads()` lo consumen 25 componentes. | `src/lib/contexts/**` |
| PERF-03 | Bajar `<Providers>` del layout raíz al del dashboard. Las públicas se quedan con `ThemeProvider` y `Toaster`. **Depende de PERF-02.** | `src/app/layout.tsx`, `providers.tsx`, `(dashboard)/layout.tsx` |
| PERF-04 | Eliminar los 3 `setInterval` de 30 s; el canal realtime ya cubre eso | `LeadContext.tsx:55`, `NotificationContext.tsx:96`, `useTareaCount.ts:25` |
| PERF-05 | Paginar `GET /api/leads` y `/api/clientes` | `src/app/api/` |

#### CODEX — medir y vigilar

| ID | Tarea |
|---|---|
| C-07 | Registrar el bundle antes y después de cada PERF. Línea base medida: 4,8 MB de JS, 79 archivos, 1,86 MB de Recharts. |
| C-08 | Prueba que falla si el bundle de una ruta pública supera 400 KB |
| C-09 | Verificar que quitar los `setInterval` no deja datos desactualizados: prueba de que el realtime propaga un cambio |
| C-10 | Cazar regresiones visuales o de comportamiento introducidas por PERF-01 a PERF-05 |

---

### FASE 3 — Poda

Se descongela `src/modulos/**`. Objetivo de la sección 7: −4.000 líneas.

| Agente | ID | Tarea |
|---|---|---|
| Codex | C-11 | Antes de borrar: grep de importaciones de los 10 módulos candidatos y confirmar que están muertos. Publicar el resultado en `docs/hallazgos/`. |
| Claude | DEL-01 | Borrar los 10 módulos sin importaciones |
| Claude | DEL-02 | Borrar `src/lib/validaciones-pipeline.ts` (la viva es la de `modulos/leads/`) |
| Claude | DEL-03 | Sacar del repo `setup-bancos.js`, `lint-*.json`, `lint-*.txt`, `eslint-fixable.json`, `dev-output*.log` — unos 8 MB |
| Claude | DEL-04 | Mover `crm-webhook-plugin.php` y `crm/` a `wordpress/`. Limpiar el README de las 11 líneas de `# redeploy <timestamp>`. |
| Claude | DEL-05 | Resolver el modo oscuro: quitar `forcedTheme` y revisar las 399 clases, **o** borrar las clases y el botón de la paleta. Hoy el botón existe y no hace nada. |
| Claude | DEL-06 | Quitar Capacitor y consolidar los 3 SDKs de IA en uno |
| Codex | C-12 | Después de cada borrado: build, test y barrido de imports rotos |

---

### FASE 4 — Supabase Auth

| Agente | ID | Tarea |
|---|---|---|
| Codex | C-13 | Pruebas del flujo de sesión actual, para tener con qué comparar |
| Claude | AUTH-01 | Migrar a Supabase Auth. Elimina `jwt.ts`, `api-auth.ts`, `auth/login`, `switch-user`, `fix-passwords`. |
| Claude | AUTH-02 | RLS real: en `leads`, política por `asignadoa = auth.uid()`; administración ve todo. Repetir en documentos, tareas, comisiones. |
| Codex | C-14 | Verificar que RLS bloquea de verdad, atacando con la anon key directo a Supabase sin pasar por la app |

---

### FASE 5 — Reordenar · Claude solo, Codex detenido

Un barrido de renombres no se puede partir entre dos agentes.

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

supabase/migrations/       esquema versionado (reemplaza prisma/)
wordpress/                 plugin y scripts PHP, otro host
docs/                      toda la documentación .md
app/(publico)/             formulario-leads y gracias como rutas reales
```

Se quedan en la raíz porque las herramientas las leen ahí: `AGENTS.md`,
`CLAUDE.md`, `README.md`.

Un commit por dominio movido, build en verde entre cada uno, y `git mv` para
que el historial siga a los archivos.

---

## 11. Tareas que ningún agente puede hacer

Requieren una persona con acceso a los paneles. No las intentes ni las des por
hechas:

- Rotar la anon key y la service role key de Supabase
- Pasar el bucket `documentos` a privado y borrar las políticas
  «Anyone can upload/delete documents»
- Ejecutar las migraciones SQL contra la base de producción
- Bajar `/portal-cliente` de producción mientras se arregla
- Configurar variables de entorno en Vercel
- Instalar o actualizar el plugin en el WordPress del cliente

Los agentes preparan el código y el SQL. La ejecución en producción es humana.

---

## 12. Bitácoras

Cada agente escribe **solo** en su archivo, nunca en el del otro:

- `docs/agentes/claude.md`
- `docs/agentes/codex.md`

```
[FASE 1 · SEC-01] hecho — requireAuth en GET /api/leads. Build verde. abc1234
[FASE 1 · SEC-07] BLOQUEADO — falta definir qué ve el rol GERENTE.
[nota] /api/upload no valida tipo de archivo. Fuera de mi tarea, anotado.
```
