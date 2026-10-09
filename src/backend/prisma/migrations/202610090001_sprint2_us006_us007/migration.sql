CREATE TABLE "vehiculos" (
    "vehiculo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "placa" VARCHAR(15) NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "capacidad_carga_kg" NUMERIC(10,2) NOT NULL,
    "capacidad_volumen_m3" NUMERIC(10,3),
    "consumo_km_l" NUMERIC(10,3) NOT NULL,
    "factor_emision_kg_co2_km" NUMERIC(10,5) NOT NULL,
    "anio_fabricacion" SMALLINT NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("vehiculo_id"),
    CONSTRAINT "chk_vehiculos_capacidad_carga" CHECK ("capacidad_carga_kg" > 0),
    CONSTRAINT "chk_vehiculos_capacidad_volumen" CHECK ("capacidad_volumen_m3" IS NULL OR "capacidad_volumen_m3" > 0),
    CONSTRAINT "chk_vehiculos_consumo" CHECK ("consumo_km_l" > 0),
    CONSTRAINT "chk_vehiculos_emision" CHECK ("factor_emision_kg_co2_km" >= 0),
    CONSTRAINT "chk_vehiculos_estado" CHECK ("estado" IN ('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'AVERIADO', 'INACTIVO'))
);

CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");
CREATE INDEX "idx_vehiculos_estado" ON "vehiculos"("estado");
CREATE INDEX "idx_vehiculos_tipo" ON "vehiculos"("tipo");
