# Bitácora — Claude

Zona: backend, datos, seguridad. Ver `docs/agentes/PROTOCOLO.md` sección 2.

---

[FASE 0 · B-01+B-02] hecho — `npm run build` termina en 0 sin ninguna variable
de entorno. El bug estaba en **dos** archivos, no uno: `webhook/leads/route.ts`
y `webhook/email/route.ts` construían un cliente Supabase en el ámbito de
módulo con `|| ""`, y `createClient` lanza con URL vacía. El build solo mostraba
el primero porque se detenía ahí. Ambos duplicaban el `supabaseAdmin` que
`src/lib/supabase.ts` ya exporta, así que la corrección fue importarlo en vez
de recrearlo: cierra el build y borra la duplicación. −13 líneas.

Barrido de B-02 sobre los 105 endpoints: el resto de `createClient` están
dentro de funciones (`admin/fix-storage`, `debug/supabase`) o tienen fallbacks
válidos (`lib/supabase.ts` usa `https://placeholder.supabase.co`), así que no
lanzan. No queda ninguna otra ocurrencia del patrón.

[FASE 1 · SEC-01] hecho — requireAuth en `GET /api/leads` y `/api/leads/[id]`.
Rompe a proposito la busqueda por RUT del portal publico. `e053f58`

[FASE 1 · SEC-02] hecho — requireAuth en `GET /api/usuarios`. `a4524de`

[FASE 1 · SEC-03] hecho — borrados 8 endpoints de debug y mantenimiento,
429 lineas, cero referencias externas verificadas con grep. `6d99aea`

[FASE 1 · SEC-04] hecho — fuera el `"fallback-secret"` del JWT. El secreto se
resuelve por llamada, no al importar, para no romper el build sin env. `e4998a0`

[FASE 1 · SEC-05] PARCIAL, bloqueado en el ultimo paso — el plugin de
WordPress postea sin secreto, asi que volverlo obligatorio hoy corta la
captura de leads. Hecho lo reversible: el plugin envia `X-Webhook-Secret` si
esta definido, la API acepta la cabecera. Falta la secuencia humana (definir
el secreto en wp-config, instalar el plugin, configurar Vercel) antes de
exigirlo. `d050b85`

[FASE 1 · SEC-06] hecho — bloqueo de 15 min tras 5 intentos fallidos, contador
en la tabla porque serverless no comparte memoria. Migracion idempotente
incluida. Degrada sin bloquear a nadie si las columnas no existen. `fecd72d`

[FASE 1 · SEC-07] BLOQUEADO — no invento las reglas. Lo que encontre:

  - El tipo `Rol` declara SEIS roles: SUPER_ADMIN, ADMIN, GERENTE, AGENTE,
    CLIENTE, EJECUTIVO. Los `requireRole` del codigo solo usan cuatro.
    CLIENTE y EJECUTIVO no aparecen en ninguna comprobacion.
  - El unico modelo de permisos escrito esta en `src/modulos/permisos/`, que
    es codigo MUERTO (cero importaciones) y ademas dice lo contrario de lo
    que se pidio: `leads.ver` concedido a todos los roles, sin ninguna nocion
    de propietario. O sea, la intencion escrita es "todos ven todo".
  - Hay DOS campos de propiedad que compiten: `asignadoA` (id de usuario) y
    `nombreEjecutivo` (string con el nombre). Ningun endpoint filtra por
    ninguno de los dos.

  Preguntas que necesito respondidas antes de tocar esto:
    1. GERENTE, ve todos los leads o solo los de su equipo? Si es lo segundo,
       no existe tabla ni columna que relacione un GERENTE con sus agentes.
    2. AGENTE ve solo lo suyo, confirmado?
    3. Que son EJECUTIVO y CLIENTE, y siguen vivos?
    4. La propiedad se define por `asignadoA` o por `nombreEjecutivo`? Hay que
       elegir uno; mantener los dos es lo que produjo esta ambiguedad.

