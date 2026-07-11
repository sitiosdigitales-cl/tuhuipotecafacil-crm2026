-- Agregar columnas faltantes a la tabla leads
-- Ejecutar en Supabase SQL Editor

ALTER TABLE leads ADD COLUMN IF NOT EXISTS complementarrenta boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cuentapie boolean DEFAULT false;
