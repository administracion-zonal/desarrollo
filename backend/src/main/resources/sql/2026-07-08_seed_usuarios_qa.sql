-- Seed idempotente de usuarios QA por rol
-- Password plano para todos: Qa2026*

CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET search_path TO administracionzonal;

DROP TABLE IF EXISTS qa_seed;
CREATE TEMP TABLE qa_seed (
    cedula varchar(20) PRIMARY KEY,
    nombres varchar(255) NOT NULL,
    correo varchar(255) NOT NULL,
    tipo_usuario varchar(50) NOT NULL,
    rol varchar(50) NOT NULL,
    institucion varchar(255) NOT NULL
);

INSERT INTO qa_seed (cedula, nombres, correo, tipo_usuario, rol, institucion)
VALUES
    ('9000000001', 'QA ADMIN SISTEMA', 'qa.admin@azvch.test', 'SERVIDOR_AZVCH', 'ADMIN', 'ADMINISTRACION ZONAL VALLE DE LOS CHILLOS'),
    ('9000000002', 'QA ADMIN VEHICULOS', 'qa.adminvehiculos@azvch.test', 'SERVIDOR_AZVCH', 'ADMIN_VEHICULOS', 'ADMINISTRACION ZONAL VALLE DE LOS CHILLOS'),
    ('9000000003', 'QA ADMIN COWORKING', 'qa.admincoworking@azvch.test', 'SERVIDOR_AZVCH', 'ADMIN_COWORKING', 'ADMINISTRACION ZONAL VALLE DE LOS CHILLOS'),
    ('9000000004', 'QA ADMIN CANCHAS', 'qa.admincanchas@azvch.test', 'SERVIDOR_AZVCH', 'ADMIN_CANCHAS', 'ADMINISTRACION ZONAL VALLE DE LOS CHILLOS'),
    ('9000000005', 'QA TALENTO HUMANO', 'qa.talentohumano@azvch.test', 'SERVIDOR_AZVCH', 'TALENTO_HUMANO', 'ADMINISTRACION ZONAL VALLE DE LOS CHILLOS'),
    ('9000000006', 'QA CHOFER OPERATIVO', 'qa.chofer@azvch.test', 'SERVIDOR_AZVCH', 'CHOFER', 'ADMINISTRACION ZONAL VALLE DE LOS CHILLOS'),
    ('9000000007', 'QA SERVIDOR AZVCH JEFE', 'qa.azvchjefe@azvch.test', 'SERVIDOR_AZVCH', 'SERVIDOR_AZVCH', 'ADMINISTRACION ZONAL VALLE DE LOS CHILLOS'),
    ('9000000008', 'QA SERVIDOR PUBLICO', 'qa.servidorpublico@azvch.test', 'SERVIDOR_PUBLICO', 'SERVIDOR_PUBLICO', 'ENTIDAD EXTERNA QA'),
    ('9000000009', 'QA USUARIO PRIVADO', 'qa.privado@azvch.test', 'PRIVADO', 'PRIVADO', 'USUARIO PARTICULAR QA'),
    ('9000000010', 'QA USUARIO ESTUDIANTE', 'qa.estudiante@azvch.test', 'ESTUDIANTE', 'ESTUDIANTE', 'INSTITUCION EDUCATIVA QA');

INSERT INTO usuarios (
    cedula,
    nombres,
    institucion,
    correo,
    password,
    debe_cambiar_password,
    acepta_acuerdo,
    tipo_usuario,
    created_at,
    updated_at,
    created_by,
    updated_by,
    bloqueado,
    motivo_bloqueo
)
SELECT
    s.cedula,
    s.nombres,
    s.institucion,
    s.correo,
    crypt('Qa2026*', gen_salt('bf', 10)),
    false,
    true,
    s.tipo_usuario,
    now(),
    now(),
    'seed_qa',
    'seed_qa',
    false,
    null
FROM qa_seed s
ON CONFLICT (cedula) DO UPDATE
SET
    nombres = EXCLUDED.nombres,
    institucion = EXCLUDED.institucion,
    correo = EXCLUDED.correo,
    password = crypt('Qa2026*', gen_salt('bf', 10)),
    debe_cambiar_password = false,
    acepta_acuerdo = true,
    tipo_usuario = EXCLUDED.tipo_usuario,
    updated_at = now(),
    updated_by = 'seed_qa',
    bloqueado = false,
    motivo_bloqueo = null;

WITH qa_users AS (
    SELECT u.id_usuario
    FROM usuarios u
    WHERE u.cedula IN (
        '9000000001','9000000002','9000000003','9000000004','9000000005',
        '9000000006','9000000007','9000000008','9000000009','9000000010'
    )
)
DELETE FROM usuarios_roles ur
USING qa_users q
WHERE ur.id_usuario = q.id_usuario;

INSERT INTO usuarios_roles (id_usuario, id_rol, created_at, updated_at, created_by, updated_by)
SELECT u.id_usuario, r.id_rol, now(), now(), 'seed_qa', 'seed_qa'
FROM usuarios u
JOIN qa_seed s ON s.cedula = u.cedula
JOIN roles r ON r.nombre = s.rol
WHERE u.cedula IN (
    '9000000001','9000000002','9000000003','9000000004','9000000005',
    '9000000006','9000000007','9000000008','9000000009','9000000010'
);

-- Perfiles institucionales minimos para roles que los requieren en flujo interno
INSERT INTO usuarios_institucion (
    id_usuario_institucion,
    id_denominacion,
    correo_institucional,
    telefono_extension,
    activo,
    institucion,
    id_unidad,
    id_direccion
)
SELECT u.id_usuario,
       CASE
           WHEN u.cedula = '9000000001' THEN 1
           WHEN u.cedula = '9000000007' THEN 63
           WHEN u.cedula = '9000000005' THEN 59
           WHEN u.cedula = '9000000006' THEN 58
           WHEN u.cedula = '9000000002' THEN 63
           WHEN u.cedula = '9000000003' THEN 59
           WHEN u.cedula = '9000000004' THEN 59
           ELSE 59
       END,
       lower(replace(u.nombres, ' ', '.')) || '@quito.gob.ec',
       '22800',
       true,
       'ADMINISTRACION ZONAL VALLE DE LOS CHILLOS',
       1,
       2
FROM usuarios u
WHERE u.cedula IN (
    '9000000001','9000000002','9000000003','9000000004','9000000005','9000000006','9000000007'
)
ON CONFLICT (id_usuario_institucion) DO UPDATE
SET id_denominacion = EXCLUDED.id_denominacion,
    correo_institucional = EXCLUDED.correo_institucional,
    telefono_extension = EXCLUDED.telefono_extension,
    activo = true,
    institucion = EXCLUDED.institucion,
    id_unidad = EXCLUDED.id_unidad,
    id_direccion = EXCLUDED.id_direccion;

-- Resumen final de usuarios QA
SELECT u.id_usuario, u.cedula, u.nombres, u.correo, u.tipo_usuario,
       string_agg(r.nombre, ', ' ORDER BY r.nombre) AS roles
FROM usuarios u
JOIN usuarios_roles ur ON ur.id_usuario = u.id_usuario
JOIN roles r ON r.id_rol = ur.id_rol
WHERE u.cedula IN (
    '9000000001','9000000002','9000000003','9000000004','9000000005',
    '9000000006','9000000007','9000000008','9000000009','9000000010'
)
GROUP BY u.id_usuario, u.cedula, u.nombres, u.correo, u.tipo_usuario
ORDER BY u.cedula;
