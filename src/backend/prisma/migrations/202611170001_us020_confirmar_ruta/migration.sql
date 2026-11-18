-- US-020 / RF-019: confirmación de una ruta revisada antes de su ejecución.
-- Migración aditiva. No elimina ni modifica datos existentes.
-- Nuevo ciclo: GENERADA -> CONFIRMADA -> ASIGNADA -> EN_CURSO -> COMPLETADA.
-- Las rutas asignadas antes de US-020 se conservan sin datos de confirmación.

ALTER TABLE "rutas"
    ADD COLUMN "confirmado_en" TIMESTAMPTZ(6),
    ADD COLUMN "confirmado_por" UUID,
    ADD COLUMN "version_confirmada" INTEGER;

ALTER TABLE "rutas" DROP CONSTRAINT "chk_rutas_estado_operativo";
ALTER TABLE "rutas"
    ADD CONSTRAINT "chk_rutas_estado_operativo"
    CHECK ("estado" IN ('GENERADA', 'CONFIRMADA', 'ASIGNADA', 'EN_CURSO', 'COMPLETADA'));

ALTER TABLE "rutas" DROP CONSTRAINT "chk_rutas_asignacion_coherente";
ALTER TABLE "rutas"
    ADD CONSTRAINT "chk_rutas_asignacion_coherente"
    CHECK (
        ("estado" = 'GENERADA' AND "conductor_id" IS NULL AND "asignado_en" IS NULL AND "confirmado_en" IS NULL)
        OR
        ("estado" = 'CONFIRMADA' AND "conductor_id" IS NULL AND "asignado_en" IS NULL AND "confirmado_en" IS NOT NULL)
        OR
        ("estado" IN ('ASIGNADA', 'EN_CURSO', 'COMPLETADA')
         AND "conductor_id" IS NOT NULL
         AND "asignado_en" IS NOT NULL)
    );

-- Los tres datos de confirmación se registran juntos o no se registran.
ALTER TABLE "rutas"
    ADD CONSTRAINT "chk_rutas_confirmacion_completa"
    CHECK (
        ("confirmado_en" IS NULL AND "confirmado_por" IS NULL AND "version_confirmada" IS NULL)
        OR
        ("confirmado_en" IS NOT NULL AND "confirmado_por" IS NOT NULL AND "version_confirmada" >= 1)
    );

ALTER TABLE "rutas"
    ADD CONSTRAINT "chk_rutas_confirmacion_antes_asignacion"
    CHECK ("confirmado_en" IS NULL OR "asignado_en" IS NULL OR "asignado_en" >= "confirmado_en");

ALTER TABLE "rutas"
    ADD CONSTRAINT "rutas_confirmado_por_fkey"
    FOREIGN KEY ("confirmado_por")
    REFERENCES "usuarios"("usuario_id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
