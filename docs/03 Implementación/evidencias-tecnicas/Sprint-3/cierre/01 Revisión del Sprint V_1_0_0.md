# 01 Revisión del Sprint V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7

## Objetivo del Sprint

Consolidar el flujo de planificación y operación de última milla, desde la generación de alternativas de ruta hasta la asignación al conductor y la actualización del estado de las entregas.

## Historias integradas

- **HGR-33:** generación y comparación de alternativas de ruta.
- **HGR-34:** asignación persistente de rutas a conductores disponibles.
- **HGR-35:** consulta de rutas asignadas por el conductor autenticado.
- **HGR-36:** actualización del estado de entregas y progreso de ruta.

## Incremento entregado

1. Preparación de planificación con origen, pedidos, vehículo y conductores.
2. Generación de alternativas secuenciales y métricas registradas.
3. Visualización de geometrías, advertencias y comparación de recorridos.
4. Asignación de ruta con control de versión.
5. Panel operativo para el conductor autenticado.
6. Actualización de entregas con validación de pertenencia y reglas de transición.
7. Persistencia mediante migraciones de Prisma y PostgreSQL.

## Validación

### Backend

42 suites aprobadas.
463 pruebas aprobadas.
Resultado obtenido durante la reconciliación final del Sprint 3.

### Frontend

37 archivos de pruebas aprobados.
306 pruebas aprobadas.
Cobertura: statements 87.04%, branches 80.09%, functions 83.89%, lines 92.15%.

### Integración continua

Los checks de backend, frontend, CodeQL y code scanning aprobaron antes de la integración final. El PR #12 fusionó feature/sprint-3-avances hacia main.

## Demostración local

- Frontend: http://localhost:5173.
- Backend: http://localhost:3000.
- PostgreSQL: 127.0.0.1:5432.
- Cobertura geográfica privada v1.0.0 aprovisionada localmente.
- Nueve migraciones reconocidas y esquema actualizado.

## Resultado

El incremento del Sprint 3 fue integrado en main, probado y levantado localmente. El cálculo vial real requiere además el aprovisionamiento de OSRM y su grafo de red autorizado.
