-- Permite marcar como inasistidas las reservas de vehículos vencidas,
-- conservando las demás reglas de estado ya definidas en la base.
DO $$
DECLARE
    definicion text;
    expresion text;
    estado text;
BEGIN
    SELECT pg_get_constraintdef(oid)
    INTO definicion
    FROM pg_constraint
    WHERE conrelid = 'administracionzonal.reservas_vehiculos'::regclass
      AND conname = 'estado_reserva_check';

    IF definicion IS NULL THEN
        RAISE EXCEPTION 'No se encontró la restricción estado_reserva_check en reservas_vehiculos';
    END IF;

    expresion := substring(definicion FROM 8 FOR char_length(definicion) - 8);
    IF expresion = definicion OR expresion = '' THEN
        RAISE EXCEPTION 'No se pudo leer la expresión de estado_reserva_check: %', definicion;
    END IF;

    FOREACH estado IN ARRAY ARRAY['NO_ASISTIO', 'EN_USO', 'FINALIZADA'] LOOP
        IF position(estado IN definicion) = 0 THEN
            expresion := format('(%s) OR estado = %L', expresion, estado);
        END IF;
    END LOOP;

    IF expresion <> substring(definicion FROM 8 FOR char_length(definicion) - 8) THEN
        EXECUTE 'ALTER TABLE administracionzonal.reservas_vehiculos DROP CONSTRAINT estado_reserva_check';
        EXECUTE format(
            'ALTER TABLE administracionzonal.reservas_vehiculos ADD CONSTRAINT estado_reserva_check CHECK (%s)',
            expresion
        );
    END IF;
END;
$$;
