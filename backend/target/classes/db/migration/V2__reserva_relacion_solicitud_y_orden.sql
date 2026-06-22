ALTER TABLE administracionzonal.reservas_vehiculos
  ADD COLUMN IF NOT EXISTS id_solicitud BIGINT;

CREATE INDEX IF NOT EXISTS idx_reservas_vehiculos_id_solicitud
  ON administracionzonal.reservas_vehiculos (id_solicitud);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_reservas_vehiculos_solicitud'
  ) THEN
    ALTER TABLE administracionzonal.reservas_vehiculos
      ADD CONSTRAINT fk_reservas_vehiculos_solicitud
      FOREIGN KEY (id_solicitud)
      REFERENCES administracionzonal.solicitudes_vehiculo(id)
      ON DELETE SET NULL;
  END IF;
END $$;
