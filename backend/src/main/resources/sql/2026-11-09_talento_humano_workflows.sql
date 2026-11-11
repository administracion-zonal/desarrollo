-- Stores the checklist selected when a personnel process starts.
-- Run once against the application's PostgreSQL database before deploying this version.
ALTER TABLE administracionzonal.usuario_proceso
    ADD COLUMN IF NOT EXISTS id_checklist bigint;

ALTER TABLE administracionzonal.usuario_documentos
    ADD COLUMN IF NOT EXISTS observacion_revision text;
