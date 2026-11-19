# US-023: Consultar historial

Versión documental: V_1_0_0. Fecha: 2026-11-19, America/Lima. Rama: `feature/us-023-consultar-historial`, creada desde `sprint-4` con US-022 ya integrada (`a98ca1c`). Estado: implementado y verificado en el entorno local de desarrollo; pendiente de revisión y aceptación del equipo.

## 1. Historia y trazabilidad

| Elemento | Valor |
|---|---|
| Historia | HGR-42 · US-023 Consultar historial (5 SP, prioridad Media) |
| Épica | EP-06 Historial y trazabilidad |
| Requisito | RF-021 Consultar historial de operaciones |
| Subtarea | ST-024 Implementar consulta histórica |
| Actor documentado | Administrador o Supervisor autorizado |

> Como **Administrador o Supervisor autorizado**, quiero **consultar el historial de operaciones**, para **revisar información de actividades realizadas anteriormente**.

| Criterio | Implementación | Evidencia automatizada |
|---|---|---|
| Escenario 1: con operaciones registradas, el historial muestra los registros disponibles | Página «Historial» (`/historial`) y `GET /operations/history`: operaciones terminadas de la más reciente a la más antigua. `GET /operations/history/:id` devuelve su trazabilidad completa | `history.spec.ts`, `history.integration.ts`, `HistoryPage.test.tsx` |
| Escenario 2: para un periodo sin operaciones, se informa que no existen registros | Mensaje «No existen registros para los criterios seleccionados». Los filtros se conservan para ajustarlos o limpiarlos | Mismas pruebas |
| RF-021, ruta feliz: con un filtro permitido se presentan los registros que lo cumplen | Filtros por periodo de finalización, placa o conductor, «solo con incidencias» y «solo con entregas no realizadas» | Mismas pruebas (cuatro filtros contra PostgreSQL) |

## 2. Decisiones del incremento

- **Actor.** El historial lo consultan **Administrador** y **Operador / Técnico** (el «Supervisor» del proyecto) con el mismo `OperationsGuard` de US-019 y US-022. Conductor y Auditor Externo reciben 403. El equipo lo confirmó para esta historia.
- **Qué es una operación del historial.** Una ruta `COMPLETADA`, con su versión vigente. Así el historial no duplica el «Seguimiento operativo» de US-019, que muestra lo que está pasando, ni los «Indicadores» de US-022, que agregan cifras: aquí se revisa cada operación terminada una por una.
- **Orden y periodo.** Las operaciones se ordenan por fecha de finalización, de la más reciente a la más antigua. El periodo usa días completos de America/Lima (UTC−05:00) sobre la fecha de finalización; «hasta» incluye todo el día. Una fecha inexistente o un rango invertido responden 400.
- **Trazabilidad (RF-021, área «Auditoría»).** El detalle reúne, con quién y cuándo:
  - la planificación de origen y su versión;
  - la confirmación (US-020), con la fecha, el usuario y la versión confirmada;
  - la asignación, el inicio y el fin, con el conductor y el vehículo;
  - las entregas, con su estado, su causa y sus incidencias (US-018);
  - el registro de sostenibilidad (US-021), con quién lo registró.
- **Rutas anteriores a US-020.** No tienen confirmación registrada. El detalle lo indica de forma explícita en lugar de dejar el dato vacío.
- **Filtros de entregas.** «Solo con incidencias» y «solo con entregas no realizadas» se evalúan sobre la versión vigente con la misma consulta que US-019, que ahora se comparte (`routesMatchingDeliveries`).
- **Solo lectura y sin migraciones.** No se editan ni se borran registros. La exportación a Excel o PDF queda fuera de alcance porque la historia no la pide.

## 3. Cambios

### Backend

