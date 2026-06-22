ALTER TABLE administracionzonal.reservas_vehiculos
    ADD COLUMN IF NOT EXISTS estado_viaje VARCHAR(30),
    ADD COLUMN IF NOT EXISTS no_se_presento BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS comentario_no_presentacion VARCHAR(500);

UPDATE administracionzonal.reservas_vehiculos
SET estado_viaje = COALESCE(estado_viaje, 'PENDIENTE'),
    no_se_presento = COALESCE(no_se_presento, FALSE);
