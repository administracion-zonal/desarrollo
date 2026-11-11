-- Internal procurement case file. It does not replace the official contracting platform.
-- Run once against the application's PostgreSQL database before deploying this version.
CREATE TABLE IF NOT EXISTS administracionzonal.expedientes_compras (
    id_expediente bigserial PRIMARY KEY,
    titulo varchar(200) NOT NULL,
    objeto_compra text NOT NULL,
    descripcion text,
    referencia_oficial varchar(200),
    estado varchar(30) NOT NULL,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL,
    created_by varchar(100) NOT NULL,
    updated_by varchar(100) NOT NULL,
    closed_at timestamp
);

CREATE TABLE IF NOT EXISTS administracionzonal.expediente_documento_versiones (
    id_version bigserial PRIMARY KEY,
    id_expediente bigint NOT NULL REFERENCES administracionzonal.expedientes_compras(id_expediente),
    categoria varchar(120) NOT NULL,
    version integer NOT NULL,
    nombre_archivo varchar(255) NOT NULL,
    ruta_archivo varchar(1000) NOT NULL,
    tamano_bytes bigint NOT NULL,
    subido_por varchar(100) NOT NULL,
    subido_en timestamp NOT NULL,
    CONSTRAINT uq_expediente_categoria_version UNIQUE (id_expediente, categoria, version)
);

CREATE TABLE IF NOT EXISTS administracionzonal.expediente_compras_historial (
    id bigserial PRIMARY KEY,
    id_expediente bigint NOT NULL REFERENCES administracionzonal.expedientes_compras(id_expediente),
    estado_anterior varchar(30),
    estado_nuevo varchar(30) NOT NULL,
    observacion text,
    actor varchar(100) NOT NULL,
    fecha timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expedientes_compras_estado
    ON administracionzonal.expedientes_compras (estado, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_expediente_documento_versiones_expediente
    ON administracionzonal.expediente_documento_versiones (id_expediente, subido_en DESC);
CREATE INDEX IF NOT EXISTS idx_expediente_compras_historial_expediente
    ON administracionzonal.expediente_compras_historial (id_expediente, fecha DESC);

SELECT setval(
    pg_get_serial_sequence('administracionzonal.roles', 'id_rol'),
    GREATEST(
        COALESCE((SELECT MAX(id_rol) FROM administracionzonal.roles), 1),
        COALESCE((
            SELECT last_value
            FROM pg_sequences
            WHERE schemaname = 'administracionzonal'
              AND sequencename = split_part(
                  pg_get_serial_sequence('administracionzonal.roles', 'id_rol'), '.', 2)
        ), 1)
    ),
    true
);

INSERT INTO administracionzonal.roles (nombre, descripcion)
VALUES ('COMPRAS_PUBLICAS', 'Gestión de expedientes internos de Compras Públicas')
ON CONFLICT (nombre) DO NOTHING;