- `GET /operations/history`: listado paginado de 12 en 12 (máximo 50), con la planificación, el conductor, el vehículo, las entregas realizadas y no realizadas, las incidencias y si la operación tiene registro de sostenibilidad.
- `GET /operations/history/:id`: trazabilidad completa. Una ruta inexistente o que todavía no ha terminado responde 404.
- `HistoryQueryDto` admite solo los filtros permitidos, con un mensaje por filtro inválido; los parámetros desconocidos se rechazan.
- Los dos endpoints usan `JwtAuthGuard`, `OperationsGuard`, `RequestOriginGuard` y `Cache-Control: no-store`.
- `operations.service.ts` expone `routesMatchingDeliveries` como función compartida entre US-019 y US-023, sin cambiar su comportamiento.

### Frontend

- Página `HistoryPage` en `/historial`, cargada con `lazyPage` (fragmento propio de 12,5 kB), con enlace «Historial» en el menú de los roles autorizados y protección en `ProtectedRoute`.
- Los filtros y la página se reflejan en la URL, así que se pueden compartir y funcionan con Atrás y Adelante. Los parámetros no permitidos de la URL se ignoran. La validación local evita consultar un rango invertido.
- `HistoryOperationDetail`: línea de tiempo de la operación, entregas con sus incidencias y sostenibilidad. El foco pasa al título al abrir y vuelve al botón «Ver detalle» al cerrar.
- Accesibilidad: etiquetas en todos los filtros, tabla con cabeceras `scope="col"` en una región desplazable con nombre propio, `aria-expanded` en «Ver detalle», nombres accesibles que identifican la operación, listas con nombre propio y estado anunciado con `role="status"`.

## 4. Verificaciones ejecutadas

| Comando o verificación | Resultado |
|---|---|
| Backend `npm run typecheck` | Aprobado |
| Backend `npm run lint` | Aprobado |
| Backend `npm run test:coverage` | 635 pruebas aprobadas en 50 suites; statements 91.64 %, branches 83.39 %, functions 87.17 %, lines 94.71 % |
| Backend `npm run test:integration` (PostgreSQL aislado `distrirapido_test`) | 164 pruebas aprobadas en 11 suites, incluida la nueva `history.integration.ts` (13 pruebas: roles, orden y resumen, cuatro filtros, periodo sin registros, detalle con trazabilidad, rutas sin confirmación, 404 y 400) |
| Backend `npm run build` | Aprobado |
| Frontend `npm run typecheck` | Aprobado |
| Frontend `npm run lint` | Aprobado |
| Frontend `vitest run --coverage --pool=forks --maxWorkers=1` | 467 pruebas aprobadas en 47 archivos; statements 89.75 %, branches 83.78 %, functions 87.46 %, lines 94.17 % |
| Frontend `npm run build` | Aprobado; `HistoryPage` se genera como fragmento propio de 12,46 kB (4,09 kB gzip) |
| `npm audit --audit-level=high` (backend y frontend) | **No aprobado, sin relación con US-023.** Persiste el aviso alto de `picomatch` (GHSA-fc5q-39xc-vjpf), todavía sin parche. Los lockfiles no cambian en esta rama |
| Prueba manual en navegador (base local de desarrollo) | Sin filtros, la página informa que todavía no hay operaciones terminadas, porque la base local no tiene rutas completadas. Escenario 2: con un periodo y «solo con incidencias» en la URL, los filtros se cargan en el formulario y aparece «No existen registros para los criterios seleccionados». La API responde 404 al detalle de una ruta que todavía no ha terminado y 400 a un rango invertido. Sin desbordamiento horizontal a 375 px. El escenario 1 y el detalle con valores reales quedan cubiertos por la prueba de integración contra PostgreSQL |

**Nota del entorno local:** con Node 26 las pruebas del frontend se ejecutaron con `NODE_OPTIONS=--no-experimental-webstorage`. La CI usa Node 24.

## 5. Pendientes

- Revisión del equipo y aceptación de la historia en Jira (HGR-42).
- Resolver el aviso de `picomatch` cuando se publique una versión corregida.

[← Volver al README principal](../../../README.md)
