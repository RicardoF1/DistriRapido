-- HGR-26 / US-008 / RF-006: BORRADOR NO APLICABLE, fuera de prisma/migrations.
-- La propuesta de estado, cuenta opcional y exclusión de coordenadas requiere aprobación.
DO $$ BEGIN
  RAISE EXCEPTION 'Borrador US-008 pendiente de decisiones y autorización. No ejecutar.';
END $$;
/* DDL condicionado, para revisión únicamente:
CREATE TABLE "conductores" (
  "conductor_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "usuario_id" UUID,
  "nombre_completo" VARCHAR(150) NOT NULL,
  "dni" VARCHAR(20) NOT NULL,
  "licencia_categoria" VARCHAR(20) NOT NULL,
  "anios_experiencia" SMALLINT NOT NULL DEFAULT 0,
  "telefono" VARCHAR(30) NOT NULL,
  "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- PROPUESTO, no aprobado
  CONSTRAINT "conductores_pkey" PRIMARY KEY ("conductor_id"),
  CONSTRAINT "conductores_dni_key" UNIQUE ("dni"),
  CONSTRAINT "conductores_usuario_id_key" UNIQUE ("usuario_id"),
  CONSTRAINT "conductores_usuario_id_fkey" FOREIGN KEY ("usuario_id")
    REFERENCES "usuarios"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "chk_conductor_experiencia" CHECK ("anios_experiencia" >= 0),
  CONSTRAINT "chk_conductor_estado_administrativo" CHECK ("estado" IN ('ACTIVO', 'INACTIVO'))
);
CREATE INDEX "idx_conductores_estado" ON "conductores"("estado");
-- El rol de la cuenta vinculada debe validarse en servicio; una FK no lo garantiza.
*/
