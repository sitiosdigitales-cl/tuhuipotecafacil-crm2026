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

La existencia de snapshots no demuestra recuperación. El procedimiento de
restauración debe ensayarse en un proyecto Supabase de staging vacío antes de
habilitar este workflow para producción.
