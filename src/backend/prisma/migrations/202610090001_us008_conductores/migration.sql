-- HGR-26 / US-008 / RF-006: aditiva. PENDIENTE de autorización para aplicar.
CREATE TABLE "conductores" (
 "conductor_id" UUID NOT NULL DEFAULT gen_random_uuid(), "usuario_id" UUID,
 "nombre_completo" VARCHAR(150) NOT NULL, "dni" VARCHAR(20) NOT NULL,
 "licencia_categoria" VARCHAR(20) NOT NULL, "anios_experiencia" SMALLINT NOT NULL DEFAULT 0,
 "telefono" VARCHAR(30) NOT NULL, "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
 CONSTRAINT "conductores_pkey" PRIMARY KEY ("conductor_id"),
 CONSTRAINT "chk_conductor_experiencia" CHECK ("anios_experiencia" >= 0),
 CONSTRAINT "chk_conductor_estado_administrativo" CHECK ("estado" IN ('ACTIVO', 'INACTIVO')),
 CONSTRAINT "conductores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "conductores_dni_key" ON "conductores"("dni");
CREATE UNIQUE INDEX "conductores_usuario_id_key" ON "conductores"("usuario_id");
CREATE INDEX "idx_conductores_estado" ON "conductores"("estado");
