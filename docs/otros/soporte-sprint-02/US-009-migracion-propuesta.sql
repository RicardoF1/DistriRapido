-- HGR-27 / US-009 / RF-007
-- Disponibilidad operativa de conductores por intervalo.
-- Migracion aditiva: no elimina ni modifica informacion existente.

CREATE TABLE "disponibilidades_conductores" (
    "disponibilidad_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conductor_id" UUID NOT NULL,
    "inicio" TIMESTAMPTZ(6) NOT NULL,
    "fin" TIMESTAMPTZ(6) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disponibilidades_conductores_pkey"
        PRIMARY KEY ("disponibilidad_id"),

    CONSTRAINT "chk_disponibilidad_conductor_periodo"
        CHECK ("fin" > "inicio"),

    CONSTRAINT "chk_disponibilidad_conductor_estado"
        CHECK ("estado" IN ('DISPONIBLE', 'NO_DISPONIBLE')),

    CONSTRAINT "disponibilidades_conductores_conductor_id_fkey"
        FOREIGN KEY ("conductor_id")
        REFERENCES "conductores"("conductor_id")
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_disponibilidad_conductor_intervalo"
    ON "disponibilidades_conductores"
    ("conductor_id", "inicio", "fin");

CREATE INDEX "idx_disponibilidad_conductor_intervalo"
    ON "disponibilidades_conductores"
    ("conductor_id", "inicio", "fin");

CREATE INDEX "idx_disponibilidad_conductor_estado"
    ON "disponibilidades_conductores"
    ("estado");