[FASE 2 · PERF-01] RESULTADO NEGATIVO — `next/dynamic` no difiere la descarga
de recharts en este proyecto. Medido en navegador contra el build de
produccion: /simulador-publico baja 1248 KB antes y 1248 KB despues, con 417 KB
de recharts emitidos como `<script src>` a los 98 ms pese a que los graficos
solo se pintan cuando existe `resultado`. Los docs de Next 16
(`01-app/02-guides/lazy-loading.md`) dicen que dynamic() por si solo "carga
inmediatamente, pero en un bundle separado"; aca el render ya es condicional y
aun asi baja, porque en una pagina cliente de 834 lineas todo lo alcanzable
entra al grafo. `8d0a54b` `40a48cc`

  Correccion de mi propio reporte: en `8d0a54b` anuncie "-172 KB". Esa medicion
  era de `.next/static/chunks` en disco, que NO es lo que descarga el
  navegador. Di a entender una mejora de usuario sin haberla verificado.

  PERF-01 no se cierra con dynamic(). El arreglo de fondo es convertir esas
  paginas en server components con islas cliente, que es Fase 5. Propongo
  repriorizar y que Codex lo verifique de forma independiente (C-07/C-08).

  Lo que si quedo: los graficos duplicados inline pasaron a un componente
  tipado y reutilizable, eslint baja de 28 a 25 errores en la pagina.

[FASE 2 · PERF-02] hecho — `useMemo` en el value de los cinco contextos,
`useCallback` en login, logout y cambiarUsuario, y memoizado
`cargaPorEjecutivo`, que se recalculaba con un reduce en cada render y por si
solo habria invalidado el memo. Premisa de re-render, no de bundling, asi que
no depende del empaquetador. Sin regresion de lint. `212b8cd`

[FASE 1 · BUG-001..019] hecho — cerrados los 19 hallazgos de Codex en cuatro
commits. La suite pasa de 17 fallando / 1 pasando a 31 pasando / 0 fallando.
`6349ef0` `26a0419` `b3d3e6b` `a890590`

  El patron era sistematico, no descuidos sueltos: en 19 archivos el POST ya
  tenia `requireAuth` y el GET no. Quien escribio esto protegio las escrituras
  y se olvidó de las lecturas, siempre. En varios el import ya estaba puesto
  sin usar, y en cinco el parametro se llamaba `_request` con guion bajo de no
  usado — la firma misma delataba que nadie penso en revisar sesion.

  Tres eran peores que exponer datos, porque permitian ESCRIBIR sin sesion:
    bancos                   cambiar o borrar tasas de convenio, que es con
                             lo que el simulador cotiza a los clientes
    notificaciones           borrar avisos ajenos, sabotaje silencioso
    whatsapp/send            enviar mensajes desde el numero corporativo
    flujos/triggers historial  inyectar ejecuciones falsas en la bitacora

  Decision que tome y conviene revisar: en bancos separe lectura de escritura.
  GET pide sesion; POST, PUT y DELETE piden ademas rol SUPER_ADMIN o ADMIN.
  No lo invente: sigue el precedente de pipeline/stages y cmf/update, que ya
  usan esos dos roles para configuracion del sistema. Uso los dos guards en
  vez de solo requireRole para que sin sesion responda 401 y con sesion sin
  permiso responda 403; requireRole solo daria 403 en ambos casos.

[nota · proceso] Un build fallo con "Another next build process is already
running". No era codigo roto: Codex compilaba en paralelo. Es exactamente la
colision que anticipa la seccion 2bis del PROTOCOLO, y el marcador de bitacora
sirvio para diagnosticarla en un minuto. La regla funciona.

[nota · fuera de mi tarea] `webhook/leads/route.ts` imprimia con console.log
los primeros 500 caracteres del cuerpo de cada request. Eso manda RUT, renta y
telefono a los logs de Vercel. Quite los dos logs del bloque del secreto en
`d050b85`, pero el del cuerpo sigue ahi porque es otra tarea.

