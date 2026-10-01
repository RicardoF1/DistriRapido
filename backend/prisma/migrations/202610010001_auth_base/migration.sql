CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "roles" (
  "rol_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nombre" VARCHAR(50) NOT NULL,
  "descripcion" VARCHAR(255) NOT NULL,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("rol_id")
);

CREATE TABLE "usuarios" (
  "usuario_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "rol_id" UUID NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("usuario_id"),
  CONSTRAINT "chk_usuario_estado" CHECK ("estado" IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO'))
);

CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE INDEX "idx_usuarios_rol_id" ON "usuarios"("rol_id");
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey"
  FOREIGN KEY ("rol_id") REFERENCES "roles"("rol_id") ON DELETE RESTRICT ON UPDATE CASCADE;
