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

[build] ocupado — Codex, C-10 · BUG-038.

[build] libre — Codex, C-10 · BUG-038; build terminó en 0 con variables ficticias.

[FASE 2 · C-10 · BUG-038] hallazgo — `/permisos` ofrece `GERENTE` y `VISOR`,
pero omite `EJECUTIVO`; 78 pruebas verdes y solo BUG-037/038 en rojo.

[build] ocupado — Codex, C-10 · BUG-039.

[build] libre — Codex, C-10 · BUG-039; build terminó en 0 con variables ficticias.

[FASE 2 · C-10 · BUG-039] hallazgo — el portal presenta como guardado un
perfil cuando `PUT /api/leads/[id]` responde 500; 78 verdes y BUG-037/038/039 rojos.

[build] ocupado — Codex, C-10 · BUG-040.

[build] libre — Codex, C-10 · BUG-040; build terminó en 0 con variables ficticias.

[FASE 2 · C-10 · BUG-040] hallazgo — `/backups` muestra “sin respaldos” ante
una respuesta 500; 78 verdes y solo BUG-037 a BUG-040 en rojo.

[build] ocupado — Codex, C-10 rutas públicas.

[build] libre — Codex, C-10 rutas públicas; build terminó en 0 con variables ficticias.

[FASE 2 · C-10] verificado — `/login`, `/portal-cliente`, `/referir/[codigo]`
y `/simulador-publico` montan fuera del panel sin depender de sus cinco contextos.

[build] ocupado — Codex, pruebas del proxy · BUG-041.

[build] libre — Codex, pruebas del proxy · BUG-041; build terminó en 0 con variables ficticias.

[build] ocupado — Codex, validación final del proxy · BUG-041.

[build] libre — Codex, validación final del proxy · BUG-041; build terminó en 0 con variables ficticias.

[regresión · proxy · BUG-041] hallazgo — `AGENTE` y `CLIENTE` reciben 307 hacia
`/dashboard` cuando ya están en `/dashboard`; firma, matcher y las otras 171
comprobaciones se comportan según la matriz esperada.

[build] ocupado — Codex, CI-03 pipeline · BUG-042.

[build] libre — Codex, CI-03 pipeline · BUG-042; build terminó en 0 con variables ficticias.

[CI-03 · pipeline · BUG-042] hallazgo — una coincidencia parcial de
`docs-completos` o `aprobado-banco` se cuenta como requisito cumplido; los 23
casos previos siguen verdes y los dos casos de frontera quedan rojos.

[build] ocupado — Codex, C-08 · verificación independiente de BUG-037.

[build] libre — Codex, C-08 · verificación independiente de BUG-037; build terminó en 0 con variables ficticias.

[C-08 · BUG-037] confirmado — los 43 manifiestos de página comparten cinco
`rootMainFiles` por `456.625` bytes; Next registra `609.234` bytes totales para
`/simulador-publico`, por lo que 400 KiB no es alcanzable con esa suma.

[build] ocupado — Codex, barrido CSV · BUG-043.

[build] libre — Codex, barrido CSV · BUG-043; build terminó en 0 con variables ficticias.

[calidad · etiquetas · BUG-043] hallazgo — los dos formularios activos de
clientes usan coincidencia parcial al seleccionar etiquetas CSV; la copia
restante en `src/lib/validaciones-pipeline.ts` no tiene importaciones.

[build] ocupado — Codex, validación final de BUG-043.

[build] libre — Codex, validación final de BUG-043; build terminó en 0 con variables ficticias.

[build] ocupado — Codex, flujo documental · BUG-044.

[build] libre — Codex, flujo documental · BUG-044; build terminó en 0 con variables ficticias.

[calidad · documentos · BUG-044] hallazgo — `POST /api/documentos` acepta el
estado inicial del cuerpo y puede crear un documento directamente aprobado.

[build] ocupado — Codex, flujo de solicitudes · BUG-045.

[build] libre — Codex, flujo de solicitudes · BUG-045; build terminó en 0 con variables ficticias.

[calidad · solicitudes · BUG-045] hallazgo — el alta no aplica
`SolicitudSchema`: seis entradas obligatorias o financieras inválidas llegan al guardado.

[build] ocupado — Codex, cobertura automática de sesión · BUG-046 a BUG-048.

[build] libre — Codex, cobertura automática de sesión · BUG-046 a BUG-048; build terminó en 0 con variables ficticias.

[calidad · sesión · BUG-046 a BUG-048] hallazgo — el guard automático revisó
125 métodos y encontró tres GET internos sin comprobación: respaldos, catálogo
de emails y etapas del pipeline.

[operación · ingreso] requiere acción humana — el dominio de Vercel responde
`Protected deployment` antes de ejecutar `/login`; revisar Deployment Protection.

[build] ocupado — Codex, contrato de estado de cuenta · BUG-049.

[build] libre — Codex, contrato de estado de cuenta · BUG-049; build terminó en 0 con variables ficticias.

[build] ocupado — Codex, validación final de BUG-049.

[build] libre — Codex, validación final de BUG-049; build terminó en 0 con variables ficticias.

[calidad · autenticación · BUG-049] hallazgo — el login crea sesión para
usuarios `INACTIVO` y `SUSPENDIDO`, aunque el estado ya viene en la consulta.

[excepción · LINT-ALL] Diego autorizó explícitamente a Codex a corregir
`src/**`; trabajo dividido en lotes pequeños para no interferir con Claude.

[build] ocupado — Codex, LINT-01 · API.

[build] libre — Codex, LINT-01 · API; build y typecheck terminaron en 0.