[nota · fuera de mi tarea] `crm-webhook-plugin.php` tenia un token de bypass de
Vercel en texto plano (`x-vercel-protection-bypass`). El patron
`a1b2c3d4e5f6...` parece placeholder; si fuera real es una credencial filtrada,
y si es falso el bypass nunca funciono. Lo saque al reescribir las cabeceras.

[nota · bloqueo de infra] No puedo pushear: `git push origin diego` devuelve
403, `Permission to sitiosdigitales-cl/tuhuipotecafacil-crm2026.git denied to
Godblessdiego`. La cuenta tiene lectura pero no escritura sobre el repo de la
organización. Los commits quedan locales hasta que se resuelva el acceso.
**Codex tampoco va a poder pushear ni sincronizarse.** Esto bloquea el
protocolo completo, no solo mi cola.

[nota · fuera de mi tarea] El commit `a169ae7` borró toda la carpeta `public/`,
incluido `formulario-leads.html` (635 líneas). `vercel.json:8` todavía tiene una
regla de headers solo para ese archivo, con `X-Frame-Options: ALLOWALL` y
`frame-ancestors *` — eso solo se escribe cuando la página se embebe como
iframe desde otro dominio, o sea desde el WordPress. Es una vía de captura de
leads que ahora responde 404. No lo toco porque no es mi tarea y hay una
decisión pendiente de Diego. Se restaura con
`git checkout a169ae7^ -- public/`.

[FASE 1 · SEC-07] COMPLETA — consolidacion de roles `f0181c8`, propiedad de
escritura `f024bbe`, alcance de lectura y portal `bfec329`. La regla unica vive
en `src/lib/permisos-lead.ts`.

[FASE 1 · portal] hecho — el cliente se identifica por sesion, no por RUT.
Nuevo `GET /api/portal/mi-solicitud`, fuera `useLeads()` del portal,
`/portal-cliente` pasa a ruta protegida en el middleware. `bfec329`

[nota · para Codex] Dos pruebas quedan en rojo y no las toco:
  tests/portal/busqueda-rut.test.tsx — obsoleta, maneja UI que elimine.
  tests/api/lead-detail-agent-read-isolation.test.ts — no puede pasar: su
  mock de `forbidden` devuelve Response sin cuerpo y luego hace
  `response.json()`, que lanza antes de comprobar el status.

[nota · Resend] Verificado en los docs: Resend soporta correo entrante con
evento `email.received`. Detalle que cambia la implementacion: el webhook trae
solo METADATOS, no el cuerpo ni los adjuntos; hay que pedirlos a la API de
Received Emails. Ademas entrega via Svix (cabeceras `svix-*`), asi que la
verificacion de firma no es la que escribi a mano en `webhook/email`.

[build] ocupado — Claude, AUTH-04. Worktree propio (`crm2026-auth04-b`) con su
propio `.next`, asi que no colisiona con el build del arbol principal.

[build] libre — Claude, AUTH-04. Build, suite, lint, typecheck y audit en verde.

