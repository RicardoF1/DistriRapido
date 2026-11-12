-- Green IT (área 1): índices para filtros, ordenaciones y uniones frecuentes.
-- Migración aditiva: solo crea índices; no modifica ni elimina datos.

-- Listado de pedidos: filtro por estado y orden por fecha de creación descendente.
CREATE INDEX "idx_pedidos_estado_creado" ON "pedidos"("estado", "creado_en" DESC);
CREATE INDEX "idx_pedidos_creado" ON "pedidos"("creado_en" DESC);

-- Seguimiento operativo (US-019): orden por fecha de asignación descendente.
CREATE INDEX "idx_rutas_asignado" ON "rutas"("asignado_en" DESC);

-- Claves foráneas sin índice propio usadas en uniones y validaciones de borrado.
CREATE INDEX "idx_paradas_ruta_pedido" ON "paradas_ruta"("pedido_id");
CREATE INDEX "idx_rutas_versiones_vehiculo" ON "rutas_versiones"("vehiculo_id");
CREATE INDEX "idx_ejecuciones_calculo_version" ON "ejecuciones_calculo"("version_id");
