# Operación de migraciones Supabase

`supabase/migrations/20260813000000_application_schema.sql` reconstruye el
contrato de datos observado en el código y en el esquema histórico. No contiene
filas ni cuentas. No se afirma que ya sea idéntico al esquema remoto.

## Desarrollo local

Requiere Docker activo:

```bash
npm run db:start
npm run db:reset
npm run db:test
npm run db:stop
```

Un reset debe crear 27 tablas públicas y dejar vacías las tablas de clientes y
usuarios. Ejecutar el reset dos veces antes de aceptar una nueva migración.
Las pruebas también validan el puente estructural descrito en
`docs/auth-migration.md`; el reset no crea identidades ni contraseñas.

## Staging nuevo

Una persona autorizada crea un proyecto separado y entrega el acceso mediante
la CLI, nunca mediante archivos versionados. Después:

```bash
npx supabase link --project-ref "$SUPABASE_STAGING_PROJECT_REF"
npx supabase migration list --linked
npx supabase db push --dry-run
npx supabase db push
```

Probar login, leads, documentos, solicitudes, comisiones, Storage y webhooks con
datos sintéticos. No reutilizar claves ni datos de producción.

## Proyecto existente

No ejecutar la baseline sobre una base que ya contiene las tablas. Primero se
obtiene un dump sin datos y se compara con la reconstrucción local:

```bash
npx supabase db dump --linked --schema public --file /tmp/crm-public-schema.sql
npx supabase migration list --linked
```

Si la diferencia está explicada y la baseline describe el estado ya existente,
la persona responsable puede conciliar el historial:

```bash
npx supabase migration repair --linked --status applied 20260813000000
```

Las migraciones siguientes se marcan como aplicadas únicamente si existe
evidencia de que su cambio ya está presente. Nunca se usa `db push` para probar
si una baseline destructiva funciona en producción.

## Gate productivo

1. Respaldo restaurable y verificado.
2. Cadena completa aplicada en staging.
3. Diferencia de esquema revisada.
4. Consultas de comprobación preparadas.
5. Runbook de vuelta al modo server-only.
6. Aplicación humana durante una ventana controlada.

El repositorio no contiene tokens, contraseñas de base ni referencias privadas
de proyectos. La carpeta `supabase/.temp` permanece ignorada.
