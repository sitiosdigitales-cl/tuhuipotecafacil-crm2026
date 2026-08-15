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
