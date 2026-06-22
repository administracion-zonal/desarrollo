-- Seed idempotente de usuarios de prueba para validacion UI por roles.
-- Password comun para todas las cuentas: Quito2026
-- Hash BCrypt (cost 10): $2a$10$p0eHjImwDLTekgOwc9d2fOdcoPxsJQfyvidBN9pcDkct99Uio/UP.

INSERT INTO administracionzonal.usuarios (
    cedula, nombres, institucion, fecha_registro, acepta_acuerdo,
    password, debe_cambiar_password, correo, tipo_usuario
)
VALUES
    ('1700001001','UI PRUEBA JEFE AZVCH','ADMINISTRACION ZONAL VALLE DE LOS CHILLOS',now(),false,'$2a$10$p0eHjImwDLTekgOwc9d2fOdcoPxsJQfyvidBN9pcDkct99Uio/UP.',true,'ui.jefe.azvch@quito.gob.ec','SERVIDOR_AZVCH'),
    ('1700001002','UI PRUEBA DIRECTOR AZVCH','ADMINISTRACION ZONAL VALLE DE LOS CHILLOS',now(),false,'$2a$10$p0eHjImwDLTekgOwc9d2fOdcoPxsJQfyvidBN9pcDkct99Uio/UP.',true,'ui.director.azvch@quito.gob.ec','SERVIDOR_AZVCH'),
    ('1700001003','UI PRUEBA ADMIN VEHICULOS','ADMINISTRACION ZONAL VALLE DE LOS CHILLOS',now(),false,'$2a$10$p0eHjImwDLTekgOwc9d2fOdcoPxsJQfyvidBN9pcDkct99Uio/UP.',true,'ui.adminvehiculos.azvch@quito.gob.ec','SERVIDOR_AZVCH'),
    ('1700001004','UI PRUEBA ADMIN GENERAL','ADMINISTRACION ZONAL VALLE DE LOS CHILLOS',now(),false,'$2a$10$p0eHjImwDLTekgOwc9d2fOdcoPxsJQfyvidBN9pcDkct99Uio/UP.',true,'ui.admin.azvch@quito.gob.ec','SERVIDOR_AZVCH'),
    ('1700001005','UI PRUEBA CHOFER AZVCH','ADMINISTRACION ZONAL VALLE DE LOS CHILLOS',now(),false,'$2a$10$p0eHjImwDLTekgOwc9d2fOdcoPxsJQfyvidBN9pcDkct99Uio/UP.',true,'ui.chofer.azvch@quito.gob.ec','SERVIDOR_AZVCH')
ON CONFLICT (cedula) DO UPDATE
SET nombres = EXCLUDED.nombres,
    institucion = EXCLUDED.institucion,
    correo = EXCLUDED.correo,
    tipo_usuario = EXCLUDED.tipo_usuario,
    debe_cambiar_password = true;

INSERT INTO administracionzonal.usuarios_institucion (
    id_usuario_institucion, id_usuario, correo_institucional, telefono_extension,
    activo, institucion, id_denominacion, id_unidad, id_direccion
)
SELECT
    u.id_usuario,
    u.id_usuario,
    s.correo,
    s.telefono_extension,
    true,
    'ADMINISTRACION ZONAL VALLE DE LOS CHILLOS',
    s.id_denominacion,
    s.id_unidad,
    s.id_direccion
FROM administracionzonal.usuarios u
JOIN (
    VALUES
        ('1700001001','ui.jefe.azvch@quito.gob.ec',63,9,3,'2401'),
        ('1700001002','ui.director.azvch@quito.gob.ec',45,2,2,'2402'),
        ('1700001003','ui.adminvehiculos.azvch@quito.gob.ec',42,6,2,'2403'),
        ('1700001004','ui.admin.azvch@quito.gob.ec',1,2,2,'2404'),
        ('1700001005','ui.chofer.azvch@quito.gob.ec',36,6,2,'2405')
) AS s(cedula,correo,id_denominacion,id_unidad,id_direccion,telefono_extension)
ON s.cedula = u.cedula
ON CONFLICT (id_usuario_institucion) DO UPDATE
SET id_usuario = EXCLUDED.id_usuario,
    correo_institucional = EXCLUDED.correo_institucional,
    telefono_extension = EXCLUDED.telefono_extension,
    activo = true,
    institucion = EXCLUDED.institucion,
    id_denominacion = EXCLUDED.id_denominacion,
    id_unidad = EXCLUDED.id_unidad,
    id_direccion = EXCLUDED.id_direccion;

INSERT INTO administracionzonal.usuarios_roles (id_usuario, id_rol, fecha_asignacion)
SELECT u.id_usuario, s.id_rol, now()
FROM administracionzonal.usuarios u
JOIN (
    VALUES
        ('1700001001',5),
        ('1700001002',5),
        ('1700001003',9),
        ('1700001004',3),
        ('1700001005',7)
) AS s(cedula,id_rol)
ON s.cedula = u.cedula
ON CONFLICT (id_usuario, id_rol) DO NOTHING;

WITH chofer AS (
    SELECT u.id_usuario
    FROM administracionzonal.usuarios u
    JOIN administracionzonal.usuarios_roles ur ON ur.id_usuario = u.id_usuario
    WHERE u.cedula = '1700001005' AND ur.id_rol = 7
), vehiculo_actual AS (
        SELECT MIN(v.id_vehiculo) AS id_vehiculo
        FROM administracionzonal.vehiculos v
        JOIN chofer c ON c.id_usuario = v.id_chofer
), liberar_extras AS (
        UPDATE administracionzonal.vehiculos v
        SET id_chofer = NULL
        FROM chofer c, vehiculo_actual va
        WHERE v.id_chofer = c.id_usuario
            AND va.id_vehiculo IS NOT NULL
            AND v.id_vehiculo <> va.id_vehiculo
        RETURNING v.id_vehiculo
), vehiculo_libre AS (
    SELECT id_vehiculo
    FROM administracionzonal.vehiculos
    WHERE id_chofer IS NULL
    ORDER BY id_vehiculo
    LIMIT 1
)
UPDATE administracionzonal.vehiculos v
SET id_chofer = c.id_usuario
FROM chofer c, vehiculo_libre vl
WHERE v.id_vehiculo = vl.id_vehiculo
    AND NOT EXISTS (
            SELECT 1
            FROM administracionzonal.vehiculos vx
            WHERE vx.id_chofer = c.id_usuario
    )
  AND v.id_chofer IS NULL;