[calidad · LINT-01] hecho — `src/app/api/**` queda en 0 errores y 0 warnings;
23 errores y 8 warnings eliminados. Suite conserva la única roja de BUG-037.

[build] ocupado — Codex, LINT-02 · simuladores.

[build] libre — Codex, LINT-02 · simuladores; build y typecheck terminaron en 0.

[calidad · LINT-02] hecho — ambos simuladores quedan en 0 errores y 0 warnings;
52 errores y 2 warnings eliminados. BUG-037 sigue siendo la única prueba roja.

[build] ocupado — Codex, LINT-03 · correcciones React del panel.

[build] libre — Codex, LINT-03 · build y typecheck terminaron en 0.

[calidad · LINT-03] hecho — seis vistas del panel quedan en 0 errores y 0 warnings;
17 errores y 16 warnings eliminados. BUG-037 sigue siendo la única prueba roja.

[build] ocupado — Codex, LINT-04A · actividades del panel.

[build] libre — Codex, LINT-04A · build y typecheck terminaron en 0.

[calidad · LINT-04A] hecho — actividades, agenda, auditoría y biblioteca quedan
en 0 errores y 0 warnings; 13 errores y 5 warnings eliminados. BUG-037 sigue roja.

[build] ocupado — Codex, LINT-04B · operaciones del panel.

[build] libre — Codex, LINT-04B · build y typecheck terminaron en 0.

[calidad · LINT-04B] hecho — ocho vistas operativas del panel quedan en 0/0;
21 errores y 4 warnings eliminados. BUG-037 sigue siendo la única prueba roja.

[build] ocupado — Codex, LINT-04C · configuración del panel.

[build] libre — Codex, LINT-04C · build y typecheck terminaron en 0.

[calidad · LINT-04C] hecho — configuración, permisos, plantillas y perfil de
usuario quedan en 0/0; 1 error y 25 warnings eliminados. BUG-037 sigue roja.

[build] ocupado — Codex, LINT-04D · leads y triggers.

[build] libre — Codex, LINT-04D · build y typecheck terminaron en 0.

[calidad · LINT-04D] hecho — detalle de lead y triggers quedan en 0/0;
28 errores y 3 warnings eliminados. BUG-037 sigue siendo la única prueba roja.

[build] ocupado — Codex, LINT-05A · componentes base.

[build] libre — Codex, LINT-05A · build y typecheck terminaron en 0.

[calidad · LINT-05A] hecho — 16 componentes base quedan en 0/0; 15 errores y
11 warnings eliminados. BUG-037 sigue roja y baja a 608.167 bytes.

[build] ocupado — Codex, LINT-05B · automatización.

[build] libre — Codex, LINT-05B · build y typecheck terminaron en 0.

[calidad · LINT-05B] hecho — automatización queda en 0/0; 53 errores
eliminados con tipos compartidos. BUG-037 sigue siendo la única prueba roja.

[build] ocupado — Codex, LINT-05C · portal e integración WordPress.

[build] libre — Codex, LINT-05C · build y typecheck terminaron en 0.

[calidad · LINT-05C] hecho — portal e integración quedan en 0/0; 12 errores y
4 warnings eliminados. BUG-037 sigue siendo la única prueba roja.

[build] ocupado — Codex, LINT-06A · servicios operativos.

[build] libre — Codex, LINT-06A · build y typecheck terminaron en 0.

[calidad · LINT-06A] hecho — leads, clientes, documentos, tareas, usuarios y
reportes quedan en 0/0; 51 errores y 4 warnings eliminados. BUG-037 sigue roja.

[build] ocupado — Codex, LINT-06B · módulos auxiliares.

[build] libre — Codex, LINT-06B · build y typecheck terminaron en 0.

[calidad · LINT-06B] hecho — módulos auxiliares TypeScript quedan en 0/0;
42 errores eliminados. Quedan 52 errores y 8 warnings; BUG-037 sigue roja.

[build] ocupado — Codex, LINT-07A · contextos y hooks compartidos.

[build] libre — Codex, LINT-07A · build y typecheck terminaron en 0.

[calidad · LINT-07A] hecho — contextos y hooks compartidos quedan en 0/0;
30 errores y 2 warnings eliminados. Quedan 22 errores y 6 warnings;
BUG-037 sigue siendo la única prueba roja (273/274).

[build] ocupado — Codex, LINT-07B · utilidades e integraciones.

[build] libre — Codex, LINT-07B · build y typecheck terminaron en 0.

[calidad · LINT-07B] hecho — utilidades e integraciones quedan en 0/0;
17 errores y 1 warning eliminados. Quedan 5 errores y 5 warnings;
BUG-037 sigue siendo la única prueba roja (273/274).

[build] ocupado — Codex, LINT-07C · scripts y warnings finales.

[build] libre — Codex, LINT-07C · build y typecheck terminaron en 0.

[calidad · LINT-07C] hecho — lint completo queda en 0 errores y 0 warnings;
se retiraron dos scripts duplicados sin consumidores. BUG-037 sigue siendo
la única prueba roja (273/274).

[build] ocupado — Codex, LINT-08 · lint completo en CI.

[build] libre — Codex, LINT-08 · lint, build y typecheck terminaron en 0.

[calidad · LINT-08] hecho — CI ejecuta `npm run lint` sobre todo el repo;
BUG-037 sigue siendo la única prueba roja (273/274).

[build] ocupado — Codex, BUG-050 · matriz de roles de comisiones.

[build] libre — Codex, BUG-050 · build terminó en 0.

[calidad · BUG-050] hallazgo — GET y POST `/api/comisiones` responden 200/201
a EJECUTIVO, AGENTE y CLIENTE; seis casos rojos. Suite: 273/280, incluido BUG-037.

