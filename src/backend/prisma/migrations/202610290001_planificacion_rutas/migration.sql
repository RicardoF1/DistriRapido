-- CreateTable
CREATE TABLE "planificaciones" (
    "planificacion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creado_por" UUID NOT NULL,
    "etiqueta" VARCHAR(100) NOT NULL,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planificaciones_pkey" PRIMARY KEY ("planificacion_id")
);

-- CreateTable
CREATE TABLE "planificaciones_versiones" (
    "version_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "planificacion_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "input_hash" VARCHAR(64) NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planificaciones_versiones_pkey" PRIMARY KEY ("version_id")
);

-- CreateTable
CREATE TABLE "ejecuciones_calculo" (
    "ejecucion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(100) NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'EN_CURSO',
    "owner_token" UUID NOT NULL,
    "vence_en" TIMESTAMPTZ(6) NOT NULL,
    "error_code" VARCHAR(40),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_en" TIMESTAMPTZ(6),

    CONSTRAINT "ejecuciones_calculo_pkey" PRIMARY KEY ("ejecucion_id")
);

-- CreateTable
CREATE TABLE "alternativas_ruta" (
    "alternativa_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ejecucion_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL DEFAULT 1,
    "metodo" VARCHAR(30) NOT NULL DEFAULT 'SECUENCIAL_OSRM',

    CONSTRAINT "alternativas_ruta_pkey" PRIMARY KEY ("alternativa_id")
);

-- CreateTable
CREATE TABLE "rutas" (
    "ruta_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alternativa_id" UUID NOT NULL,
    "indice_recorrido" INTEGER NOT NULL DEFAULT 1,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rutas_pkey" PRIMARY KEY ("ruta_id")
);

-- CreateTable
CREATE TABLE "rutas_versiones" (
    "ruta_version_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ruta_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL DEFAULT 1,
    "vehiculo_id" UUID NOT NULL,
    "distancia_m" DECIMAL(16,3) NOT NULL,
    "duracion_s" DECIMAL(16,3) NOT NULL,
    "resultado" JSONB NOT NULL,
    "input_hash" VARCHAR(64) NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rutas_versiones_pkey" PRIMARY KEY ("ruta_version_id")
);

-- CreateTable
CREATE TABLE "paradas_ruta" (
    "parada_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ruta_version_id" UUID NOT NULL,
    "pedido_id" UUID NOT NULL,
    "secuencia" INTEGER NOT NULL,
    "datos" JSONB NOT NULL,

    CONSTRAINT "paradas_ruta_pkey" PRIMARY KEY ("parada_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "planificaciones_versiones_planificacion_id_numero_key" ON "planificaciones_versiones"("planificacion_id", "numero");

-- CreateIndex
CREATE INDEX "ejecuciones_calculo_estado_vence_en_idx" ON "ejecuciones_calculo"("estado", "vence_en");

-- CreateIndex
CREATE UNIQUE INDEX "ejecuciones_calculo_actor_id_idempotency_key_key" ON "ejecuciones_calculo"("actor_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "alternativas_ruta_ejecucion_id_numero_key" ON "alternativas_ruta"("ejecucion_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "rutas_alternativa_id_indice_recorrido_key" ON "rutas"("alternativa_id", "indice_recorrido");

-- CreateIndex
CREATE UNIQUE INDEX "rutas_versiones_ruta_id_numero_key" ON "rutas_versiones"("ruta_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "paradas_ruta_ruta_version_id_secuencia_key" ON "paradas_ruta"("ruta_version_id", "secuencia");

-- CreateIndex
CREATE UNIQUE INDEX "paradas_ruta_ruta_version_id_pedido_id_key" ON "paradas_ruta"("ruta_version_id", "pedido_id");

-- AddForeignKey
ALTER TABLE "planificaciones" ADD CONSTRAINT "planificaciones_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planificaciones_versiones" ADD CONSTRAINT "planificaciones_versiones_planificacion_id_fkey" FOREIGN KEY ("planificacion_id") REFERENCES "planificaciones"("planificacion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejecuciones_calculo" ADD CONSTRAINT "ejecuciones_calculo_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "planificaciones_versiones"("version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejecuciones_calculo" ADD CONSTRAINT "ejecuciones_calculo_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "usuarios"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternativas_ruta" ADD CONSTRAINT "alternativas_ruta_ejecucion_id_fkey" FOREIGN KEY ("ejecucion_id") REFERENCES "ejecuciones_calculo"("ejecucion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_alternativa_id_fkey" FOREIGN KEY ("alternativa_id") REFERENCES "alternativas_ruta"("alternativa_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas_versiones" ADD CONSTRAINT "rutas_versiones_ruta_id_fkey" FOREIGN KEY ("ruta_id") REFERENCES "rutas"("ruta_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas_versiones" ADD CONSTRAINT "rutas_versiones_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("vehiculo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paradas_ruta" ADD CONSTRAINT "paradas_ruta_ruta_version_id_fkey" FOREIGN KEY ("ruta_version_id") REFERENCES "rutas_versiones"("ruta_version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paradas_ruta" ADD CONSTRAINT "paradas_ruta_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("pedido_id") ON DELETE RESTRICT ON UPDATE CASCADE;
