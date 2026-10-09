# US-009 Migración local V_1_1_0

## 1. Identificación

- Historia: US-009
- Hito: HGR-27
- Requisito: RF-007
- Versión: 1.1.0
- Migración: 202610090002_us009_disponibilidad_conductores

## 2. Objetivo

Aplicar localmente la migración que incorpora el registro de disponibilidad operativa de conductores mediante intervalos de fecha y hora.

## 3. Prerrequisitos

- Docker Desktop activo.
- Rama feature/HGR-27-US009-disponibilidad.
- PostgreSQL disponible.
- Archivo .env configurado.
- Migración US-008 de conductores aplicada.

## 4. Archivo de migración

Ruta:

src/backend/prisma/migrations/202610090002_us009_disponibilidad_conductores/migration.sql

La migración es aditiva y conserva los datos preexistentes.

## 5. Aplicación

Desde la raíz del repositorio:

docker compose up -d postgres

docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance run --rm --build migrate

Resultado esperado:

Applying migration 202610090002_us009_disponibilidad_conductores

All migrations have been successfully applied.

## 6. Verificación

Listar tablas:

docker compose exec postgres psql -U distrirapido -d distrirapido -c "\dt"

Revisar estructura:

docker compose exec postgres psql -U distrirapido -d distrirapido -c "\d disponibilidades_conductores"

Consultar historial:

docker compose exec postgres psql -U distrirapido -d distrirapido -c "SELECT migration_name, finished_at IS NOT NULL AS aplicada FROM _prisma_migrations ORDER BY started_at;"

## 7. Estructura esperada

La tabla disponibilidades_conductores contiene:

- disponibilidad_id
- conductor_id
- inicio
- fin
- estado
- creado_en
- actualizado_en

Restricciones:

- Clave primaria UUID.
- Clave foránea hacia conductores.
- Fin posterior al inicio.
- Estados DISPONIBLE y NO_DISPONIBLE.
- Índices por estado y por intervalo.
- Restricción única por conductor, inicio y fin.

## 8. Precauciones

No ejecutar docker compose down -v, porque elimina los volúmenes y datos locales.

La detección de intervalos parcialmente superpuestos se realiza en AvailabilityService. La base de datos valida claves, estados, periodos y duplicados exactos.

## 9. Dependencias pendientes

La disponibilidad de vehículos se integrará cuando US-007 proporcione el modelo oficial de vehículos.

El bloqueo de modificaciones después de iniciar la planificación se integrará cuando US-010 proporcione el estado oficial de planificación.
