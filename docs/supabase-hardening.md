# Cierre de acceso público en Supabase

La migración `supabase/migrations/20260816000000_lock_down_anon_and_storage.sql` está
preparada, pero **no fue aplicada a producción por Codex**. Requiere acceso al
proyecto Supabase y una ventana de verificación humana.

## Requisitos previos

1. Desplegar como mínimo los commits `c4501cb`, `a3adbc1`, `fdef19e` y
   `70726fe`.
2. Confirmar en el entorno del servidor `NEXT_PUBLIC_SUPABASE_URL` y
   `SUPABASE_SERVICE_ROLE_KEY`. La service role nunca va al navegador.
3. Verificar en staging: login, listado de leads, mensajes, notificaciones,
   subida y descarga de documentos, portal del cliente y webhooks externos.
4. Generar un respaldo de base y confirmar acceso de recuperación antes del SQL.

## Aplicación

Ejecutar la migración primero en staging y luego en producción. No ejecutar
`prisma/run-all-pending.sql`: contiene el esquema histórico permisivo y ahora se
detiene de forma explícita.

La migración:

- habilita RLS y elimina políticas de todas las tablas de `public`;
- revoca tablas, vistas, funciones y secuencias a `anon` y `authenticated`;
- concede las operaciones de la aplicación a `service_role`;
- retira todas las tablas `public` de `supabase_realtime`;
- vuelve privados `documentos` y `backups`, limita documentos a 10 MB y MIME
  conocidos;
- conserva las políticas de otros buckets y agrega una regla restrictiva que
  impide a `anon` y `authenticated` operar sobre los dos buckets del CRM.

## Verificación posterior

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public';

select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname = 'crm_private_buckets_server_only';

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('documentos', 'backups');

select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public';
```

Resultado esperado: todas las tablas con `rowsecurity = true`, ninguna política
en `public`, la política restrictiva de Storage presente, ambos buckets privados
y cero tablas públicas en Realtime.

Después repetir el smoke test. Un fallo general de las APIs normalmente indica
que falta o es incorrecta `SUPABASE_SERVICE_ROLE_KEY`; se corrige el entorno,
no se vuelve a abrir acceso anónimo.

Referencias: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[buckets privados](https://supabase.com/docs/guides/storage/buckets/fundamentals),
[control de Storage](https://supabase.com/docs/guides/storage/security/access-control)
y [Data API](https://supabase.com/docs/guides/api/securing-your-api).
