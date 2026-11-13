# 04 Retrospectiva del Sprint — Sprint 2 V_1_1_0

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

## Base de la retrospectiva

Análisis documental de los incidentes y decisiones registrados en [la integración del 29/10](../../otros/soporte-sprint-02/Integraci%C3%B3n%20Sprints%201%20y%202%20V_1_1_0.md). No se afirma que haya ocurrido una reunión ni se atribuyen opiniones, votos o compromisos personales.

## Aprendizajes y aciertos

- Integrar mediante PR permite relacionar US-006–US-009 con cambios concretos sin volver a fusionar historias ya presentes.
- Los respaldos y comparaciones de integridad descritos en la evidencia preservaron datos al integrar; sus archivos privados no están en este clon.
- Un perfil E2E mock explícito separó verificaciones de interfaz de escrituras reales.
- Probar el bundle servido con nginx detectó el bloqueo CSP de Photon que no representaba el servidor Vite.
- Conservar los intentos fallidos evita confundir un reintento exitoso con ausencia de incidencias.
- Las auditorías y el defecto de filtros muestran que integrar código no completa todos los criterios de una historia.

## Acciones propuestas para validación

| Dimensión | Hallazgo / aprendizaje | Acción y resultado verificable | Responsable | Fecha o plazo | Estado |
|---|---|---|---|---|---|
| Personas | Liderazgo y validadores no identificados nominalmente | Acordar responsables por historia y revisión con registro aceptado | Pendiente de validación humana | No registrado | Propuesta |
| Relaciones | Permisos y cuenta opcional tienen decisiones provisionales | Ratificar con equipo/interesados la matriz y documentar comentarios o discrepancias | Pendiente de validación humana | No registrado | Propuesta |
| Procesos | PR integrado no acredita aceptación ni cierre | Checklist por historia: criterios, demo, resultado y aceptación identificada | Pendiente de validación humana | No registrado | Propuesta |
| Procesos | Migraciones e invariantes de intervalos requieren coordinación | Revisar dependencias y concurrencia en entorno de pruebas; registrar resultados reales | Pendiente de validación humana | No registrado | Propuesta; no ejecutada |
| Herramientas | CSP de nginx y mocks diferían del entorno inicial | Mantener perfil mock aislado y verificación de cabeceras del build | Pendiente de validación humana | No registrado | Implementación histórica parcial; adopción por validar |
| Herramientas | Auditorías no aprobadas en la base del 29/10 | Enlazar correcciones posteriores y registrar riesgos residuales antes de publicar | Pendiente de validación humana | No registrado | [Tratamiento posterior](../../otros/soporte-sprint-03/09%20Correcci%C3%B3n%20de%20auditor%C3%ADa%20de%20dependencias%20V_1_1_0.md); aceptación pendiente |

## Seguimiento

Para cada acción aceptada, el equipo debe aportar fecha, responsable, evidencia y criterio de cierre. No se inventa el resultado de una retrospectiva ni se declara un compromiso ya adoptado. La [revisión](03%20Revisi%C3%B3n%20del%20Sprint%20V_1_1_0.md) y el [registro](02%20Registro%20de%20Impedimentos%20V_1_1_0.md) mantienen visibles las decisiones pendientes.

## Historial de cambios

| Versión | Fecha | Alcance |
|---|---|---|
| V_1_0_0 | 02/10/2026 (documento original) | Sprint 1, conservado en [su archivo histórico](../Sprint%2001/04%20Retrospectiva%20del%20Sprint%20V_1_0_0.md). |
| V_1_1_0 | 2026-11-12 | Prepara gestión diferenciada del Sprint 2 desde evidencias; pendientes humanos explícitos; no ejecuta pruebas ni acredita cierre. |

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)
