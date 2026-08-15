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
