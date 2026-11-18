# 03 Revisión del Sprint — Sprint 2 V_1_1_0

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

## Objetivo y contraste del incremento

Objetivo técnico reconstruido: ampliar la operación inicial de pedidos con estados, vehículos, conductores y disponibilidad. **Sprint Goal oficial, fechas, asistentes y reunión de revisión: Pendiente de validación humana.**

| Incremento mostrado por la evidencia | Resultado histórico | Aceptación |
|---|---|---|
| US-006 y US-007 | Integrados en PR #7; la integración posterior registra endpoints de pedidos y vehículos disponibles | Pendiente de aportar por el equipo |
| US-008 | Informe del 09/10 describe formulario real, alta, edición y cambios ACTIVO/INACTIVO persistidos | Validación técnica local; no cierre Jira ni aceptación de stakeholders |
| US-009 | Informe técnico e integración describen disponibilidad por intervalos y verificación de superposición | Pendiente de validar los criterios completos y coordinación con vehículos/planificación |
| Regresión conjunta | Informe del 29/10: E2E mock 62/62; 71 pruebas de integración y 41 comprobaciones adicionales | No sustituye demostración ante interesados |

## Evidencia de demostración disponible

- [US-008: aplicación y prueba real local](../../otros/soporte-sprint-02/US-008%20Migraci%C3%B3n%20local%20V_1_1_0.md): describe el recorrido y límites; los JSON y el respaldo se guardaron en `.local/` del entorno original, no disponibles en el clon.
- [Integración Sprints 1 y 2](../../otros/soporte-sprint-02/Integraci%C3%B3n%20Sprints%201%20y%202%20V_1_1_0.md): pruebas y verificaciones históricas, fallos intermedios y corrida final.
- [Artefactos Jira](../../02%20Planificaci%C3%B3n/02%20Artefactos%20Jira%20V_1_0_0.md): cinco capturas de planificación del Sprint 1; no acreditan cierre del Sprint 2.
- Video, acta de demo, participantes, comentarios y aceptación individual: **Pendiente de aportar por el equipo**.

No se repitió la demo: crear usuarios, vehículos o pedidos supone escrituras y no es necesario para corregir documentación.

## Pendientes y decisión de revisión

Consultar [estado](01%20Informe%20de%20estado%20del%20proyecto%20V_1_1_0.md) e [impedimentos](02%20Registro%20de%20Impedimentos%20V_1_1_0.md). La implementación e integración están respaldadas por Git y por informes; las decisiones de roles, aceptación, filtros y concurrencia requieren trazabilidad. **Entrega de gestión preparada, pendiente de validación humana; no se declara sprint terminado.**

## Historial de cambios

| Versión | Fecha | Alcance |
|---|---|---|
| V_1_0_0 | 02/10/2026 (documento original) | Sprint 1, conservado en [su archivo histórico](../Sprint%2001/03%20Revisi%C3%B3n%20del%20Sprint%20V_1_0_0.md). |
| V_1_1_0 | 2026-11-12 | Prepara gestión diferenciada del Sprint 2 desde evidencias; pendientes humanos explícitos; no ejecuta pruebas ni acredita cierre. |

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)