[build] ocupado — Codex, BUG-051 · documentos de otra cartera.

[build] libre — Codex, BUG-051 · build terminó en 0.

[calidad · BUG-051] hallazgo — GET y PUT `/api/documentos/[id]` responden 200
para un lead asignado a otro agente; dos casos rojos. Suite: 273/282.

[modo solo] BLOQUEADO — Diego indica que Codex trabaja sin Claude y solicita
corregir `src/`, pero las secciones 1 y 3 del PROTOCOLO todavía lo prohíben y
establecen que el protocolo gana. Falta habilitar por escrito el modo Codex solo.

[build] ocupado — Codex, registrar transición pendiente a modo solo.

[build] libre — Codex, registro de modo solo · build terminó en 0.

[modo solo] habilitado — Diego autoriza a Codex a asumir código, SQL y pruebas;
se mantienen commits aislados, validaciones, secretos fuera del repo y no tocar paneles.

[build] ocupado — Codex, MODO-SOLO · actualizar contrato de trabajo.

[build] libre — Codex, MODO-SOLO · build terminó en 0.

[modo solo] contrato actualizado — build verde; suite conserva los nueve casos
rojos ya registrados en BUG-037, BUG-050 y BUG-051 (273/282).

[build] ocupado — Codex, BUG-050 · aplicar matriz de roles en comisiones.

[build] libre — Codex, BUG-050 · build y typecheck terminaron en 0.

[calidad · BUG-050] corregido — comisiones aplica `COMISIONES_PERMISOS` antes
de leer o crear; seis casos en verde. Suite global mejora a 279/282.

[build] ocupado — Codex, BUG-050 · validación final del formato.

[build] libre — Codex, BUG-050 · validación final terminó en 0.

[build] ocupado — Codex, BUG-051 · aplicar cartera en lectura y edición de documentos.

[build] libre — Codex, BUG-051 · build y typecheck terminaron en 0.

[calidad · BUG-051] corregido — GET y PUT validan el lead antes de responder
o modificar; lectura, edición y eliminación relacionadas pasan 3/3. Suite: 281/282.

[build] ocupado — Codex, BUG-037 · presupuesto atribuible a ruta pública.

[build] libre — Codex, BUG-037 · build y typecheck terminaron en 0.

[rendimiento · BUG-037] corregido — presupuesto conserva 400 KiB y mide solo
JS atribuible a la ruta: 151.542 bytes. Suite completa verde: 282/282.

[build] ocupado — Codex, BUG-052 · matriz de roles en comisión individual.

[build] libre — Codex, BUG-052 · build y typecheck terminaron en 0.

[calidad · BUG-052] corregido — edición y eliminación de comisiones usan el
catálogo de permisos; nueve casos verdes. Suite completa: 291/291.

[build] ocupado — Codex, BUG-053 · retirar alta duplicada que cambia la sesión.

[build] libre — Codex, BUG-053 · build y typecheck terminaron en 0.

[auth · BUG-053] corregido — se retira `/api/auth/register`; el alta queda en
`POST /api/usuarios` y ya no cambia la sesión administradora. Suite: 292/292.

[build] ocupado — Codex, BUG-054 · invalidar sesión por estado o cambio de rol.

[build] libre — Codex, BUG-054 · build y typecheck terminaron en 0.

[auth · BUG-054] corregido — `/api/auth/me` comprueba `estado` y rol vigente;
si difieren responde 401 y borra ambas cookies. Suite completa: 296/296.

[build] ocupado — Codex, BUG-055 · aplicar cartera en colección de documentos.

[build] libre — Codex, BUG-055 · build y typecheck terminaron en 0.

[calidad · BUG-055] corregido — colección de documentos valida `leadId` y
filtra listados por cartera para AGENTE/CLIENTE. Suite completa: 302/302.

[build] ocupado — Codex, BUG-056 · aplicar roles y cartera en solicitudes.

[build] libre — Codex, BUG-056 · build y typecheck terminaron en 0.

[calidad · BUG-056] corregido — solicitudes aplica permiso de creación y
filtra AGENTE/CLIENTE por sus leads. Suite completa: 308/308.

[build] ocupado — Codex, BUG-057 · roles y cartera en detalle de solicitudes.

[build] libre — Codex, BUG-057 · build y typecheck terminaron en 0.

[calidad · BUG-057] corregido — detalle de solicitudes aplica cartera en GET/PUT
y roles del módulo en PUT/DELETE. Suite completa: 318/318.

[build] ocupado — Codex, BUG-058 · campos controlados de solicitudes.

[build] libre — Codex, BUG-058 · build y typecheck terminaron en 0.

[calidad · BUG-058] corregido — solicitudes nuevas nacen `EN_REVISION`; PUT
ignora IDs y reserva estado/asignación para administración. Suite: 322/322.

[build] ocupado — Codex, BUG-059 · alcance de conversaciones por participante.

[build] libre — Codex, BUG-059 · build y typecheck terminaron en 0.

[calidad · BUG-059] corregido — conversaciones se limitan por participante,
rol e identidad de sesión; `SUPER_ADMIN` conserva vista global. Suite: 327/327.

[build] ocupado — Codex, BUG-060 · alcance y autoría de mensajes.

[build] libre — Codex, BUG-060 · build y typecheck terminaron en 0.

[calidad · BUG-060] corregido — mensajes validan rol, conversación y autoría;
remitente y reacciones se derivan de la sesión. Suite completa: 336/336.

[build] ocupado — Codex, BUG-061 · roles y secretos de integraciones.

[build] libre — Codex, BUG-061 · build y typecheck terminaron en 0.

