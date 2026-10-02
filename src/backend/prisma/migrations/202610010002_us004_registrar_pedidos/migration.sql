CREATE TABLE "clientes" (
  "cliente_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nombre" VARCHAR(150) NOT NULL,
  "telefono" VARCHAR(30),
  "email" VARCHAR(255),
  "direccion" VARCHAR(255) NOT NULL,
  "referencia" VARCHAR(255),
  "latitud" NUMERIC(9,6) NOT NULL,
  "longitud" NUMERIC(9,6) NOT NULL,
  "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
  CONSTRAINT "clientes_pkey" PRIMARY KEY ("cliente_id"),
  CONSTRAINT "chk_cliente_latitud" CHECK (latitud BETWEEN -90 AND 90),
  CONSTRAINT "chk_cliente_longitud" CHECK (longitud BETWEEN -180 AND 180)
);
CREATE TABLE "pedidos" (
  "pedido_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "cliente_id" UUID NOT NULL,
  "peso_kg" NUMERIC(10,2) NOT NULL,
  "volumen_m3" NUMERIC(10,3) NOT NULL,
  "ventana_inicio" TIMESTAMPTZ(6) NOT NULL,
  "ventana_fin" TIMESTAMPTZ(6) NOT NULL,
  "prioridad" VARCHAR(20) NOT NULL,
  "tipo_producto" VARCHAR(30) NOT NULL,
  "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
  "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pedidos_pkey" PRIMARY KEY ("pedido_id"),
  CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "chk_pedido_peso" CHECK (peso_kg > 0),
  CONSTRAINT "chk_pedido_volumen" CHECK (volumen_m3 > 0),
  CONSTRAINT "chk_pedido_ventana" CHECK (ventana_fin > ventana_inicio),
  CONSTRAINT "chk_pedido_prioridad" CHECK (prioridad IN ('EXPRESS', 'ESTANDAR', 'ECONOMICO')),
  CONSTRAINT "chk_pedido_tipo_producto" CHECK (tipo_producto IN ('PERECEDERO', 'NO_PERECEDERO'))
);
CREATE INDEX "idx_pedidos_cliente" ON "pedidos"("cliente_id");
