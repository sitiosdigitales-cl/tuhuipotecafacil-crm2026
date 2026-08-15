# Bitácora — Codex

Zona: interfaz, estado de cliente, rendimiento. Ver `docs/agentes/PROTOCOLO.md` sección 2.

---

[FASE 0 · T-01] reanudado — el diagnóstico de bloqueo era incorrecto: ambos
agentes comparten un único working tree y rige el modo local de la sección
2bis; pull y push se omiten mientras no exista acceso de escritura remoto.

[FASE 0 · T-01] en curso — `package.json` y `package-lock.json` descongelados
exclusivamente para instalar Vitest y habilitar `npm test`.

[build] ocupado — Codex, T-01.

[build] libre — Codex, T-01; build sin variables terminó en 0.

[FASE 0 · T-01] hecho — Vitest configurado con jsdom, aliases TypeScript y
primer test de humo; `package.json` y `package-lock.json` vuelven a congelarse.

[FASE 0 · T-02] en curso — workflow preparado con jobs separados de lint,
typecheck, build y test para cada push o pull request hacia `diego`.

[build] ocupado — Codex, T-02; validación en copia temporal aislada de HEAD.

[build] libre — Codex, T-02; la copia temporal no pudo compilar porque
Turbopack rechaza `node_modules` enlazado fuera de su raíz; no hubo build en
el working tree compartido.

[build] ocupado — Codex, T-02; validación real sobre working tree estable.

[build] libre — Codex, T-02; build, typecheck y test terminaron en 0.

[FASE 0 · T-02] hecho — CI con lint de la zona Codex, typecheck, build y test
en jobs separados para pushes y pull requests hacia `diego`.

[FASE 1 · C-01 · BUG-001] hallazgo — `GET /api/actividades` devuelve datos sin
sesión; prueba preparada para exigir 401 antes de consultar Supabase.

[build] ocupado — Codex, BUG-001.

[build] libre — Codex, BUG-001; build terminó en 0.

[FASE 1 · C-01 · BUG-002] hallazgo — `GET /api/auditoria` expone hasta 200
cambios internos sin sesión; la prueba exige 401 antes de consultar Supabase.

[build] ocupado — Codex, BUG-002.

[build] libre — Codex, BUG-002; build terminó en 0.

[FASE 1 · C-01 · BUG-003] hallazgo — la API de bancos lista, crea, modifica y
elimina registros sin sesión; cinco casos exigen 401.

[build] ocupado — Codex, BUG-003.

[build] libre — Codex, BUG-003; build terminó en 0.

[FASE 1 · C-01 · BUG-004] hallazgo — el detalle individual de usuario todavía
expone email, teléfono, rol y estado sin sesión aunque el listado ya fue cerrado.

[build] ocupado — Codex, BUG-004.

[build] libre — Codex, BUG-004; build terminó en 0.

[FASE 1 · C-01 · BUG-005] hallazgo — listado y detalle de conversaciones
exponen participantes y metadatos privados sin sesión.

[build] ocupado — Codex, BUG-005.

[build] libre — Codex, BUG-005; build terminó en 0.

[FASE 1 · C-01 · BUG-006] hallazgo — `GET /api/mensajes` devuelve el contenido
de una conversación arbitraria sin sesión.

[build] ocupado — Codex, BUG-006.

[build] libre — Codex, BUG-006; el primer intento se detuvo al detectar un
`.env` local nuevo. El build seguro repitió con valores ficticios inyectados
para sus 19 claves y terminó en 0 sin usar credenciales reales.

[FASE 1 · C-01 · BUG-007] hallazgo — `/api/notificaciones` permite listar,
marcar como leídas y borrar notificaciones sin sesión.

[build] ocupado — Codex, BUG-007.

[build] libre — Codex, BUG-007; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-008] hallazgo — el endpoint público
`/api/notificaciones/test` inserta datos con service role.

[build] ocupado — Codex, BUG-008.

[build] libre — Codex, BUG-008; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-009] hallazgo — `GET /api/documentos` expone metadatos y
URLs de archivos de clientes sin sesión.