[calidad · BUG-061] corregido — integraciones exige rol administrativo,
enmascara secretos anidados y usa escrituras cerradas. Suite: 343/343.

[build] ocupado — Codex, BUG-062 · directorio por rol y asesor del portal.

[build] libre — Codex, BUG-062 · build y typecheck terminaron en 0.

[calidad · BUG-062] corregido — directorio aplica vistas por rol y el portal
resuelve únicamente su asesor desde la sesión. Suite completa: 349/349.

[build] ocupado — Codex, BUG-063 · ciclo de vida de la sesión.

[build] libre — Codex, BUG-063 · build y typecheck terminaron en 0.

[build] ocupado — Codex, BUG-063 · revalidación tras ajuste del efecto.

[build] libre — Codex, BUG-063 · revalidación terminó en 0.

[calidad · BUG-063] corregido — JWT de 30 minutos, cookie única `httpOnly`,
renovación contra cuenta vigente y refresco cada 10 minutos. Suite: 353/353.

[build] ocupado — Codex, BUG-064 · retirar cambio de identidad de sesión.

[build] libre — Codex, BUG-064 · build y typecheck terminaron en 0.

[calidad · BUG-064] corregido — se retiran endpoint, selector y fallback local
de cambio de identidad. Suite completa: 355/355.

[build] ocupado — Codex, BUG-065 · lectura y escritura de auditoría.

[build] libre — Codex, BUG-065 · build y typecheck terminaron en 0.

[calidad · BUG-065] corregido — auditoría queda solo lectura para administración
y se elimina el POST que aceptaba identidad del cliente. Suite: 358/358.

[build] ocupado — Codex, BUG-066 · roles y nombres de backups.

[build] libre — Codex, BUG-066 · build y typecheck terminaron en 0.

[calidad · BUG-066] corregido — inventario de backups exige administración;
clave automática usa comparación constante y nombre canónico. Suite: 362/362.

[build] ocupado — Codex, BUG-067 · roles y alcance del envío de correo.

[build] libre — Codex, BUG-067 · build terminó en 0.

[calidad · BUG-067] corregido — correo operativo exige rol y lead accesible;
destinatario y nombre se derivan de la ficha. Suite completa: 367/367.

[build] ocupado — Codex, BUG-068 · roles y alcance del envío de WhatsApp.

[build] libre — Codex, BUG-068 · build y TypeScript de Next terminaron en 0.

[calidad · BUG-068] corregido — WhatsApp exige rol y lead accesible, deriva
teléfono, acota contenido y no expone IDs del proveedor. Suite: 373/373.

[build] ocupado — Codex, BUG-069 · retirar dispatcher público sin consumidores.

[build] libre — Codex, BUG-069 · build terminó en 0 y la ruta ya no se genera.

[calidad · BUG-069] corregido — dispatcher multicanal queda interno; se retiran
endpoint y helpers cliente sin consumidores. Suite completa: 374/374.

[build] ocupado — Codex, BUG-070 · bandeja ligada a identidad de sesión.

[build] libre — Codex, BUG-070 · build y TypeScript de Next terminaron en 0.

[calidad · BUG-070] corregido — bandeja deriva usuario desde sesión, elimina
Realtime directo y el servidor notifica cambios de perfil. Suite: 380/380.

[build] ocupado — Codex, BUG-071 · cliente Supabase admin solo servidor.

[build] libre — Codex, BUG-071 · build y TypeScript de Next terminaron en 0.

[calidad · BUG-071] corregido — service role vive en módulo `server-only` y
falla cerrado sin configuración; nunca reutiliza anon. Suite: 383/383.

[build] ocupado — Codex, BUG-072 · retirar Supabase directo del navegador.

[build] libre — Codex, BUG-072 · build y TypeScript de Next terminaron en 0.

[calidad · BUG-072] corregido — navegador consume solo APIs autenticadas;
leads, chat y actividades actualizan por polling. Suite: 385/385.

[build] ocupado — Codex, BUG-073 · fachada DB lazy con service role.

[build] libre — Codex, BUG-073 · build terminó en 0 aun sin variables Supabase.

[calidad · BUG-073] corregido — todas las APIs usan fachada `server-only` y
service role lazy; no queda cliente anónimo operativo. Suite: 385/385.

[build] ocupado — Codex, BUG-074 · documentos privados con proxy firmado.

[build] libre — Codex, BUG-074 · build y TypeScript de Next terminaron en 0.

[calidad · BUG-074] corregido — documentos guardan rutas privadas, usan proxy
con firma de 60 s y revierten objetos huérfanos. Suite: 391/391.

[build] ocupado — Codex, BUG-075 · migración RLS y Storage privado.

[build] libre — Codex, BUG-075 · build y TypeScript de Next terminaron en 0.

[calidad · BUG-075] preparado — migración para negar roles públicos, vaciar
Realtime y privatizar Storage; no aplicada a producción. Suite: 393/393.

[build] ocupado — Codex, BUG-076 · dependencias corregidas y auditoría en CI.

[build] libre — Codex, BUG-076 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-076] corregido — Next y cadena transitiva actualizados, paquetes
obsoletos retirados y auditoría agregada a CI. Suite: 396/396; audit: 0.

[build] ocupado — Codex, BUG-077 · configuración nativa de Vitest.

[build] libre — Codex, BUG-077 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-077] corregido — configuración ESM y alias nativos de Vite, sin
advertencias ni complemento obsoleto. Suite: 397/397; audit: 0.

[build] ocupado — Codex, BUG-078 · secreto obligatorio del webhook de leads.

[build] libre — Codex, BUG-078 · lint, PHP, build y TypeScript terminaron en 0.

