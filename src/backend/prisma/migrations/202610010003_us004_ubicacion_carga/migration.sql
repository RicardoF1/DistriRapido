ALTER TABLE "pedidos" ALTER COLUMN "volumen_m3" DROP NOT NULL;
ALTER TABLE "pedidos" ADD COLUMN "descripcion_carga" VARCHAR(255);