[FASE AUTH · AUTH-04] hecho — recuperacion de contraseña por Supabase Auth:
solicitud, callback, cambio, expiracion y respuestas neutras. Rama
`claude/auth-04-staging-base` desde `45ea5c7` de `origin/diego`, sin push.

  Sin colision con STG-01: ese commit toca ocho archivos de documentacion, CI y
  scripts, y AUTH-04 no entra en ninguno. Los conjuntos son disjuntos, asi que
  el orden en que se integren no importa.

  El enlace lo emite `admin.generateLink({type:'recovery'})` y lo entrega
  Resend, no el SMTP de Supabase: el resto del correo del CRM ya sale por ahi
  y el servicio por defecto de Supabase limita a dos correos por hora.

  Tres decisiones que conviene revisar, porque no eran las obvias:

  1. El canje NO reusa `crm_sb_access`. Si lo hiciera, abrir el enlace del
     correo entregaria una sesion completa del CRM sin pasar por contraseña ni
     por el TOTP que AUTH-03 exige a SUPER_ADMIN y ADMIN. La cookie es
     `crm_rec_access`, y solo la lee `/api/auth/recuperacion/confirmacion`;
     `validarSesionSolicitud` no la mira. El callback ademas cierra cualquier
     sesion abierta en ese navegador antes de dejar la suya.

  2. La expiracion no depende de la cookie. Un `maxAge` lo controla el
     navegador y quien tenga el token puede ignorarlo. La ventana de 15 minutos
     se comprueba en el servidor contra el `iat` del access token, que va
     firmado por Supabase: adelantarlo rompe `getUser`. Encima queda la
     caducidad propia del token del correo, que Supabase consume en el canje.

  3. El cambio usa `actualizarIdentidadAdministrada` (service role) en vez de
     `updateUser`, asi no hace falta guardar refresh token: sin el, la sesion
     de recuperacion no se puede prolongar. Despues revoca en alcance global,
     dentro de su propio try, porque la contraseña YA cambio y un fallo de la
     revocacion no puede convertir un exito en 500.

  Respuestas neutras: cuenta inexistente, inhabilitada, sin `auth_user_id`,
  dentro de la ventana de espera o correo enviado devuelven el MISMO 200 con la
  misma frase. Solo un correo mal formado da 400, y eso no dice nada sobre que
  cuentas existen.

  Migracion `20260817000000_recuperacion_password.sql`: columna
  `recuperacion_enviada_en` y RPC `reclamar_recuperacion_password`, que reserva
  el turno en el mismo UPDATE que lo comprueba. Sin esto, un tercero repite el
  formulario con el correo de alguien del equipo y le llena el buzon, y como la
  respuesta es neutra no hay señal de que este pasando. NO la ejecute: queda
  para el paso humano de la seccion 11. Si falta, el codigo degrada abierto
  (envia sin espera) y lo avisa por consola; degradar cerrado dejaria al equipo
  sin forma de recuperar su cuenta.

  Toque `tests/api/route-session-coverage.test.ts` para registrar los tres
  endpoints en `EXCEPCIONES_SIN_SESION` con su justificacion — es el mecanismo
  que el propio test define para un endpoint publico, no un relajo del guardia.
  Y subi de 4 a 5 el conteo de cookies borradas en tres pruebas de cierre de
  sesion, porque `eliminarCookiesSesion` ahora tambien tumba `crm_rec_access`.

[nota · AUTH-04, limitaciones] Tres, ninguna bloqueante:

  - Una cuenta sin `auth_user_id` (solo hash legado) no se puede recuperar:
    responde neutro y no envia nada. Es justo la que el login en modo
    `required` manda a "solicitar recuperacion", asi que ese circuito queda
    abierto. Cerrarlo es crear la identidad en Auth durante la recuperacion, y
    eso es AUTH-01/AUTH-02, no esta tarea. No lo invento por mi cuenta.
  - El token viaja en la query del callback, o sea entra a los logs de acceso
    de Vercel. Lo acota que Supabase lo consume en el primer canje y que la
    ventana es corta. Sacarlo de ahi obliga a moverlo al fragmento y postearlo
    desde el cliente.
  - Queda un canal por tiempo: una cuenta real gasta generateLink mas el envio
    por Resend, una inventada responde de inmediato. El login iguala esto
    comparando contra un hash de descarte; aca no hay equivalente barato. Lo
    dejo escrito en vez de fingir que no existe.

