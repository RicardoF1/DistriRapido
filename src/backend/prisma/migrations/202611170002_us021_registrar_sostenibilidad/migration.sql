-- US-021 / RF-017: información para evaluar la sostenibilidad de una ruta.
-- Migración aditiva. No modifica ni elimina datos existentes.
-- Un registro por ruta (CONFIRMADA o posterior). Las emisiones las calcula el servidor:
-- emisiones_co2_kg = distancia_km × factor_emision_kg_co2_km (RN-009).

CREATE TABLE "registros_sostenibilidad" (
    "registro_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ruta_id" UUID NOT NULL,
    "ruta_version" INTEGER NOT NULL,
    "vehiculo_id" UUID NOT NULL,
    "distancia_km" DECIMAL(12,3) NOT NULL,
    "combustible_l" DECIMAL(12,3) NOT NULL,
    "factor_emision_kg_co2_km" DECIMAL(10,5) NOT NULL,
    "emisiones_co2_kg" DECIMAL(14,4) NOT NULL,
    "origen_datos" VARCHAR(20) NOT NULL,
    "costo_combustible" DECIMAL(12,2),
    "observaciones" VARCHAR(500),
    "registrado_por" UUID NOT NULL,
    "registrado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_sostenibilidad_pkey" PRIMARY KEY ("registro_id")
);

ALTER TABLE "registros_sostenibilidad"
    ADD CONSTRAINT "chk_sostenibilidad_origen"
    CHECK ("origen_datos" IN ('ESTIMADO', 'MEDIDO'));

ALTER TABLE "registros_sostenibilidad"
    ADD CONSTRAINT "chk_sostenibilidad_valores"
    CHECK (
        "ruta_version" >= 1
        AND "distancia_km" > 0
        AND "combustible_l" >= 0
        AND "factor_emision_kg_co2_km" >= 0
        AND "emisiones_co2_kg" >= 0
        AND ("costo_combustible" IS NULL OR "costo_combustible" >= 0)
    );

ALTER TABLE "registros_sostenibilidad"
    ADD CONSTRAINT "chk_sostenibilidad_observaciones"
    CHECK ("observaciones" IS NULL OR char_length(trim("observaciones")) BETWEEN 1 AND 500);

ALTER TABLE "registros_sostenibilidad"
    ADD CONSTRAINT "registros_sostenibilidad_ruta_id_fkey"
    FOREIGN KEY ("ruta_id") REFERENCES "rutas"("ruta_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registros_sostenibilidad"
    ADD CONSTRAINT "registros_sostenibilidad_vehiculo_id_fkey"
    FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("vehiculo_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registros_sostenibilidad"
    ADD CONSTRAINT "registros_sostenibilidad_registrado_por_fkey"
    FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("usuario_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "registros_sostenibilidad_ruta_id_key" ON "registros_sostenibilidad"("ruta_id");
CREATE INDEX "idx_registros_sostenibilidad_registrado" ON "registros_sostenibilidad"("registrado_en" DESC);
CREATE INDEX "idx_registros_sostenibilidad_vehiculo" ON "registros_sostenibilidad"("vehiculo_id");
CREATE INDEX "idx_registros_sostenibilidad_usuario" ON "registros_sostenibilidad"("registrado_por");
