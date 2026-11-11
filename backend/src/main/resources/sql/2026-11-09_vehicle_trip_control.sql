-- Operational trip history and request cancellation.
-- Run once against the application's PostgreSQL database before deploying this version.
ALTER TABLE administracionzonal.reservas_vehiculos
    ADD COLUMN IF NOT EXISTS salida_real timestamp,
    ADD COLUMN IF NOT EXISTS retorno_real timestamp,
    ADD COLUMN IF NOT EXISTS kilometraje_inicial bigint,
    ADD COLUMN IF NOT EXISTS kilometraje_final bigint,
    ADD COLUMN IF NOT EXISTS novedades text;

ALTER TABLE administracionzonal.reservas_vehiculos
    ALTER COLUMN observaciones TYPE text;