[EMAIL-01] hecho — vuelve el correo entrante por piping de cPanel. Diego
confirmo que el correo del dominio no se puede mover, y el inbound de Resend
exige apuntar los MX a Resend: son incompatibles. Rama
`claude/email-piping-cpanel` desde `77b036d`, sin push.

  Revision antes de restaurar, y encontre TRES defectos en lo que iba a
  devolver. Restaurarlo verbatim habria devuelto algo que no funcionaba:

  1. `parseEmailFromSTDIN()` leia `php://input`, que es el cuerpo de una
     peticion HTTP y esta VACIO en CLI. El piping invoca el script como CLI y
     entrega por STDIN. O sea el camino registraba "STDIN vacio" y salia con
     error: nunca creo un lead. Corregido a `php://stdin`.
  2. El log iba a `__DIR__/email-handler.log` con el script bajo `public_html`,
     segun su propia cabecera. Ese log lleva remitente y asunto de CADA lead, y
     quedaba descargable desde el navegador. Ahora sale del arbol web por
     omision y la ruta es configurable.
  3. El destino estaba hardcodeado a `tuhuipotecafacil-crm.vercel.app`, que no
     es el dominio al que apunta el plugin de WordPress
     (`tuhuipotecafacil-crm2026-sitiosdigitales`). No se cual de los dos vive,
     asi que no elegi: pasa a `CRM_EMAIL_WEBHOOK_URL`, obligatoria.

  Tambien hice obligatorio el secreto en el script. Antes era opcional y sin el
  mandaba el POST igual, que el endpoint responde 401: perdia el correo despues
  de gastar el viaje, en vez de detenerse y dejarlo escrito en el log.

  La ruta NO es un revert. Tres commits la tocaron despues del borrado —
  `64bc68f` limites de cuerpo, `5f3d9ee` escape de HTML, `c4501cb` cliente
  admin— y dos son arreglos de seguridad. Cambie solo la capa de transporte y
  autenticacion: fuera Svix y la consulta de metadatos, vuelve
  `X-Webhook-Secret` contra `EMAIL_WEBHOOK_SECRET`. Los tres arreglos quedan.

  No restaure las ramas de multipart y urlencoded. Eran para SendGrid y
  Mailgun, que nunca se usaron, y la de multipart ni siquiera podia funcionar:
  llamaba `request.formData()` despues de `request.text()`, con el cuerpo ya
  consumido. El unico productor es nuestro handler y manda JSON.

  El PHP queda en `wordpress/`, no en `crm/`, que es donde el PROTOCOLO seccion
  8 dice que vive el codigo que se despliega a otra maquina.

  Ajuste dos aserciones invalidadas por el cambio de mecanismo: la de firma
  Svix pasa a secreto por cabecera, y la del limite de 256 KiB ahora manda el
  secreto, porque la autenticacion se comprueba ANTES de leer el cuerpo y sin
  el respondia 401 en vez de 413.

[nota · EMAIL-01, sin verificar] No puedo confirmar desde el repositorio si el
camino esta caido en produccion ni desde cuando. Lo que si consta:
`docs/configurar-dns-nic-cl.md` dice explicitamente "si ya tienes un registro MX
para tu correo, no lo borres", y ningun documento describe apuntar los MX a
Resend. O sea el inbound de Resend nunca se cableo, y desde `6b99a73` el correo
sigue cayendo en cPanel sin que nadie lo procese. Falta revisar los MX reales y
si hay leads con `origen = email_corporativo` posteriores a esa fecha.

[FASE AUTH · AUTH-04-TOKEN] hecho — el token sale de la query. El correo apunta
a `/recuperar-contrasena/canje#token=…`; el fragmento no viaja al servidor, la
pagina lo borra con `history.replaceState` ANTES de usarlo y lo postea en el
cuerpo. El callback pasa a POST y ya no exporta GET, asi que un `?token=` contra
ese endpoint responde 405 en vez de canjear. `Referrer-Policy: no-referrer` y
`no-store` los pone el endpoint y tambien el proxy para toda
`/recuperar-contrasena/**`, que por eso salio de la exclusion del matcher.

  Detalle que costo encontrar: el efecto de la pagina corre dos veces con
  StrictMode. Sin una guarda por ref, el segundo pase encontraba el fragmento
  ya limpio y anulaba el canje del primero — y el token es de un solo uso.

  Actualice tres pruebas que el cambio invalido, solo lo mecanico: la excepcion
  `callback#GET` pasa a `#POST`, la URL esperada del correo, y la suite del
  callback pasa de GET+query a POST+cuerpo. Las pruebas NUEVAS (fragmento,
  replaceState, piso de tiempo, liberacion de turno) son de Codex.

