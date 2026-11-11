-- Cambios para trazabilidad de reservas, capacidad de coworking y bloqueos de cancha.
-- Aplicar una vez en la base institucional antes de desplegar esta versión.

ALTER TABLE administracionzonal.usuarios
    ADD COLUMN IF NOT EXISTS cancha_bloqueado boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS motivo_bloqueo_cancha varchar(255);

ALTER TABLE administracionzonal.reservas_coworking
    ADD COLUMN IF NOT EXISTS numero_personas integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS estado varchar(20);

UPDATE administracionzonal.reservas_coworking
SET estado = CASE
    WHEN no_asistio THEN 'NO_ASISTIO'
    WHEN asistio OR usado THEN 'ASISTIO'
    ELSE 'RESERVADO'
END
WHERE estado IS NULL;

ALTER TABLE administracionzonal.reserva_cancha
    ADD COLUMN IF NOT EXISTS estado varchar(255);

UPDATE administracionzonal.reserva_cancha
SET estado = CASE
    WHEN no_asistio THEN 'NO_ASISTIO'
    WHEN asistio OR usado THEN 'ASISTIO'
    WHEN estado IS NULL THEN 'RESERVADO'
    ELSE estado
END;

CREATE TABLE IF NOT EXISTS administracionzonal.solicitudes_desbloqueo_cancha (
    id bigserial PRIMARY KEY,
    id_usuario bigint NOT NULL REFERENCES administracionzonal.usuarios (id_usuario),
    estado varchar(20) NOT NULL DEFAULT 'PENDIENTE',
    observacion varchar(500),
    fecha_solicitud timestamp NOT NULL DEFAULT now(),
    fecha_resolucion timestamp,
    resuelto_por varchar(255)
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_desbloqueo_cancha_estado_fecha
    ON administracionzonal.solicitudes_desbloqueo_cancha (estado, fecha_solicitud);

CREATE INDEX IF NOT EXISTS idx_reservas_coworking_estado_fecha_area
    ON administracionzonal.reservas_coworking (estado, fecha, nombre_area);

CREATE INDEX IF NOT EXISTS idx_reserva_cancha_estado_fecha
    ON administracionzonal.reserva_cancha (estado, fecha);
