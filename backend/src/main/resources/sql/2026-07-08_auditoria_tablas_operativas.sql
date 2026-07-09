-- Auditoria transversal para tablas operativas.
-- Ejecutar una sola vez en PostgreSQL.

ALTER TABLE administracionzonal.usuarios_roles
ADD COLUMN IF NOT EXISTS created_at timestamp,
ADD COLUMN IF NOT EXISTS updated_at timestamp,
ADD COLUMN IF NOT EXISTS created_by varchar(100),
ADD COLUMN IF NOT EXISTS updated_by varchar(100);

ALTER TABLE administracionzonal.reservas_coworking
ADD COLUMN IF NOT EXISTS created_at timestamp,
ADD COLUMN IF NOT EXISTS updated_at timestamp,
ADD COLUMN IF NOT EXISTS created_by varchar(100),
ADD COLUMN IF NOT EXISTS updated_by varchar(100);

ALTER TABLE administracionzonal.reserva_cancha
ADD COLUMN IF NOT EXISTS created_at timestamp,
ADD COLUMN IF NOT EXISTS updated_at timestamp,
ADD COLUMN IF NOT EXISTS created_by varchar(100),
ADD COLUMN IF NOT EXISTS updated_by varchar(100);

ALTER TABLE administracionzonal.reservas_vehiculos
ADD COLUMN IF NOT EXISTS created_at timestamp,
ADD COLUMN IF NOT EXISTS updated_at timestamp,
ADD COLUMN IF NOT EXISTS created_by varchar(100),
ADD COLUMN IF NOT EXISTS updated_by varchar(100);

ALTER TABLE administracionzonal.orden_movilizacion
ADD COLUMN IF NOT EXISTS created_at timestamp,
ADD COLUMN IF NOT EXISTS updated_at timestamp,
ADD COLUMN IF NOT EXISTS created_by varchar(100),
ADD COLUMN IF NOT EXISTS updated_by varchar(100);

UPDATE administracionzonal.usuarios_roles
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    created_by = COALESCE(created_by, 'sistema'),
    updated_by = COALESCE(updated_by, 'sistema')
WHERE created_at IS NULL
   OR updated_at IS NULL
   OR created_by IS NULL
   OR updated_by IS NULL;

UPDATE administracionzonal.reservas_coworking
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    created_by = COALESCE(created_by, id_usuario::varchar),
    updated_by = COALESCE(updated_by, id_usuario::varchar)
WHERE created_at IS NULL
   OR updated_at IS NULL
   OR created_by IS NULL
   OR updated_by IS NULL;

UPDATE administracionzonal.reserva_cancha
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    created_by = COALESCE(created_by, id_usuario::varchar),
    updated_by = COALESCE(updated_by, id_usuario::varchar)
WHERE created_at IS NULL
   OR updated_at IS NULL
   OR created_by IS NULL
   OR updated_by IS NULL;

UPDATE administracionzonal.reservas_vehiculos
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    created_by = COALESCE(created_by, id_usuario::varchar),
    updated_by = COALESCE(updated_by, id_usuario::varchar)
WHERE created_at IS NULL
   OR updated_at IS NULL
   OR created_by IS NULL
   OR updated_by IS NULL;

UPDATE administracionzonal.orden_movilizacion
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    created_by = COALESCE(created_by, 'sistema'),
    updated_by = COALESCE(updated_by, 'sistema')
WHERE created_at IS NULL
   OR updated_at IS NULL
   OR created_by IS NULL
   OR updated_by IS NULL;