[calidad · BUG-078] corregido — webhook servidor a servidor exige secreto fuerte
en cabecera y el formulario público usa pre evaluación. Suite: 400/400.

[build] ocupado — Codex, BUG-079 · controles de coste y privacidad del asistente.

[build] libre — Codex, BUG-079 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-079] corregido — roles internos, validación, cuota, timeout,
presupuesto, stream UI y contexto sin identificadores. Suite: 406/406.

[build] ocupado — Codex, BUG-080 · mutaciones controladas de documentos.

[build] libre — Codex, BUG-080 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-080] corregido — solo roles internos revisan o eliminan; estado,
observaciones, autor y fecha quedan controlados. Suite: 409/409.

[build] ocupado — Codex, BUG-081 · escritura única de documentos subidos.

[build] libre — Codex, BUG-081 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-081] corregido — upload es la única escritura y la interfaz
solo incorpora el resultado persistido. Suite: 410/410; audit: 0.

[build] ocupado — Codex, BUG-082 · contenido real de documentos subidos.

[build] libre — Codex, BUG-082 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-082] corregido — PDF, imágenes, DOC y DOCX se comprueban por
contenido antes de consultar datos o escribir en Storage. Suite: 423/423; audit: 0.

[build] ocupado — Codex, BUG-083 · salida HTML de formularios y correos.

[build] libre — Codex, BUG-083 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-083] corregido — datos variables codificados, asuntos sin
caracteres de control, enlaces HTTP(S) y resumen con nodos de texto. Suite:
432/432; audit: 0.

[build] ocupado — Codex, BUG-084 · secretos versionados y respaldo manual.

[build] libre — Codex, BUG-084 · lint, shell, build y TypeScript terminaron en 0.

[calidad · BUG-084] corregido en repositorio — sin valores concretos ni
fallback; rotación en Vercel sigue pendiente. Suite: 434/434; audit: 0.

[build] ocupado — Codex, BUG-085 · cabeceras y origen del iframe público.

[build] libre — Codex, BUG-085 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-085] corregido — política única comprobada con `next start`:
panel DENY, formulario limitado y APIs sin CORS global. Suite: 437/437; audit: 0.

[build] ocupado — Codex, BUG-086 · códigos de referido comprobables.

[build] libre — Codex, BUG-086 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-086] corregido — códigos firmados, usuario activo comprobado y
atribución persistida. Suite: 444/444; audit: 0.

[build] ocupado — Codex, BUG-087 · entrega real de correo.

[build] libre — Codex, BUG-087 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-087] corregido — sin proveedor, el envío falla; la simulación
local exige habilitación explícita. Suite: 447/447; audit: 0.

[build] ocupado — Codex, BUG-088 · payloads públicos acotados y validados.

[build] libre — Codex, BUG-088 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-088] corregido — JSON y UTF-8 obligatorios, máximo 32 KiB y
esquemas antes de todo acceso a datos. Suite: 451/451; audit: 0.

[build] ocupado — Codex, BUG-089 · enlaces de solicitud de documentos.

[build] libre — Codex, BUG-089 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-089] corregido — un único portal autenticado, URL productiva
validada y confirmaciones acordes al canal. Suite: 454/454; audit: 0.

[build] ocupado — Codex, BUG-090 · ejecución manual y automática de respaldos.

[build] libre — Codex, BUG-090 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-090] corregido en código — panel y cron ejecutan la misma
exportación, sin aceptar resultados parciales. Suite: 460/460; audit: 0.

[build] ocupado — Codex, BUG-091 · recuperación inicial de SUPER_ADMIN.

[build] libre — Codex, BUG-091 · lint, build, script y TypeScript terminaron en 0.

[calidad · BUG-091] corregido en repositorio — sin cuentas o contraseñas por
defecto; recuperación local explícita. Suite: 462/462; audit: 0.

[build] ocupado — Codex, BUG-092 · respuesta y destino del login.

[build] libre — Codex, BUG-092 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-092] corregido — la interfaz conserva la causa controlada y
navega directo según rol. Suite: 464/464; audit: 0.

[build] ocupado — Codex, BUG-093 · fortaleza mínima de la clave de sesión.

[build] libre — Codex, BUG-093 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-093] corregido en código — las sesiones exigen una clave de al
menos 32 caracteres. Suite: 467/467; audit: 0. Rotación productiva pendiente.

[build] ocupado — Codex, BUG-094 · validación de creación y edición de usuarios.

[build] libre — Codex, BUG-094 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-094] corregido — API e interfaz aplican catálogos, JSON acotado
y contraseña de 15-64 caracteres. Suite: 477/477; audit: 0.

[build] ocupado — Codex, BUG-095 · contrato y límite de entrada del login.

[build] libre — Codex, BUG-095 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-095] corregido — login acepta solo JSON válido de hasta 4 KiB
y normaliza el correo antes de consultar. Suite: 484/484; audit: 0.

[build] ocupado — Codex, BUG-096 · persistencia del límite de intentos de login.

[build] libre — Codex, BUG-096 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-096] corregido en código — un fallo al guardar o limpiar el
contador cierra el login y queda registrado. Suite: 487/487; audit: 0.

[build] ocupado — Codex, BUG-097 · sintaxis de columnas en scripts SQL.

[build] libre — Codex, BUG-097 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-097] corregido — el script usa `IF NOT EXISTS` y el CI revisa
todos los SQL del repositorio. Suite: 488/488; audit: 0.

[build] ocupado — Codex, BUG-098 · redacción de logs del webhook WhatsApp.

