-- SEC-06 · Bloqueo por intentos fallidos de login
--
-- Las columnas ya estaban declaradas en prisma/seed-usuarios.sql pero ningun
-- codigo las leia ni las escribia. Este ALTER es idempotente: si la base de
-- produccion ya las tiene, no hace nada.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intentosfallidos INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS suspendidohasta TIMESTAMP WITH TIME ZONE;

-- Los login fallidos consultan por email; el desbloqueo compara suspendidohasta
-- contra la hora actual.
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Desbloquea cualquier cuenta que hubiera quedado con datos previos
UPDATE usuarios SET intentosfallidos = 0, suspendidohasta = NULL;
