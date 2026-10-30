-- HGR-34, HGR-35 y HGR-36.
-- Modelo operativo de rutas y entregas del Sprint 3.
-- Migracion aditiva. No elimina datos existentes.

ALTER TABLE "rutas"
    ADD COLUMN "conductor_id" UUID,
    ADD COLUMN "estado" VARCHAR(20) NOT NULL DEFAULT 'GENERADA',
    ADD COLUMN "asignado_en" TIMESTAMPTZ(6),
    ADD COLUMN "iniciado_en" TIMESTAMPTZ(6),
    ADD COLUMN "finalizado_en" TIMESTAMPTZ(6),
    ADD COLUMN "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "rutas"
    ADD CONSTRAINT "chk_rutas_estado_operativo"
    CHECK ("estado" IN ('GENERADA', 'ASIGNADA', 'EN_CURSO', 'COMPLETADA'));

ALTER TABLE "rutas"
    ADD CONSTRAINT "chk_rutas_asignacion_coherente"
    CHECK (
        ("estado" = 'GENERADA' AND "conductor_id" IS NULL AND "asignado_en" IS NULL)
        OR
        ("estado" IN ('ASIGNADA', 'EN_CURSO', 'COMPLETADA')
         AND "conductor_id" IS NOT NULL
         AND "asignado_en" IS NOT NULL)
    );

ALTER TABLE "rutas"
    ADD CONSTRAINT "chk_rutas_fechas_operativas"
    CHECK (
        ("iniciado_en" IS NULL OR ("asignado_en" IS NOT NULL AND "iniciado_en" >= "asignado_en"))
        AND
        ("finalizado_en" IS NULL OR ("iniciado_en" IS NOT NULL AND "finalizado_en" >= "iniciado_en"))
    );

ALTER TABLE "rutas"
    ADD CONSTRAINT "rutas_conductor_id_fkey"
    FOREIGN KEY ("conductor_id")
    REFERENCES "conductores"("conductor_id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

CREATE INDEX "idx_rutas_conductor_estado" ON "rutas"("conductor_id", "estado");
CREATE INDEX "idx_rutas_estado" ON "rutas"("estado");

ALTER TABLE "paradas_ruta"
    ADD COLUMN "estado_entrega" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    ADD COLUMN "causa_no_entrega" VARCHAR(255),
    ADD COLUMN "atendido_en" TIMESTAMPTZ(6),
    ADD COLUMN "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "version_entrega" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "paradas_ruta"
    ADD CONSTRAINT "chk_paradas_estado_entrega"
    CHECK ("estado_entrega" IN ('PENDIENTE', 'ENTREGADA', 'NO_ENTREGADA'));

ALTER TABLE "paradas_ruta"
    ADD CONSTRAINT "chk_paradas_causa_no_entrega"
    CHECK (
        ("estado_entrega" = 'NO_ENTREGADA'
         AND "causa_no_entrega" IS NOT NULL
         AND char_length(trim("causa_no_entrega")) BETWEEN 1 AND 255)
        OR
        ("estado_entrega" <> 'NO_ENTREGADA' AND "causa_no_entrega" IS NULL)
    );

ALTER TABLE "paradas_ruta"
    ADD CONSTRAINT "chk_paradas_fecha_atencion"
    CHECK (
        ("estado_entrega" = 'PENDIENTE' AND "atendido_en" IS NULL)
        OR
        ("estado_entrega" IN ('ENTREGADA', 'NO_ENTREGADA') AND "atendido_en" IS NOT NULL)
    );

ALTER TABLE "paradas_ruta"
    ADD CONSTRAINT "chk_paradas_version_entrega"
    CHECK ("version_entrega" >= 0);

CREATE INDEX "idx_paradas_ruta_estado_entrega"
    ON "paradas_ruta"("estado_entrega");