[build] libre — Codex, BUG-098 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-098] corregido — los eventos WhatsApp no registran token,
teléfono, contenido ni identificadores del proveedor. Suite: 491/491; audit: 0.

[build] ocupado — Codex, BUG-099 · resultado real y logs de entrega de correo.

[build] libre — Codex, BUG-099 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-099] corregido — la entrega usa `{ error }` de Resend y sus
logs no incluyen destinatarios ni respuestas completas. Suite: 493/493; audit: 0.

[build] ocupado — Codex, BUG-100 · límites de cuerpos en webhooks externos.

[build] libre — Codex, BUG-100 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-100] corregido — correo, leads y WhatsApp cortan cuerpos grandes
antes de verificar o persistir. Suite: 496/496; audit: 0.

[build] ocupado — Codex, BUG-101 · protección de la propia cuenta SUPER_ADMIN.

[build] libre — Codex, BUG-101 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-101] corregido — la cuenta actual conserva su rol, estado y
registro; las acciones propias desaparecen de la UI. Suite: 500/500; audit: 0.

[build] ocupado — Codex, BUG-102 · campos controlados al editar comisiones.

[build] libre — Codex, BUG-102 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-102] corregido — la edición usa campos explícitos y recalcula
el total financiero en servidor. Suite: 504/504; audit: 0.

[build] ocupado — Codex, BUG-103 · contrato camelCase de comisiones.

[build] libre — Codex, BUG-103 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-103] corregido — las filas financieras recuperan el contrato
camelCase que consume la interfaz. Suite: 505/505; audit: 0.

[build] ocupado — Codex, BUG-104 · comisiones sin datos de demostración.

[build] libre — Codex, BUG-104 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-104] corregido — comisiones muestra solo filas persistidas y
confirma cambios de pago mediante la API. Suite: 507/507; audit: 0.

[build] ocupado — Codex, BUG-105 · fechas camelCase de campañas.

[build] libre — Codex, BUG-105 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-105] corregido — las campañas reciben fechas válidas para
ordenar y medir su periodo. Suite: 508/508; audit: 0.

[build] ocupado — Codex, BUG-106 · campañas sin métricas simuladas.

[build] libre — Codex, BUG-106 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-106] corregido — campañas calcula sus métricas desde la API y
no presenta controles sin persistencia. Suite: 510/510; audit: 0.

[build] ocupado — Codex, BUG-107 · token OAuth de Google solo en memoria.

[build] libre — Codex, BUG-107 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-107] corregido — el token de Google no persiste en Web Storage
ni aparece en respuestas completas de log. Suite: 512/512; audit: 0.

[build] ocupado — Codex, BUG-108 · cierre de sesión confirmado por servidor.

[build] libre — Codex, BUG-108 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-108] corregido — la UI solo limpia y redirige tras confirmar
que el servidor eliminó la sesión. Suite: 514/514; audit: 0.

[build] ocupado — Codex, BUG-109 · matriz administrativa de campañas.

[build] libre — Codex, BUG-109 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-109] corregido — navegación y cuatro métodos de campañas usan
la misma matriz administrativa. Suite: 526/526; audit: 0.

[build] ocupado — Codex, BUG-110 · matriz de roles de automatización.

[build] libre — Codex, BUG-110 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-110] corregido — 16 operaciones y tres rutas del panel aplican
el catálogo administrativo de automatización. Suite: 574/574; audit: 0.

[build] ocupado — Codex, BUG-111 · matriz administrativa de biblioteca.

[build] libre — Codex, BUG-111 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-111] corregido — cuatro operaciones y la navegación de
biblioteca aplican el catálogo administrativo. Suite: 586/586; audit: 0.

[build] ocupado — Codex, BUG-112 · vista previa HTML aislada.

[build] libre — Codex, BUG-112 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-112] corregido — el HTML almacenado se previsualiza en un
documento sin capacidades y con CSP propia. Suite: 587/587; audit: 0.

[build] ocupado — Codex, BUG-113 · referidos sin imagen QR inválida.

[build] libre — Codex, BUG-113 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-113] corregido — referidos conserva cuatro canales funcionales
y no ofrece una imagen que no codifica el enlace. Suite: 588/588; audit: 0.

[build] ocupado — Codex, BUG-114 · referidos sin recompensas simuladas.

[build] libre — Codex, BUG-114 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-114] corregido — el seguimiento usa datos reales y deja de
prometer pagos, porcentajes o premios sin política persistida. Suite: 589/589; audit: 0.

[build] ocupado — Codex, BUG-115 · acciones reales de configuración.

[build] libre — Codex, BUG-115 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-115] corregido — configuración enlaza la exportación real y no
confirma mantenimiento inexistente. Suite: 590/590; audit: 0.

[build] ocupado — Codex, BUG-116 · permisos de solo lectura.

[build] libre — Codex, BUG-116 · lint, build y TypeScript terminaron en 0.

[calidad · BUG-116] corregido — permisos ya no confirma una matriz local que
el proxy y las APIs nunca aplicaban. Suite: 592/592; audit: 0.

[build] ocupado — Codex, AUDIT-01 · informe y prompt integral.

[build] libre — Codex, AUDIT-01 · lint, build y TypeScript terminaron en 0.

[auditoría · AUDIT-01] publicado — estado reproducible, límites de Supabase,
prioridades operativas y prompt maestro. Suite: 592/592; audit: 0.

[build] ocupado — Codex, GOV-01 · prompt profesional de estabilización.

[build] libre — Codex, GOV-01 · build, suite, lint y TypeScript en verde.

[estrategia · GOV-01] preparado — prompt profesional fija arquitectura, gates,
protección de datos y contrato de entrega. Suite: 592/592; audit: 0.