[build] ocupado — Codex, BUG-009.

[build] libre — Codex, BUG-009; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-010] hallazgo — `GET /api/comisiones` expone montos y
asignaciones sin sesión.

[build] ocupado — Codex, BUG-010.

[build] libre — Codex, BUG-010; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-011] hallazgo — `GET /api/flujos` expone la definición
completa de automatizaciones sin sesión.

[build] ocupado — Codex, BUG-011.

[build] libre — Codex, BUG-011; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-012] hallazgo — el historial de flujos expone datos de
leads y acepta ejecuciones falsas sin sesión.

[build] ocupado — Codex, BUG-012.

[build] libre — Codex, BUG-012; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-013] hallazgo — `GET /api/triggers` expone condiciones,
acciones y configuración sin sesión.

[build] ocupado — Codex, BUG-013.

[build] libre — Codex, BUG-013; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-014] hallazgo — el historial de triggers expone datos de
leads y acepta ejecuciones falsas sin sesión.

[build] ocupado — Codex, BUG-014.

[build] libre — Codex, BUG-014; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-015] hallazgo — `GET /api/integraciones` devuelve la
columna de configuración que puede contener API keys y secretos, sin sesión.

[build] ocupado — Codex, BUG-015.

[build] libre — Codex, BUG-015; build no iniciado porque Claude comenzó a
corregir la cola C-01 en el árbol compartido.

[build] ocupado — Codex, BUG-015; reanudado después de `6349ef0`.

[build] libre — Codex, BUG-015; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-016] hallazgo — `/api/whatsapp/send` permite enviar
mensajes arbitrarios y consultar configuración sin sesión; prueba mockeada.

[build] ocupado — Codex, BUG-016.

[build] libre — Codex, BUG-016; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-017] hallazgo — listado y detalle de solicitudes exponen
antecedentes financieros y de la propiedad sin sesión.

[build] ocupado — Codex, BUG-017.

[build] libre — Codex, BUG-017; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-018] hallazgo — `GET /api/tareas` expone trabajo interno,
responsables y clientes sin sesión.

[build] ocupado — Codex, BUG-018.

[build] libre — Codex, BUG-018; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-019] hallazgo — `GET /api/eventos` expone agenda,
ubicaciones, notas y clientes sin sesión.

[build] ocupado — Codex, BUG-019.

[build] libre — Codex, BUG-019; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-020] hallazgo — `GET /api/recordatorios` expone próximos
contactos, mensajes y clientes sin sesión.

[build] ocupado — Codex, BUG-020.

[build] libre — Codex, BUG-020; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-021] hallazgo — `GET /api/plantillas` expone contenido y
variables de comunicaciones internas sin sesión.

[build] ocupado — Codex, BUG-021.

[build] libre — Codex, BUG-021; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-022] hallazgo — `GET /api/biblioteca` expone documentos,
descripciones y URLs internas sin sesión.

[build] ocupado — Codex, BUG-022.

[build] libre — Codex, BUG-022; build terminó en 0 con variables ficticias.

[FASE 1 · C-01 · BUG-023] hallazgo — `GET /api/campanas` expone presupuesto,
segmentos, ingresos, ROI y métricas sin sesión.

[build] ocupado — Codex, BUG-023.

[build] libre — Codex, BUG-023; build terminó en 0 con variables ficticias.

[FASE 1 · C-06 · BUG-024] hallazgo — la verificación del webhook Stripe acepta
cualquier firma y permite registrar pagos falsos; prueba totalmente mockeada.

[build] ocupado — Codex, BUG-024.

[build] libre — Codex, BUG-024; build terminó en 0 con variables ficticias.

[FASE 1 · C-06 · BUG-025] hallazgo — un anónimo puede crear checkouts Stripe
con monto y `comisionId` arbitrarios; prueba totalmente mockeada.

[build] ocupado — Codex, BUG-025.

[build] libre — Codex, BUG-025; build terminó en 0 con variables ficticias.
