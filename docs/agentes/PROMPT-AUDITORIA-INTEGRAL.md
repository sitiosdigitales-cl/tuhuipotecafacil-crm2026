# Prompt maestro · auditoría integral defensiva

```text
Trabaja sobre tuhuipotecafacil-crm2026, rama `diego`. Es un CRM hipotecario
propio y autorizado, con datos reales de clientes chilenos. Tu tarea es control
de calidad defensivo: encontrar comportamientos incorrectos, demostrar cada uno
con evidencia reproducible, corregir la causa y dejar la rama verificable.

CONTRATO OBLIGATORIO
1. Lee completo `docs/agentes/PROTOCOLO.md` antes de tocar archivos.
2. Lee todo `AGENTS.md` aplicable y las guías locales de Next.js 16 en
   `node_modules/next/dist/docs/` antes de modificar Next.
3. Confirma rama, árbol limpio y remoto; ejecuta `git pull --rebase origin diego`
   antes de cada tarea.
4. Nunca uses `git stash`, `git clean`, `git checkout .`, `git add -A`,
   `git add .` ni `git reset --hard`.
5. No leas ni imprimas `.env`, tokens, contraseñas, RUT, correos, teléfonos o
   documentos reales. No toques paneles de Supabase, Vercel o WordPress.
6. Usa datos sintéticos terminados en `.invalid`. No pruebes contra producción
   salvo autorización humana explícita para una ruta y un caso concreto.
7. Un defecto por tarea, prueba y commit. `git add` solo con rutas explícitas.
8. Mensaje de commit con `Agente: codex` y `Tarea: BUG-XXX`; sin
   `Co-Authored-By`, firmas de herramientas ni emojis.

LENGUAJE
Redacta como QA: “defecto”, “comportamiento incorrecto”, “la comprobación no se
aplica”, “la respuesta no corresponde al rol”, “entrada sin sanear”. Describe
siempre el comportamiento esperado y evita instrucciones de abuso.

FASE A · LÍNEA BASE REPRODUCIBLE
- Registra commit, versiones, estructura, archivos TS/TSX, líneas, rutas API,
  pruebas, migraciones y archivos mayores de 700 líneas.
- Ejecuta y guarda el resultado de:
  `npm ci`
  `npm run lint`
  `npx tsc --noEmit`
  `npm run build`
  `npm test`
  `npm audit --omit=dev --audit-level=moderate`
  `npm audit --audit-level=high`
- No arregles todavía: primero distingue fallos previos de regresiones propias.

FASE B · AUTENTICACIÓN Y SESIÓN
- Comprueba login, logout, cookie HttpOnly/Secure/SameSite, expiración, firma,
  audiencia, emisor, renovación, cuenta inactiva, cambio de rol y revocación.
- Comprueba límites y concurrencia del contador de intentos.
- Verifica proxy y API por separado; una pantalla protegida no reemplaza el
  control del endpoint.
- Genera una matriz de cada rol contra cada ruta sensible.
- Si existe service role, demuestra que solo se importa desde módulos
  `server-only` y nunca llega al bundle ni a logs.

FASE C · SUPABASE Y DATOS
- Revisa esquema, claves, tipos, índices, migraciones idempotentes y políticas.
- Distingue el modelo actual: Auth/RLS por usuario o servidor con service role.
- Verifica acceso directo con claves no administrativas solo en una base local o
  staging autorizado y sin datos reales.
- Comprueba buckets privados, MIME, tamaño, nombres, propiedad, URLs firmadas y
  eliminación del objeto junto con su registro.
- Verifica que listados y operaciones individuales apliquen el mismo alcance.
- No des por aplicada una migración solo porque existe en Git.

FASE D · REGLAS DE NEGOCIO
- Pipeline: transiciones válidas, precondiciones y etapas terminales.
- Comisiones: base, tasa, total, redondeo, estado pagado y edición consistente.
- Documentos: checklist por tipo de cliente, obligatoriedad y completitud.
- Solicitudes: propiedad, asignación, cambios de estado y documentos asociados.
- Respaldos: alcance, retención, error parcial, Storage, copia externa y restore.
- Usa casos límite chilenos con datos sintéticos: RUT válido/inválido, CLP,
  fechas y zona `America/Santiago`.

FASE E · TODAS LAS ENTRADAS Y SALIDAS
- Inventaría cada `request.json()`, `formData()`, query string, webhook y carga.
- Exige límites de tamaño, esquemas estrictos, catálogos cerrados y mensajes de
  error sin datos personales.
- Busca HTML almacenado, URLs, filtros PostgREST construidos como texto, nombres
  de archivo, redirecciones y contenido enviado a email/WhatsApp.
- Revisa logs para asegurar que no incluyan cuerpos, credenciales ni identidad.

FASE F · INTERFAZ Y REGRESIONES
- Recorre con navegador en staging: `/login`, rutas públicas, panel, portal,
  documentos y flujos con dinero.
- Prueba cada rol y navegación directa, no solo el menú.
- Detecta datos escritos a mano, cifras simuladas, botones sin API, éxito sin
  respuesta `2xx`, estados vacíos y errores ocultos.
- Comprueba teclado, foco, responsive, carga, error y doble envío.
- No declares validación visual si no hubo navegador disponible.

FASE G · ARQUITECTURA Y DEPENDENCIAS
- Localiza páginas mayores de 700 líneas, duplicación, módulos muertos y dos
  fuentes de verdad para roles, etapas o columnas.
- Revisa límites entre `app`, dominio, UI, servidor y clientes externos.
- Detecta artefactos generados, logs, PHP fuera de `wordpress/` y migraciones
  divididas entre carpetas.
- Mide bundle por ruta y confirma que las públicas no carguen dependencias del
  panel.
- No actualices dependencias mayores sin una tarea y pruebas específicas.

REGLA DE HALLAZGO Y CORRECCIÓN
Para cada comportamiento incorrecto:
1. Asigna el siguiente `BUG-XXX`.
2. Crea `docs/hallazgos/BUG-XXX.md` con severidad, archivo, prueba, reproducción,
   comportamiento esperado, corrección y estado.
3. Escribe una prueba mínima que falle por la causa real, no por texto frágil si
   es posible.
4. Corrige la causa con el menor cambio mantenible.
5. Ejecuta primero la prueba focal y después todas las compuertas.
6. Si el arreglo requiere panel, secreto o migración productiva, prepara código
   y SQL, pero deja la acción humana marcada como pendiente.
7. Marca `[build] ocupado` en `docs/agentes/codex.md` antes de build y
   `[build] libre` al terminar.
8. Commitea y ejecuta `git pull --rebase origin diego && git push origin diego`.

COMPUERTAS POR TAREA
- `npm run build`
- `npm test`
- `npx eslint <archivos tocados>`
- `npx tsc --noEmit`
- `npm audit --audit-level=high`
- `git diff --check`

ENTREGA FINAL
- No digas “todo seguro”, “cero bugs” ni “producción lista” sin evidencia.
- Separa: hallazgos históricos, correcciones de código pendientes, acciones
  humanas, decisiones de producto y deuda arquitectónica.
- Publica conteos exactos, comandos ejecutados, pruebas HTTP/visuales realmente
  hechas y límites de la revisión.
- Entrega una tabla P0/P1/P2, checklist de despliegue, plan de restauración y
  referencias a archivos con líneas.
- Si una medición contradice documentación previa, confía en el código y deja
  registrada la discrepancia.
```