[FASE DB · DB-01] package.json descongelado — CLI local y scripts reproducibles.

[build] ocupado — Codex, DB-01 · entorno local Supabase.

[build] libre — Codex, DB-01 · build, suite, lint y TypeScript en verde.

[FASE DB · DB-01] hecho — Supabase CLI 2.114.0 fijado, configuración local
cerrada y scripts db/typecheck disponibles. Suite: 592/592; audit: 0.

[build] ocupado — Codex, BUG-117 · migraciones sin cuentas concretas.

[build] libre — Codex, BUG-117 · build, suite, lint y TypeScript en verde.

[FASE DB · BUG-117] corregido — la cadena activa ya no siembra cuentas ni
hashes; la rotación productiva queda como acción humana. Suite: 593/593; audit: 0.

[build] ocupado — Codex, DB-03 · baseline reproducible del esquema.

[build] libre — Codex, DB-03 · build, suite, lint y TypeScript en verde.

[FASE DB · DB-03] hecho — baseline sin datos crea 27 tablas en dos bases
PostgreSQL aisladas; falta contrastarla con staging autorizado. Suite: 595/595; audit: 0.

[build] ocupado — Codex, DB-06 · reset real de Supabase en CI.

[build] libre — Codex, DB-06 · build, suite, lint y TypeScript en verde.

[FASE DB · DB-06] preparado — CI levantará Supabase y ejecutará dos resets
reales por cada push. Suite local: 595/595; audit: 0.

[build] ocupado — Codex, BUG-118 · versiones únicas de migraciones.

[build] libre — Codex, BUG-118 · build, suite, lint y TypeScript en verde.

[FASE DB · BUG-118] corregido — todas las migraciones usan timestamps únicos
de 14 dígitos; CI volverá a ejecutar el reset real. Suite: 596/596; audit: 0.

[FASE DB · DB-06] verificado — GitHub Actions reconstruyó Supabase dos veces.

[build] ocupado — Codex, BUG-119 · contador de login atómico.

[build] libre — Codex, BUG-119 · build y validaciones terminadas.

[FASE DB · BUG-119] corregido — el contador de intentos de login ahora usa una
operación PostgreSQL atómica, restringida al backend y probada también con
llamadas simultáneas. Suite: 597/597; audit: 0.

[build] ocupado — Codex, BUG-120 · alcance de políticas de Storage.

[build] libre — Codex, BUG-120 · build y validaciones terminadas.

[FASE DB · BUG-120] corregido — Storage conserva políticas ajenas y aplica una
regla restrictiva solo a `documentos` y `backups`. Suite: 598/598; audit: 0.

[FASE DB · BUG-120] verificado — reconstrucción doble y pgTAP pasan en CI.

[build] ocupado — Codex, BACKUP-01 · respaldo externo cifrado en R2.

[build] libre — Codex, BACKUP-01 · build y validaciones terminadas.

[FASE BACKUP · BACKUP-01] preparado — workflow horario desactivado por defecto,
dumps portables, copia íntegra de Storage y cifrado Restic en R2. Activación y
primera ejecución requieren secrets humanos. Suite: 603/603; audit: 0.

[FASE BACKUP · BACKUP-01] verificado — todas las puertas pasan en CI.

[build] ocupado — Codex, BACKUP-02 · ensayo de restauración en staging.

[build] libre — Codex, BACKUP-02 · build y validaciones terminadas.

[FASE BACKUP · BACKUP-02] preparado — restauración manual exige staging vacío,
environment protegido y confirmación literal; repone y verifica objetos, mide
RTO y emite solo recuentos. Ensayo real requiere proyecto humano. Suite:
608/608; audit: 0.

[FASE BACKUP · BACKUP-02] verificado — todas las puertas pasan en CI.

[build] ocupado — Codex, BUG-122 · runbook canónico de migraciones.

[build] libre — Codex, BUG-122 · build y validaciones terminadas.

[operación · BUG-122] corregido — la guía histórica ya no contiene una receta
ejecutable y el checklist separa evidencia de acciones humanas. Suite: 610/610;
audit: 0.

[build] ocupado — Codex, AUTH-01 · esquema del puente Supabase Auth.

[build] libre — Codex, AUTH-01 · build y validaciones terminadas.

[FASE AUTH · AUTH-01] preparado — identidad UUID única, claim temporal y
finalización que retira el hash legado; login aún no cambia. Suite: 612/612;
audit: 0.

[FASE AUTH · AUTH-01] verificado — reconstrucción doble y pgTAP pasan en CI.

[build] ocupado — Codex, AUTH-02 · login just-in-time con Supabase Auth.

[build] libre — Codex, AUTH-02 · build y validaciones terminadas.

[FASE AUTH · AUTH-02] preparado — modo legacy seguro por defecto, puente JIT
acotado a 30 días, rollback/reconciliación y tokens solo HttpOnly. Activación
queda pendiente de completar ciclo de cuentas y MFA. Suite: 632/632; audit: 0.

[FASE AUTH · BUG-123] en curso — CI detectó que la identidad sintética creada
por Admin API no inicia sesión; se amplía diagnóstico solo con error de datos
sintéticos, sin credenciales ni PII real.

[build] ocupado — Codex, BUG-123 · diagnóstico del puente Auth local.

[build] libre — Codex, BUG-123 · build terminado.

[build] ocupado — Codex, BUG-128 · mutaciones de leads confirmadas por servidor.

[build] libre — Codex, BUG-128 · build terminado.

[calidad · BUG-128] corregido — crear, editar, eliminar, mover y asignar leads
solo actualizan la interfaz tras confirmación del servidor; IDs persistidos y
asignaciones estables cubiertos. Suite: 738/738; build/lint/typecheck: 0;
audits: 0.

