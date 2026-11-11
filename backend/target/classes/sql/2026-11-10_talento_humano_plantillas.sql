ALTER TABLE administracionzonal.documentos_tipo
    ADD COLUMN IF NOT EXISTS plantilla_archivo text,
    ADD COLUMN IF NOT EXISTS plantilla_nombre varchar(255),
    ADD COLUMN IF NOT EXISTS plantilla_extension varchar(10);
