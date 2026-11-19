# Revisión del sprint

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)

**Nombre del Proyecto:** Huancayo GreenRoute Logistics (proyecto HGR en Jira) — sistema DistriRapido de planificación y seguimiento de entregas de última milla

**Líder del Proyecto:** Rupay Chira, Rosalyn Exkra

> Sprint 4 · Versión V_1_1_0 · Fecha de corte: 2026-11-19 (America/Lima). El estado técnico corresponde a la rama `sprint-4` (`d2224e2`), que contiene las seis historias del sprint (US-018 a US-023). El Sprint 4 es el último sprint del proyecto.

## Historias de Usuario completadas en este Sprint

Las seis historias están implementadas y verificadas con pruebas automatizadas y manuales en el entorno local. Cada una tiene su informe técnico en esta misma carpeta.

| Código | Título | SP | Criterios de aceptación verificados | Cierre (PR / commit) |
|---|---|---|---|---|
| HGR-37 · US-018 (RF-015, ST-019) | Registrar incidencias de entrega | 5 | **Escenario 1:** la incidencia se guarda asociada a la entrega y al conductor de la sesión (`POST /driver/deliveries/:id/incidents`). **Escenario 2:** sin tipo o descripción se rechaza con HTTP 400 y un mensaje por campo, que el formulario muestra junto al campo. | [PR #13](https://github.com/RicardoF1/DistriRapido/pull/13) · [`fdab8f5`](https://github.com/RicardoF1/DistriRapido/commit/fdab8f5) |
| HGR-38 · US-019 (RF-016, ST-020) | Consultar estado operativo | 5 | **Escenario 1:** la página «Seguimiento operativo» presenta el resumen, las rutas en operación y el detalle de entregas e incidencias. **Escenario 2:** los filtros (estado de ruta y de entrega, fechas, placa o conductor, «solo con incidencias») muestran solo los registros que corresponden. **Ruta infeliz:** sin coincidencias se informa y los filtros se conservan. | [`853653c`](https://github.com/RicardoF1/DistriRapido/commit/853653c) en `sprint-4` |
| HGR-39 · US-020 (RF-019, ST-021) | Confirmar ruta | 5 | **Escenario 1:** una ruta `GENERADA` y revisada pasa a `CONFIRMADA` con fecha, usuario y versión confirmada (`PATCH /routes/:id/confirmation`). **Escenario 2:** si no cumple las condiciones, el backend responde 409 con todas las condiciones pendientes y la interfaz bloquea el botón. | [PR #20](https://github.com/RicardoF1/DistriRapido/pull/20) · [`af5af0d`](https://github.com/RicardoF1/DistriRapido/commit/af5af0d) |
| HGR-40 · US-021 (RF-017, ST-022) | Registrar información de sostenibilidad | 5 | **Escenario 1:** el registro (distancia, combustible, factor de emisión y origen) se guarda asociado a la ruta, su versión, su vehículo y el usuario; las emisiones de CO₂ las calcula el servidor. **Escenario 2:** con información incompleta responde 400 `INFORMACION_INSUFICIENTE` con la lista de campos requeridos y no guarda nada. | [`cc3ad8c`](https://github.com/RicardoF1/DistriRapido/commit/cc3ad8c), integrado con el [PR #21](https://github.com/RicardoF1/DistriRapido/pull/21) |
| HGR-41 · US-022 (RF-020, ST-023) | Consultar indicadores | 5 | **Escenario 1:** la página «Indicadores» presenta los indicadores de operación (rutas completadas, entregas, tasa de éxito, incidencias por tipo, duración media) y de sostenibilidad (cobertura del registro, km, combustible, CO₂, CO₂ por entrega, costo y origen de los datos) (`GET /operations/indicators`). **Escenario 2:** al elegir un periodo válido, en días de America/Lima, los indicadores corresponden a ese periodo. **Ruta infeliz (RF-020):** sin datos suficientes se informa y cada indicador que no se puede calcular muestra «Sin datos suficientes», nunca 0. | [PR #23](https://github.com/RicardoF1/DistriRapido/pull/23) · [`a98ca1c`](https://github.com/RicardoF1/DistriRapido/commit/a98ca1c) |
| HGR-42 · US-023 (RF-021, ST-024) | Consultar historial | 5 | **Escenario 1:** la página «Historial» presenta las operaciones terminadas y, en su detalle, la trazabilidad completa: planificación, confirmación, asignación, ejecución, entregas, incidencias y sostenibilidad (`GET /operations/history` y `GET /operations/history/:id`). **Escenario 2:** para un periodo sin operaciones informa «No existen registros para los criterios seleccionados» y conserva los filtros. | [PR #24](https://github.com/RicardoF1/DistriRapido/pull/24) · [`d2224e2`](https://github.com/RicardoF1/DistriRapido/commit/d2224e2) |

**Total implementado:** 30 Story Points.

**Estado en Jira (2026-11-18):** el sprint «SCRUM Sprint 4» (del 2026-11-09 al 2026-11-20) está activo en el tablero HGR y contiene HGR-37, HGR-38, HGR-39 y HGR-40, las cuatro en **Finalizada** con resolución **Listo** (20 SP completados). Cada historia tiene un comentario con su PR o commit de cierre, su informe técnico y el enlace al [PR #21](https://github.com/RicardoF1/DistriRapido/pull/21).

**Actualización (2026-11-19):** HGR-41 (US-022) y HGR-42 (US-023) **pertenecen al Sprint 4**, el último sprint del proyecto, y se implementaron dentro de él después de ese corte. En Jira se corrigen igual: se incorporan al «SCRUM Sprint 4» y pasan a **Finalizada** con su PR de cierre, de modo que el sprint queda con HGR-37 a HGR-42 (30 SP).

### Evidencia de calidad (último corte, US-023)

| Verificación | Resultado |
|---|---|
| Backend `npm run test:coverage` | 635 pruebas aprobadas en 50 suites; statements 91.64 %, branches 83.39 %, lines 94.71 % |
| Backend `npm run test:integration` (PostgreSQL aislado) | 164 pruebas aprobadas en 11 suites |
| Frontend `vitest --coverage` | 467 pruebas aprobadas en 47 archivos; statements 89.75 %, branches 83.78 %, lines 94.17 % |
| Typecheck, lint y build | Aprobados en backend y frontend |
| `npm audit --audit-level=high` | No aprobado por un único aviso de `picomatch` sin versión corregida publicada (ver Pendientes); los lockfiles no cambiaron en el sprint |
| Migraciones | Tres migraciones aditivas: `202611090001_us018_incidencias_entrega`, `202611170001_us020_confirmar_ruta`, `202611170002_us021_registrar_sostenibilidad`. US-022 y US-023 son consultas de solo lectura y no necesitan migraciones |

Detalle por historia: [US-018](01%20US-018%20Registrar%20incidencias%20V_1_0_0.md) · [US-019](02%20US-019%20Consultar%20estado%20operativo%20V_1_0_0.md) · [US-020](03%20US-020%20Confirmar%20ruta%20V_1_0_0.md) · [US-021](04%20US-021%20Registrar%20sostenibilidad%20V_1_0_0.md) · [US-022](05%20US-022%20Consultar%20indicadores%20V_1_0_0.md) · [US-023](06%20US-023%20Consultar%20historial%20V_1_0_0.md).

## Demostración del trabajo completado

**Entorno:** local (frontend Vite en `localhost:5173`, backend NestJS en `localhost:3000`, PostgreSQL 16 y OSRM local), con datos de prueba.

**Validación manual realizada por el equipo durante el sprint** (registrada en cada informe técnico):

- **US-018:** envío vacío señalado campo por campo sin llamar al servidor; incidencia con información complementaria guardada, visible en la parada y persistente tras recargar, sin cambiar el estado de la entrega. Probado en escritorio y a 375 px.
- **US-020:** una ruta cuyo vehículo y pedidos ya estaban en rutas asignadas recibió el 409 con la condición pendiente y la opción «Recargar ruta»; una ruta no confirmable mostró la condición y bloqueó el botón.
- **US-021:** formulario precargado con la distancia de la ruta y los datos del vehículo; registro «Estimado» guardado sobre una ruta confirmada; información incompleta, dato «Medido» sobre una ruta no completada y segundo registro rechazados.
- **US-022:** página con los últimos 30 días por defecto; sin rutas completadas en la base local, informa que no hay datos suficientes sin mostrar ceros engañosos; un periodo de más de 366 días se rechaza. Sin desbordamiento a 375 px.
- **US-023:** con filtros en la URL, el formulario los carga y aparece el mensaje de sin registros; el detalle de una ruta no terminada responde 404 y un rango invertido 400. Sin desbordamiento a 375 px.
- **US-019, y los escenarios con datos de US-022 y US-023:** verificados con pruebas de integración contra PostgreSQL (`operations.integration.ts`, `indicators.integration.ts` e `history.integration.ts`).

**Demostración a los stakeholders:** se presenta al docente en la Inspección 5 del 2026-11-20, de 18:20 a 18:40. Recorrido previsto: planificar una ruta → confirmarla (US-020) → asignarla al conductor → registrar una incidencia desde el panel del conductor (US-018) → consultarla en «Seguimiento operativo» con filtros (US-019) → registrar la información de sostenibilidad de la ruta (US-021) → completar las entregas desde el panel del conductor → consultar los indicadores del periodo (US-022) → revisar la operación terminada en el «Historial» (US-023). Los indicadores y el historial solo muestran rutas completadas, por lo que la ruta de la demostración debe terminarse antes de esos dos pasos. La retroalimentación recibida se registrará en la versión V_1_2_0 de este documento.

## Pendientes

| Elemento | Estado | Tratamiento |
|---|---|---|
| Integración en `main` | US-018 a US-021 están en `main` desde el [PR #22](https://github.com/RicardoF1/DistriRapido/pull/22); US-022 y US-023 están en `sprint-4` ([PR #23](https://github.com/RicardoF1/DistriRapido/pull/23) y [PR #24](https://github.com/RicardoF1/DistriRapido/pull/24)) | Abrir el PR de `sprint-4` hacia `main` |
| Registro en Jira | El «SCRUM Sprint 4» se creó y HGR-37 a HGR-40 se movieron a Finalizada el 2026-11-18, al cierre del periodo, por lo que su burndown no refleja el avance diario. HGR-41 y HGR-42 pertenecen al Sprint 4 y se corrigen en Jira de la misma forma | Incorporar HGR-41 y HGR-42 al «SCRUM Sprint 4» y moverlas a Finalizada con su PR de cierre (#23 y #24) |
| Roles «Supervisor» y «Planificador» | No existen en el sistema; por decisión del equipo los ejercen Administrador y Operador / Técnico, también en US-022 y US-023 | Si se crean, basta con añadirlos a `OPERATIONS_ROLES` y a `PlanningGuard` |
| Aviso de seguridad de `picomatch` (GHSA-fc5q-39xc-vjpf) | Detectado durante US-020. No hay versión corregida publicada, así que ninguna actualización lo resuelve todavía; es el único hallazgo que deja `npm audit` en rojo | Aplicar la versión corregida con `overrides` en cuanto se publique |
| HGR-43 / US-024 (deuda del Sprint 3) | Sigue en el backlog | Reprogramar y replanificar pedidos no entregados |
| Corrección de registros de sostenibilidad | Fuera de alcance de US-021 (un solo registro por ruta) | Requiere una historia propia con trazabilidad del cambio |
| Exportación del historial | Fuera de alcance de US-023 (la historia no la pide) | Requiere una historia propia |

---

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 2026-11-18 | Versión inicial de la Revisión del Sprint 4, con el estado de Jira al 2026-11-18. |
| V_1_1_0 | 2026-11-19 | Se incorporan US-022 y US-023, implementadas dentro del Sprint 4 por ser el último del proyecto (30 SP). Se retira la indicación de que pasaban al siguiente sprint, se actualizan la evidencia de calidad, la demostración y los pendientes, y se registra que en Jira ambas historias se incorporan al «SCRUM Sprint 4». |

[← Volver al README principal](../../../README.md)
