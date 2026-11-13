# 01 Informe de estado del proyecto — Sprint 2 V_1_1_0

## Identificación y límites

| Campo | Valor |
|---|---|
| Sprint | 2: US-006 a US-009 (HGR-22, HGR-24, HGR-26, HGR-27) |
| Versión documental | V_1_1_0: continuidad documental con alcance Sprint 2 |
| Fecha de preparación documental | 2026-11-12, America/Lima |
| Base inspeccionada | main, `7cdde3b765aa4898ef61789640900bad4910d386` |
| Fechas reales de inicio/fin y responsables | Pendiente de validación humana |
| Estado de entrega | Preparada desde evidencia existente; no acredita reunión, aceptación ni cierre del sprint |

El informe V_1_0_0 del mismo nombre conserva el Sprint 1. Esta versión amplía la serie para distinguir el Sprint 2, sin reinterpretar las pruebas antiguas como ejecutadas hoy. La fuente principal es [Integración Sprints 1 y 2, 2026-10-29](../../otros/soporte-sprint-02/Integraci%C3%B3n%20Sprints%201%20y%202%20V_1_1_0.md). No se accedió al Jira actual ni a la consigna de Drive.

## Estado real e historias

| Historia | Evidencia de implementación integrada | Estado demostrable | Pendiente |
|---|---|---|---|
| HGR-22 / US-006: actualizar estado de pedido | [PR #7](https://github.com/RicardoF1/DistriRapido/pull/7), [servicio](../../../src/backend/src/orders/orders.service.ts) | Transiciones incorporadas; el informe del 29/10 registra defecto en filtros EN_PREPARACION | Corroborar aceptación y tratamiento del defecto; no confundir transición con filtro |
| HGR-24 / US-007: gestionar vehículos | [PR #7](https://github.com/RicardoF1/DistriRapido/pull/7), corrección `128af98`, [servicio](../../../src/backend/src/vehicles/vehicles.service.ts) | Alta, consulta y edición administrativas documentadas en la integración; no se acredita eliminación | Aceptación de criterios y coordinación de disponibilidad |
| HGR-26 / US-008: gestionar conductores | [PR #5](https://github.com/RicardoF1/DistriRapido/pull/5), [prueba local histórica](../../otros/soporte-sprint-02/US-008%20Migraci%C3%B3n%20local%20V_1_1_0.md) | Alta, consulta, edición y cambio de estado con PostgreSQL reportados el 09/10 | Ratificar permisos, cuenta opcional y ACTIVO/INACTIVO; vinculación real no probada en esa ejecución |
| HGR-27 / US-009: disponibilidad operativa | [PR #6](https://github.com/RicardoF1/DistriRapido/pull/6) integrado vía PR #5, [implementación](../../otros/soporte-sprint-02/US-009%20Implementaci%C3%B3n%20V_1_1_0.md) | Intervalos de conductores incorporados; integración posterior registra verificaciones HTTP | Disponibilidad de vehículos y bloqueo por planificación; aceptación formal |

**Incrementos implementados e integrados según los informes:** las cuatro historias tienen aportes integrados y verificaciones históricas. Esto no acredita que todos sus criterios estén satisfechos. **Finalización y aceptación por historia:** pendientes de validación humana con evidencia suficiente. No se declara terminado el Sprint 2.

## Verificaciones históricas y alcance

La integración del 29/10 registra backend 312 pruebas, frontend 250, integración 71, 41 comprobaciones HTTP adicionales y E2E mock 62/62. También registra auditorías no aprobadas (backend 10 vulnerabilidades y frontend 5) y fallos intermedios. Son resultados de esa base histórica, no del HEAD actual ni pruebas de esta revisión documental.

Las correcciones posteriores de dependencias, la interfaz de asignación y Green IT pertenecen a fases posteriores. Consultar [Sprint 3](../Sprint%2003/01%20Revisi%C3%B3n%20del%20Sprint%20V_1_1_0.md) y [Green IT](../reduccion%20del%20impacto%20ambiental/01%20Informe%20de%20reduccion%20del%20impacto%20ambiental%20V_1_0_0.md) antes de trasladar pendientes al estado vigente.

## Pendientes de gestión

Validar objetivo y calendario efectivo del Sprint 2, criterios aceptados por historia, registro de impedimentos y sus responsables, demo, comentarios de interesados y cierre Jira. Los riesgos se detallan en el [registro de impedimentos](02%20Registro%20de%20Impedimentos%20V_1_1_0.md). No asignar un porcentaje de avance sin una línea base aceptada.

## Historial de cambios

| Versión | Fecha | Alcance |
|---|---|---|
| V_1_0_0 | 02/10/2026 (documento original) | Sprint 1, conservado en [su archivo histórico](../Sprint%2001/01%20Informe%20de%20estado%20del%20proyecto%20V_1_0_0.md). |
| V_1_1_0 | 2026-11-12 | Prepara gestión diferenciada del Sprint 2 desde evidencias; pendientes humanos explícitos; no ejecuta pruebas ni acredita cierre. |

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)
