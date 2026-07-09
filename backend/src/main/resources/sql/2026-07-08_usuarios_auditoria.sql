-- Auditoria para tabla usuarios
-- Ejecutar una sola vez en PostgreSQL si las columnas no existen.

ALTER TABLE administracionzonal.usuarios
ADD COLUMN IF NOT EXISTS created_at timestamp,
ADD COLUMN IF NOT EXISTS updated_at timestamp,
ADD COLUMN IF NOT EXISTS last_login_at timestamp,
ADD COLUMN IF NOT EXISTS created_by varchar(100),
ADD COLUMN IF NOT EXISTS updated_by varchar(100),
ADD COLUMN IF NOT EXISTS bloqueado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_bloqueo varchar(255);

UPDATE administracionzonal.usuarios
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    created_by = COALESCE(created_by, cedula, 'sistema'),
    updated_by = COALESCE(updated_by, cedula, 'sistema'),
    bloqueado = COALESCE(bloqueado, false)
WHERE created_at IS NULL
   OR updated_at IS NULL
   OR created_by IS NULL
   OR updated_by IS NULL
   OR bloqueado IS NULL;
