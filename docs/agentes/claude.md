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
