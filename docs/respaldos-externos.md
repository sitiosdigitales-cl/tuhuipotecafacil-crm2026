# Respaldos externos en Cloudflare R2

El workflow `.github/workflows/external-backup.yml` prepara cada hora un
respaldo portable y lo guarda cifrado por Restic en una cuenta Cloudflare R2
independiente del proyecto Supabase. Está desactivado por defecto: publicar el
código no inicia lecturas de producción ni crea recursos externos.

## Contenido

- `database/roles.sql`: roles exportados por la CLI fijada de Supabase.
- `database/schema.sql`: esquema portable, excluyendo esquemas administrados.
- `database/data.sql`: datos de los esquemas de aplicación y datos restaurables
  de Auth/Storage que la CLI admite.
- `storage/storage-manifest.json`: rutas, tamaños, MIME y SHA-256.
- `storage/objects/*.bin`: contenido binario de `documentos` y `backups`, con
  nombres locales derivados por hash para que una ruta remota no controle el
  sistema de archivos.

Restic cifra contenido y metadatos antes de transmitirlos. No se usan artifacts
de GitHub y el directorio temporal se elimina aun cuando falla una etapa.

## Configuración humana

Crear un bucket R2 dedicado, credenciales limitadas a ese bucket y estos
secrets del repositorio, sin copiar sus valores a archivos ni tickets:

- `SUPABASE_DB_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_BACKUP_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `RESTIC_PASSWORD`

La contraseña de Restic debe guardarse también en el gestor corporativo de
secretos: perderla hace irrecuperables los snapshots. Después de configurar los
secrets, crear la variable `ENABLE_EXTERNAL_BACKUPS=true` y ejecutar primero
`workflow_dispatch`. Solo entonces aceptar la programación horaria.

## Retención y monitoreo

Se conservan 48 snapshots horarios, 14 diarios, 8 semanales y 12 mensuales.
Cada ejecución verifica hashes locales, el manifiesto de Storage y los metadatos
del repositorio Restic. Configurar notificaciones de GitHub Actions para el
equipo responsable; una ejecución roja implica incumplimiento potencial del
RPO de una hora.

## Ensayo de restauración

`.github/workflows/restore-drill.yml` es exclusivamente manual y usa el
environment protegido `staging-restore`. El equipo debe configurar revisores,
los secrets `TARGET_SUPABASE_DB_URL`, `TARGET_SUPABASE_URL` y
`TARGET_SUPABASE_SERVICE_ROLE_KEY`, y la variable
`ENABLE_RESTORE_DRILLS=true`.

El destino debe ser un proyecto Supabase de staging nuevo, con cero tablas en
`public`. El workflow exige escribir `RESTORE_EMPTY_STAGING`, restaura roles,
esquema y datos en transacciones, repone cada objeto mediante la API de Storage
y vuelve a descargarlo para comprobar tamaño y SHA-256. Se detiene si el tiempo
total supera 14.400 segundos, equivalente al RTO máximo de cuatro horas.

La primera ejecución sigue siendo una acción humana: este repositorio no crea
proyectos, no configura secrets y no ejecuta restauraciones contra producción.
Guardar el reporte de duración y recuentos en el registro del simulacro.
