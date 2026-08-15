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

[FASE 1 · C-06 · BUG-026] hallazgo — la verificación del webhook WhatsApp
acepta cualquier firma; prueba pura sin red ni datos reales.

[build] ocupado — Codex, BUG-026.

[build] libre — Codex, BUG-026; build terminó en 0 con variables ficticias.

[FASE 1 · C-06 · BUG-027] hallazgo — el webhook email acepta JSON anónimo,
crea leads con service role y envía correos; prueba totalmente mockeada.

[build] ocupado — Codex, BUG-027.

[build] libre — Codex, BUG-027; build terminó en 0 con variables ficticias.

[FASE 1 · C-06 · BUG-028] hallazgo — el portal acepta archivos para cualquier
`leadId` existente sin demostrar pertenencia; prueba totalmente mockeada.

[build] ocupado — Codex, BUG-028.

[build] libre — Codex, BUG-028; build terminó en 0 con variables ficticias.

[FASE 1 · C-04/C-06 · BUG-029] hallazgo — un `AGENTE` autenticado puede subir
archivos al lead de otro vendedor; prueba totalmente mockeada.

[build] ocupado — Codex, BUG-029.

[build] libre — Codex, BUG-029; build falló por errores de sintaxis ajenos en
`src/datos/mock.ts:6` y `src/modulos/usuarios/config.ts:20`. No se commitea el
hallazgo hasta que Claude estabilice `src/`.

[build] ocupado — Codex, BUG-029; reintento tras `f0181c8`.

[build] libre — Codex, BUG-029; el reintento compiló y pasó TypeScript, pero
falló al desaparecer `/api/stripe/create-session` durante el build compartido.

[build] ocupado — Codex, BUG-029; segundo reintento con el árbol estable.

[build] libre — Codex, BUG-029; build terminó en 0 con variables ficticias.

[FASE 1 · C-03 · BUG-030] hallazgo — seis dígitos contenidos en el RUT abren
la ficha completa de otra persona en el portal; prueba de componente aislada.

[build] ocupado — Codex, BUG-030.

[build] libre — Codex, BUG-030; build terminó en 0 con variables ficticias.

[FASE 1 · C-04 · BUG-031] hallazgo — `GET /api/leads` entrega a un `AGENTE`
los clientes asignados a otros vendedores; prueba con datos sintéticos.

[build] ocupado — Codex, BUG-031.

[build] libre — Codex, BUG-031; build terminó en 0 con variables ficticias.

[FASE 1 · C-04 · BUG-032] hallazgo — `GET /api/leads/[id]` entrega a un
`AGENTE` la ficha completa de un cliente asignado a otro vendedor.

[build] ocupado — Codex, BUG-032.

[build] libre — Codex, BUG-032; build terminó en 0 con variables ficticias.

[FASE 1 · C-03 · BUG-030] ajuste — la prueba acepta que el arreglo elimine
por completo el buscador de RUT, sin perder la regresión contra el código viejo.

[build] ocupado — Codex, ajuste BUG-030.

[build] libre — Codex, ajuste BUG-030; build terminó en 0 con variables ficticias.

[FASE 1 · C-04 · BUG-033] hallazgo — `PUT /api/leads/[id]` permite a un
`AGENTE` cambiar la etapa de un cliente asignado a otro vendedor.

[build] ocupado — Codex, BUG-033.

[build] libre — Codex, BUG-033; build terminó en 0 con variables ficticias.

[FASE 1 · C-06 · BUG-034] hallazgo — `DELETE /api/documentos/[id]` borra de
Storage y base de datos el documento asociado al lead de otro agente.

[build] ocupado — Codex, cierre BUG-034.

[build] libre — Codex, cierre BUG-034; build terminó en 0 con variables ficticias.

[CI-03 · pipeline] cobertura — reglas obligatorias y etapas sin requisitos
quedan fijadas con datos sintéticos.

[build] ocupado — Codex, CI-03 pipeline.

[build] libre — Codex, CI-03 pipeline; build terminó en 0 con variables ficticias.

[CI-03 · comisiones · BUG-035] hallazgo — la API guarda el total recibido en
lugar de calcularlo con `montoTotal` y `tasaComision`; datos sintéticos.

[build] ocupado — Codex, BUG-035.

[build] libre — Codex, BUG-035; build terminó en 0 con variables ficticias.

[CI-03 · documentos · BUG-036] hallazgo — una versión anual satisface también
el requisito de otro año cuando ambos comparten `tipo`; datos sintéticos.

[build] ocupado — Codex, BUG-036.

[build] libre — Codex, BUG-036; build terminó en 0 con variables ficticias.

[build] ocupado — Codex, C-07.

[build] libre — Codex, C-07; build bloqueado por `src/proxy.ts` sin exportación reconocida.

[build] ocupado — Codex, reintento C-07.

[build] libre — Codex, C-07; build terminó en 0 con variables ficticias.

[FASE 2 · C-07] hecho — medición independiente confirma 1.248,2 KiB en
`/simulador-publico`; PERF-01 no redujo la descarga y PERF-02 no se evalúa por bundle.

[build] ocupado — Codex, C-08 · BUG-037.

[build] libre — Codex, C-08 · BUG-037; build terminó en 0 con variables ficticias.

[FASE 2 · C-08 · BUG-037] hallazgo — `/simulador-publico` declara 1.278.179
bytes de JavaScript frente al presupuesto de 409.600; 78 pruebas verdes y solo esta roja.
