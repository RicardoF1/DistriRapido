-- US-018 / RF-015: incidencias registradas por el conductor sobre una entrega.
-- Migracion aditiva. No modifica ni elimina datos existentes.
-- Registrar una incidencia no cambia el estado de la entrega (US-017).

CREATE TABLE "incidencias_entrega" (
    "incidencia_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parada_id" UUID NOT NULL,
    "conductor_id" UUID NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "detalle_complementario" VARCHAR(500),
    "registrado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidencias_entrega_pkey" PRIMARY KEY ("incidencia_id")
);

ALTER TABLE "incidencias_entrega"
    ADD CONSTRAINT "chk_incidencias_tipo"
    CHECK ("tipo" IN (
        'CLIENTE_AUSENTE',
        'DIRECCION_INCORRECTA',
        'ACCESO_RESTRINGIDO',
        'VIA_BLOQUEADA',
        'VEHICULO_AVERIADO',
        'CARGA_DANADA',
        'OTRO'
    ));

ALTER TABLE "incidencias_entrega"
    ADD CONSTRAINT "chk_incidencias_descripcion"
    CHECK (char_length(trim("descripcion")) BETWEEN 1 AND 500);

ALTER TABLE "incidencias_entrega"
    ADD CONSTRAINT "chk_incidencias_detalle"
    CHECK ("detalle_complementario" IS NULL OR char_length(trim("detalle_complementario")) BETWEEN 1 AND 500);

ALTER TABLE "incidencias_entrega"
    ADD CONSTRAINT "incidencias_entrega_parada_id_fkey"
    FOREIGN KEY ("parada_id") REFERENCES "paradas_ruta"("parada_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "incidencias_entrega"
    ADD CONSTRAINT "incidencias_entrega_conductor_id_fkey"
    FOREIGN KEY ("conductor_id") REFERENCES "conductores"("conductor_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "idx_incidencias_parada_registro" ON "incidencias_entrega"("parada_id", "registrado_en");
CREATE INDEX "idx_incidencias_conductor" ON "incidencias_entrega"("conductor_id");
