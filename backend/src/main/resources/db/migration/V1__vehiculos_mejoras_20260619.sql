-- Flyway V1
-- Mejoras del modulo de vehiculos: rechazo con observacion, correlativo unico e indices.

ALTER TABLE IF EXISTS administracionzonal.solicitudes_vehiculo
    ADD COLUMN IF NOT EXISTS observacion_rechazo VARCHAR(500);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_orden_movilizacion_codigo'
    ) THEN
        ALTER TABLE administracionzonal.orden_movilizacion
            ADD CONSTRAINT uk_orden_movilizacion_codigo UNIQUE (codigo);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_solicitud_usuario_fecha_horas
    ON administracionzonal.solicitudes_vehiculo (id_usuario, fecha, hora_inicio, hora_fin);

CREATE INDEX IF NOT EXISTS idx_solicitud_estado_fecha
    ON administracionzonal.solicitudes_vehiculo (estado, fecha);

CREATE INDEX IF NOT EXISTS idx_reserva_chofer_fecha_horas_estado
    ON administracionzonal.reservas_vehiculos (chofer_id, fecha_reserva, hora_inicio, hora_fin, estado);

CREATE INDEX IF NOT EXISTS idx_reserva_vehiculo_fecha_horas
    ON administracionzonal.reservas_vehiculos (id_vehiculo, fecha_reserva, hora_inicio, hora_fin);

CREATE INDEX IF NOT EXISTS idx_orden_reserva
    ON administracionzonal.orden_movilizacion (id_reserva);