[FASE AUTH · AUTH-04-TIEMPO] hecho — piso de 1.000 ms con `performance.now`,
que es monotonico; `Date.now` salta si alguien corrige la hora del sistema y
podia devolver una espera negativa o eterna. Lo esperan los seis desenlaces que
dependen de la cuenta: inexistente, inactiva, no enlazada, en espera, envio
aceptado y el catch posterior a la consulta. El error de formato NO lo espera —
no depende de que la cuenta exista y retrasarlo solo castiga a quien escribio
mal el correo.

  Efecto colateral para Codex: `tests/auth/recuperacion-solicitud-neutra.test.ts`
  pasa de 7 ms a ~7 s porque cada caso paga el piso. Sigue bajo el limite de 5 s
  por prueba, pero si le molesta el reloj real, `esperarPisoRespuesta` acepta el
  piso por parametro.

[FASE AUTH · AUTH-04-ENTREGA] hecho — el booleano de `enviarEmailRecuperacion`
deja de ignorarse. Si Resend rechaza o falta `RESEND_API_KEY`, la respuesta
publica sigue siendo la neutra —no hay forma de avisar sin delatar que la
cuenta existe— pero el turno se suelta para reintentar de inmediato, y queda
una señal en consola sin correo, sin nombre y sin identificador. Mismo trato
para `generateLink` fallido y para el catch posterior a la reserva.

  Por que el turno necesito identificador: soltarlo con un UPDATE a NULL es
  incorrecto. Si la peticion que fallo tarda mas que la ventana, para cuando
  libere ya puede haber otra solicitud con su propio turno vigente, y le
  borraria el suyo. `liberar_recuperacion_password` compara el identificador,
  asi que solo suelta quien lo tomo. Es el mismo patron del claim de
  `reclamar_migracion_auth`.

  Migracion NUEVA `20260818000000_recuperacion_password_turno.sql`, sin tocar la
  de AUTH-04: agrega `recuperacion_turno`, retira la RPC de dos argumentos —no
  la deja como sobrecarga, porque ese camino no marcaria el turno— y crea la de
  tres mas la de liberacion.

  RIESGO QUE HAY QUE MIRAR: si se aplica la migracion de AUTH-04 pero NO esta,
  el codigo llama a la RPC de tres argumentos, PostgREST responde PGRST202 y el
  control de frecuencia queda DESACTIVADO en silencio (degrada abierto y lo
  avisa por consola). Las dos migraciones tienen que viajar juntas.

[build] ocupado — Claude, AUTH-07. Worktree `crm2026-auth07`, `.next` propio.

[build] libre — Claude, AUTH-07. Build, suite, lint y typecheck en verde.

[FASE AUTH · AUTH-07] hecho — BUG-137 cerrado. Una cuenta activa con hash
heredado y sin `auth_user_id` ya completa la recuperacion:
LEGADA - RESERVADA - PENDIENTE - ENLAZADA. Rama `claude/auth-07` desde
`144d5f6`, cuatro commits, sin push.

  Correcciones al diseño que Codex marco y que confirme en el codigo:

  1. El CHECK que propuse era imposible. La reserva se gana ANTES de que exista
     el UUID de Auth, asi que hay un estado con turno y fecha pero sin
     identidad. Quedaron tres restricciones: turno y fecha aparecen juntos, una
     identidad registrada exige las dos, y pendiente y enlazada se excluyen.
  2. `ON DELETE SET NULL` solo limpia su propia columna. Borrar la identidad
     dejaba fecha y turno huerfanos, que ademas bloqueaban la siguiente
     reserva. Lo resuelve un disparador BEFORE DELETE sobre `auth.users`, que
     corre antes de que la clave foranea anule la columna y todavia encuentra
     la fila.
  3. `completar_migracion_auth` fijaba `auth_user_id` sin limpiar lo pendiente
     y violaba la exclusion. Redefinida para limpiar los tres campos.

  Decision propia que conviene revisar: NO revoque EXECUTE sobre la funcion del
  disparador. Una funcion de disparador no se puede invocar directamente
  —PostgreSQL lo rechaza—, asi que restringirla no aporta nada; y si el
  privilegio se comprobara al dispararse, romperia el borrado de usuarios en
  Auth para `supabase_auth_admin`. El riesgo es asimetrico. pgTAP no lo exige.

  Orden de la confirmacion, que no es negociable: contraseña, promocion de
  metadatos y enlace atomico. Al reves, un fallo intermedio dejaria la cuenta
  con `auth_user_id` puesto, hash retirado y sin `crm_user_id`:
  `validarSesionSupabase` la rechaza y no queda ninguna credencial utilizable.

