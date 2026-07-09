-- Auditoria para solicitudes_vehiculo
-- Ejecutar una sola vez en PostgreSQL si las columnas no existen.

ALTER TABLE administracionzonal.solicitudes_vehiculo
ADD COLUMN IF NOT EXISTS created_at timestamp,
ADD COLUMN IF NOT EXISTS updated_at timestamp,
ADD COLUMN IF NOT EXISTS created_by varchar(100),
ADD COLUMN IF NOT EXISTS updated_by varchar(100);

UPDATE administracionzonal.solicitudes_vehiculo
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    created_by = COALESCE(created_by, 'sistema'),
    updated_by = COALESCE(updated_by, 'sistema')
WHERE created_at IS NULL
   OR updated_at IS NULL
   OR created_by IS NULL
   OR updated_by IS NULL;
