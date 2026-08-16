# Guía histórica retirada

`prisma/run-all-pending.sql` **no se ejecuta**. Pertenece a una arquitectura
anterior, contiene políticas amplias y se conserva únicamente para trazabilidad.
El propio archivo se detiene con una excepción antes de modificar la base.

No contiene una receta alternativa porque copiar SQL manual desde una guía
evita el historial, las pruebas y el orden de migraciones.

## Procedimiento vigente

- Entorno local y reconstrucción: `docs/supabase-migrations.md`.
- Cierre del Data API y Storage: `docs/supabase-hardening.md`.
- Respaldo y ensayo de recuperación: `docs/respaldos-externos.md`.
- Migraciones canónicas: `supabase/migrations/`.

Una persona autorizada debe comparar primero el esquema remoto sin datos,
ensayar en staging, conservar un respaldo restaurable y recién después evaluar
la misma versión para producción.