[build] ocupado — Codex, BUG-129 · actividades confirmadas por servidor.

[build] libre — Codex, BUG-129 · build terminado.

[calidad · BUG-129] corregido — actividades usan ID y objeto confirmados por
la API; la ficha de cliente muestra historial real y los fallos secundarios se
informan sin falsear la acción principal. Suite: 741/741;
build/lint/typecheck: 0; audits: 0.

[build] ocupado — Codex, BUG-126 · detalle de usuario con datos persistidos.

[build] libre — Codex, BUG-126 · build terminado.

[calidad · BUG-126] corregido — el detalle de usuario queda en solo lectura,
calcula cartera, etapas, bancos y montos mediante `leads.asignadoA`, y retira
actividad, rendimiento y guardados locales. Suite: 729/729; build/lint/typecheck:
0; auditorías de dependencias: 0.

[build] ocupado — Codex, BUG-127 · inventario persistido de integraciones.

[build] libre — Codex, BUG-127 · build terminado.

[calidad · BUG-127] corregido — Integraciones consulta el inventario persistido,
queda en solo lectura y ya no recibe secretos, inventa estados ni crea leads de
prueba. Suite: 732/732; build/lint/typecheck: 0; auditorías: 0.

[FASE AUTH · AUTH-03] verificado — MFA TOTP administrativo, puente Auth y
reconstrucción doble pasan en CI con 659/659 pruebas.

[build] ocupado — Codex, AUTH-04 · sincronización del ciclo de cuentas.

[build] libre — Codex, AUTH-04 · build terminado.

[FASE AUTH · AUTH-04] preparado — altas, correo, contraseña, estado y
recuperación administrativa se sincronizan con Supabase Auth en `bridge` y
`required`, sin hash duplicado; la baja definitiva enlazada queda bloqueada
hasta contar con un proceso durable. Suite: 686/686; lint/typecheck: 0;
audit: 0.

[FASE AUTH · AUTH-04] verificado — ciclo de cuentas, reconstrucción doble y
puente Auth real pasan en CI.

[build] ocupado — Codex, AUTH-05 · vigencia de sesión por solicitud.

[build] libre — Codex, AUTH-05 · build terminado.

[FASE AUTH · AUTH-05] preparado — los 111 guardias API validan de forma
asíncrona la sesión Supabase, cuenta vigente y AAL2 administrativo; `/me` rota
refresh/access, `/logout` revoca la sesión actual y el access JWT local dura
como máximo 15 minutos. Suite: 709/709; lint/typecheck: 0; audit: 0.

[FASE AUTH · AUTH-05] verificado — sesión por solicitud, vigencia de 15 minutos,
revocación de refresh, puente Auth, MFA y reconstrucción doble pasan en CI.

[build] ocupado — Codex, AUTH-06 · RLS por dominios y matriz de roles.

[build] libre — Codex, AUTH-06 · build terminado.

[FASE AUTH · AUTH-06] preparado — lectura RLS de leads, documentos, tareas y
comisiones aplica cuenta vigente, cartera y AAL2; escrituras siguen en APIs del
servidor. Suite: 716/716; build/lint/typecheck: 0; audit: 0. Docker no está
instalado localmente, por lo que reconstrucción, pgTAP y Data API quedan como
gate del job `database` de CI antes de declarar la tarea verificada.

[FASE AUTH · AUTH-06] verificado — reset doble, pgTAP y matriz Data API para
cinco roles, AAL2, cuentas inactivas/no enlazadas y service role pasan en CI
`31932775104`.

[build] ocupado — Codex, BUG-124 · configuración con persistencia real.

[build] libre — Codex, BUG-124 · build terminado.

[calidad · BUG-124] corregido — configuración conserva solo notificaciones y
pipeline persistidos, más información operativa; retirados seis formularios
locales, campos de secretos y `/api/configuracion` inexistente. Suite: 724/724;
build/lint/typecheck: 0; audit: 0.

[build] ocupado — Codex, BUG-125 · plantillas en solo lectura.

[build] libre — Codex, BUG-125 · build terminado.

[calidad · BUG-125] corregido — plantillas usa `variables`, `usos` y fechas del
contrato persistido; el catálogo queda en solo lectura con vista previa aislada
y sin mutaciones locales. Suite: 726/726; build/lint/typecheck: 0; audit: 0.

[FASE AUTH · BUG-123] preparado — proveedor email activo con registro público
global cerrado; regresión contractual añadida. Suite: 633/633; audit: 0.

[FASE AUTH · BUG-123] verificado — puente email/password pasa contra Supabase
Auth real en CI, incluido reset doble y pgTAP.

[build] ocupado — Codex, AUTH-03 · MFA TOTP obligatorio para administración.

[build] libre — Codex, AUTH-03 · build terminado.

[FASE AUTH · AUTH-03] preparado — `SUPER_ADMIN` y `ADMIN` en modos Supabase
no reciben sesión CRM antes de TOTP/AAL2; enrolamiento, desafío, UI y ensayo
real de CI incluidos. Suite: 659/659; lint/typecheck: 0; audit: 0.

[FASE AUTH · BUG-123-DIAG] preparado — el ensayo CI informa solo código,
estado y mensaje truncado del error sintético. Suite: 632/632; audit: 0.

[FASE AUTH · BUG-123] en curso — CI confirmó `email_provider_disabled`; se
mantiene cerrado el registro público y se habilita el proveedor de login.

[build] ocupado — Codex, BUG-123 · proveedor email de Supabase Auth.

[build] libre — Codex, BUG-123 · build terminado.
