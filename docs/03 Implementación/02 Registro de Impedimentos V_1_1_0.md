# 02 Registro de Impedimentos — Sprint 2 V_1_1_0

## Identificación y límites

| Campo | Valor |
|---|---|
| Sprint | 2: US-006 a US-009 (HGR-22, HGR-24, HGR-26, HGR-27) |
| Versión documental | V_1_1_0: continuidad documental con alcance Sprint 2 |
| Fecha de preparación documental | 2026-11-12, America/Lima |
| Base inspeccionada | main, `7cdde3b765aa4898ef61789640900bad4910d386` |
| Fechas reales de inicio/fin y responsables | Pendiente de validación humana |
| Estado de entrega | Preparada desde evidencia existente; no acredita reunión, aceptación ni cierre del sprint |

El informe V_1_0_0 del mismo nombre conserva el Sprint 1. Esta versión amplía la serie para distinguir el Sprint 2, sin reinterpretar las pruebas antiguas como ejecutadas hoy. La fuente principal es [Integración Sprints 1 y 2, 2026-10-29](evidencias-tecnicas/Sprint-2/Integración%20Sprints%201%20y%202%20V_1_1_0.md). No se accedió al Jira actual ni a la consigna de Drive.

## Registro contrastado

Las prioridades son una valoración documental de impacto, no prioridades consultadas en Jira. La fecha 2026-10-29 identifica la evidencia de integración; no es necesariamente la fecha de detección ni la fecha de resolución. Ningún autor Git se asigna automáticamente como responsable.

| ID | Impedimento e impacto | Prioridad propuesta | Responsable / reportante | Fecha de registro / plazo | Estado y resolución acreditada |
|---|---|---|---|---|---|
| S2-I01 | Auditorías de dependencias no aprobadas; riesgo para publicación | Alta | Pendiente de validación humana | No registrados; evidencia 29/10 | Abierto en la integración; [informe posterior de corrección](evidencias-tecnicas/Sprint-3/09%20Corrección%20de%20auditoría%20de%20dependencias%20V_1_1_0.md) registra tratamiento. Fecha efectiva y aceptación de cierre Sprint 2: pendientes |
| S2-I02 | Filtro EN_PREPARACION devuelve 400 aunque se permiten transiciones; limita consulta | Alta | Pendiente de validación humana | No registrados; evidencia 29/10 | No se acredita aquí resolución. Corroborar mediante evidencia específica sin atribuirlo a una nueva prueba |
| S2-I03 | Carreras concurrentes de estados o intervalos; riesgo de inconsistencias | Alta | Pendiente de validación humana | No registrados; evidencia 29/10 | La integración pide diseño y validación de concurrencia; no declara la carrera resuelta |
| S2-I04 | Roles/cuenta opcional/estados de conductores no ratificados; ambigüedad de aceptación | Alta | Pendiente de validación humana | No registrados | Decisiones provisionales implementadas; ratificación no aportada |
| S2-I05 | CSP bloqueaba Photon en Docker y mocks incompletos; impedían verificación aislada | Media | Pendiente de validación humana | No registrados; evidencia 29/10 | El informe de integración registra ajuste CSP y corrida final 62/62. Fecha de corrección efectiva no registrada separadamente |
| S2-I06 | Permiso de redistribución INEI sin confirmar; impide publicación de recursos e imágenes | Alta | Pendiente de validación humana | No registrados | Pendiente; código público no equivale a permiso sobre los datos |
| S2-I07 | Falta evidencia formal de demo, aceptación y cierre; impide acreditar gestión completa | Alta | Pendiente de validación humana | No registrados | Pendiente de aportar por el equipo |

## Evidencias y seguimiento

Fuente: [pendientes priorizados y corridas de integración](evidencias-tecnicas/Sprint-2/Integración%20Sprints%201%20y%202%20V_1_1_0.md), [decisiones US-008](evidencias-tecnicas/Sprint-2/US-008%20Implementación%20V_1_1_0.md), [dependencias US-009](evidencias-tecnicas/Sprint-2/US-009%20Migración%20local%20V_1_1_0.md).

Cada cierre requiere evidencia, fecha real y persona que valida. Las instrucciones de migración de los informes son antecedentes/procedimientos: no se ejecutaron en esta revisión. Si un incremento posterior resuelve un problema, registrar su commit y alcance sin alterar retroactivamente el Sprint 2.

## Historial de cambios

| Versión | Fecha | Alcance |
|---|---|---|
| V_1_0_0 | 02/10/2026 (documento original) | Sprint 1, conservado en [su archivo histórico](02%20Registro%20de%20Impedimentos%20V_1_0_0.md). |
| V_1_1_0 | 2026-11-12 | Prepara gestión diferenciada del Sprint 2 desde evidencias; pendientes humanos explícitos; no ejecuta pruebas ni acredita cierre. |

[← Volver al README principal](../../README.md) · [Índice documental](../README.md)