[FASE AUTH · AUTH-07] verificado en local — Diego instalo Docker Desktop, asi
que las compuertas de base de datos ya no quedan solo como gate de CI:
reconstruccion doble de las once migraciones, 141 comprobaciones pgTAP en seis
archivos y `recovery-integration.mjs` devolviendo `Legacy recovery integration:
OK` con salida 0. Contenedores detenidos al terminar.

  Nota de instalacion: `brew install --cask docker-desktop` falla sin terminal
  interactivo porque enlaza `docker-credential-osxkeychain` en `/usr/local/bin`
  con `sudo`. Con `--no-binaries` se omite ese enlace y la instalacion termina;
  ese binario solo guarda credenciales de registries y no hace falta para
  levantar Supabase local.

[EMAIL-02 · BUG-140] hecho — el piping ya no pierde correos Latin-1. Solo E-1;
E-2 a E-5 quedan intactos para sus propias pruebas.

  Dos piezas distintas, y las dos hacen falta: la CONVERSION desde el charset
  declarado es el camino correcto y conserva los acentos; la bandera
  `JSON_INVALID_UTF8_SUBSTITUTE` es la ultima red y los destruye. Verificado:
  con la bandera sola, `Credito para Jose Pena` llega con rombos donde iban los
  acentos. Por eso la bandera solo entra en un segundo `json_encode`, cuando el
  primero ya fallo.

  Convertir desde un charset equivocado NO falla, produce basura en silencio.
  Por eso la declaracion no se obedece a ciegas: si dice UTF-8 y los bytes no
  son UTF-8 valido, la cabecera se contradice a si misma y se detecta en vez de
  hacerle caso. Sin ese ajuste el caso quedaba en `Cr?dito para Jos? Pe?a`.

  Comprobado de punta a punta contra un servidor local, cinco escenarios:
  charset declarado, ausente, mentiroso, UTF-8 real y ASCII puro. Los cinco
  conservan los acentos y salen con 0.

  El JSON pasa a estructura fija de cinco campos construida uno por uno. Antes
  se serializaba el arreglo de cabeceras completo, que lo llena quien envia el
  correo. Si la serializacion falla aun con la red, el handler sale con 1 y NO
  postea: un cuerpo vacio recibia 200 y perdia el correo sin que el codigo de
  salida lo reflejara.

  Sin contenido, sin Message-ID y sin valores derivados del mensaje en el log.

[build] ocupado — Claude, PIPE-01.
[build] libre — Claude, PIPE-01. Build, suite, lint, typecheck y doble reset en verde.

