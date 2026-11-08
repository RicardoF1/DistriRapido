# 01 Revisión del Sprint V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7
- Validación funcional con OSRM local: 2026-11-06, commit 600564f6c309e36b38904830652c5add1f70a799

## Objetivo del Sprint

Consolidar el flujo de planificación y operación de última milla, desde la generación de alternativas de ruta hasta la asignación al conductor y la actualización del estado de las entregas.

## Historias integradas

- **HGR-33:** generación y comparación de alternativas de ruta.
- **HGR-34:** capacidad backend de asignación persistente con control de versión; interfaz de asignación pendiente.
- **HGR-35:** consulta de rutas asignadas por el conductor autenticado.
- **HGR-36:** actualización del estado de entregas y progreso de ruta.

## Incremento entregado

1. Preparación de planificación con origen, pedidos, vehículo y conductores.
2. Generación de alternativas secuenciales y métricas registradas.
3. Visualización de geometrías, advertencias y comparación de recorridos.
4. Asignación de ruta con control de versión en el backend (endpoint `PATCH /routes/:id/assignment`); la interfaz web no ofrece todavía la acción de asignar.
5. Panel operativo para el conductor autenticado.
6. Actualización de entregas con validación de pertenencia y reglas de transición.
7. Persistencia mediante migraciones de Prisma y PostgreSQL.

### Alcance de la asignación (HGR-34)

- Backend implementado: el endpoint `PATCH /routes/:id/assignment` persiste la asignación de una ruta a un conductor con control de versión y estado.
- Pruebas automatizadas del backend: `src/backend/src/routes/route-assignment.spec.ts` cubre, entre otros casos, la asignación de una ruta confirmable a un conductor activo y disponible y el rechazo de rutas inexistentes o ya asignadas.
- Frontend: no existe un flujo de asignación. La consulta de recorridos indica "La asignación no está habilitada en este incremento."

HGR-34 no se declara validada funcionalmente de extremo a extremo. Como ninguna ruta ha sido asignada, la consulta de rutas por el conductor (HGR-35) y la actualización de entregas sobre una ruta real (HGR-36) tampoco se han ejercitado manualmente de extremo a extremo.

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
- OSRM local: 127.0.0.1:5000, v26.10.0, perfil driving, revisión `geofabrik-peru-261105-sha256:70cce1d0a42c-car-mld-osrm-v26.10.0`.
- Cobertura geográfica privada v1.0.0 aprovisionada localmente.
- Nueve migraciones reconocidas y esquema actualizado.

## Resultado

El incremento del Sprint 3 fue integrado en main, probado y levantado localmente. El 2026-11-06 se aprovisionó OSRM local y se validó el cálculo vial real desde la interfaz sobre `600564f`, con backend y frontend reconstruidos desde ese commit. La ruta de referencia `d9ebaee0-85df-4504-99d6-764839838c6a` midió 3.89 km, 5.9 min de viaje y 130 min con atención y esperas, con procedencia OSRM y revisión `geofabrik-peru-261105-sha256:70cce1d0a42c-car-mld-osrm-v26.10.0` (detalle en 06 Evidencia técnica de cierre del Sprint 3 V_1_0_0). Hay tres rutas registradas por tres ejecuciones manuales. Ninguna tiene conductor asignado: el backend dispone del endpoint de asignación con control de versión, pero la interfaz no ofrece esa acción en este incremento. No es un fallo de OSRM.