[PIPE-01] hecho — la configuracion del pipeline persiste y el tablero la
renderiza. `public.pipeline_stages` pasa a ser la unica fuente.

  El arreglo `etapasEnMemoria` no era un respaldo, era la causa: vivia en el
  proceso, y en Vercel eso no persiste ni se comparte entre instancias. GET
  rellenaba con el arreglo estatico las etapas que faltaban en la base, asi que
  una etapa recien eliminada reaparecia; y editar una etapa predeterminada
  lanzaba un UPDATE contra una fila que nunca se habia insertado. Eliminado por
  completo, no reemplazado.

  Migracion nueva `20260821000000_pipeline_stages_semilla.sql`, aditiva e
  idempotente: inserta las 15 etapas iniciales solo si faltan por id, y nunca
  pisa nombre, color ni estado de una ya personalizada. Verificado contra la
  base local: 15 tras el reset, reaplicarla no duplica, una etapa renombrada
  conserva su nombre y una personalizada sobrevive.

  Detalle que obligo a escribir la semilla como bucle y no como INSERT unico:
  `pipeline_stages` tiene UNIQUE (orden). Si una etapa personalizada ya ocupa
  el orden canonico de una semilla, un INSERT plano falla y la migracion se
  cae entera. Ahora esa semilla se coloca al final. Probado: con una etapa
  personalizada en el orden 5, la semilla correspondiente quedo en el 6 y las
  16 filas entraron sin error.

  POST, PUT y DELETE dejan de responder success:true cuando la escritura fallo.
  PUT comprueba que la fila exista y devuelve 404 si no; DELETE tambien, y ya no
  se traga el error al contar leads: si no puede comprobarlo, no borra. POST
  calcula el orden desde la base, no desde el largo de un arreglo local, que era
  lo que hacia chocar dos instancias contra UNIQUE (orden). El id derivado del
  nombre puede quedar vacio —un nombre de solo simbolos— y ahora eso es un 400
  en vez de una fila con id "".

  El tablero consume {id,nombre,color,orden,activa} y pinta desde la API. Antes
  reducia la respuesta a ids y volvia a `ETAPAS_CONFIG[etapa]`, que para una
  etapa personalizada es undefined y reventaba en `config.color`. No lo tape con
  un cast: el modelo dinamico vive en `EtapaPipeline` y `etapasPorDefecto()`
  deriva el respaldo del propio ETAPAS_CONFIG para no mantener dos listas.
  `ETAPAS_POR_DEFECTO` quedo muerto y se borro, verificado con grep: cero usos.

  Las reglas de transicion no se tocaron. `validarAvance` ya hace
  `REGLAS_POR_ETAPA[destino] || []`, asi que una etapa personalizada acepta
  leads sin reglas y las conocidas conservan las suyas. `leads.etapa` es TEXT
  sin CHECK ni FK, comprobado, asi que puede sostener ids personalizados.

  Nombre y color se guardan al salir del campo, no por tecla. El selector de
  color tambien dispara onChange en cada paso del arrastre, asi que recibio el
  mismo trato aunque el encargo solo mencionaba el nombre.

[nota · PIPE-01, cambio visible] La base y el tablero tenian nombres distintos
para las mismas etapas: el tablero mostraba "Calificacion", "Pre Aprobacion" y
"Firma" desde ETAPAS_CONFIG, y Configuracion mostraba "Calificacion Comercial",
"Preaprobado" y "Firma Digital" desde el arreglo de la API. Con una sola fuente
hay que elegir una: la semilla usa los nombres de la API, que son los mas
descriptivos. Tres etiquetas del tablero cambian de texto.

[nota · fuera de mi tarea] Seis vistas leen `ETAPAS_CONFIG[lead.etapa]` sin
guarda y luego usan el resultado: leads/[id], clientes, clientes/[id],
usuarios/[id], leads y PortalClienteContent. Con una etapa personalizada esas
paginas tienen el mismo fallo que acabo de corregir en el tablero. No las toco
porque no son de esta tarea; queda anotado.

[nota · para Codex] PIPE-01 va sin pruebas de regresion. El encargo decia
"agrega o solicita a Codex", y `tests/**` es zona Codex por la seccion 3, asi
que las pido en vez de escribirlas. Hacen falta dos frentes: contrato de la API
—PUT sobre etapa inexistente devuelve 404, DELETE con leads asociados devuelve
400, error de Supabase nunca devuelve success:true, POST con nombre sin
caracteres validos devuelve 400 y dos POST con el mismo nombre dan 409— y
render dinamico —una etapa que no existe en ETAPAS_CONFIG se pinta con su
nombre y color, y una inactiva no aparece como columna.
