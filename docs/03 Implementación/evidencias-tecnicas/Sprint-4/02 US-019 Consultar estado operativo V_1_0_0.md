# US-019: Consultar estado de rutas y entregas

Versión documental: V_1_0_0. Fecha: 2026-11-09, America/Lima. Rama: `feature/us-019-consultar-estado-operativo`, creada desde `sprint-4` con US-018 ya integrada (`fdab8f5`). Estado: implementado y verificado en el entorno local de desarrollo; pendiente de revisión y aceptación del equipo.

## 1. Historia y trazabilidad

| Elemento | Valor |
|---|---|
| Historia | US-019 Consultar estado operativo (5 SP, prioridad Alta) |
| Épica | EP-04 Ejecución y seguimiento de entregas |
| Requisito | RF-016 Consultar estado de rutas y entregas |
| Subtarea | ST-020 Implementar seguimiento operativo |
| Actor documentado | Supervisor |

> Como **Supervisor**, quiero **consultar el estado de las rutas y entregas**, para **dar seguimiento a la operación logística**.

| Criterio | Implementación | Evidencia automatizada |
|---|---|---|
| Escenario 1 / Ruta Gold: con rutas y entregas registradas, se presenta su estado | Página «Seguimiento operativo» (`/seguimiento`) con resumen general, listado de rutas en operación y detalle de entregas e incidencias | `operations.spec.ts`, `operations.integration.ts`, `OperationsPage.test.tsx` |
| Escenario 2 / Ruta Feliz: con un filtro permitido, solo se muestran los registros correspondientes | Filtros por estado de la ruta, estado de entrega, fechas de asignación, placa o conductor y «solo con incidencias»; también `conductor_id` en la API | Mismas pruebas (siete combinaciones de filtros contra PostgreSQL) |
| Ruta Infeliz: sin coincidencias se informa y la consulta sigue disponible | Mensaje «No existen operaciones que coincidan con los filtros aplicados»; los filtros se conservan para ajustarlos o limpiarlos | `operations.integration.ts`, `OperationsPage.test.tsx` |

## 2. Decisiones del incremento

- **Actor Supervisor.** El sistema no tiene un rol «Supervisor» y RF-016 lo dejaba pendiente de decisión formal. Para este incremento el equipo decidió que la consulta la ejercen los roles existentes **Administrador** y **Operador / Técnico**, los mismos que ya consultan rutas. No se creó un rol nuevo ni se cambiaron cuentas. Conductor y Auditor Externo reciben 403.
- **Alcance «en operación».** Se consideran las rutas `ASIGNADA`, `EN_CURSO` y `COMPLETADA`. Las rutas `GENERADA` pertenecen a la planificación y se siguen consultando en «Consultar rutas» (US-013).
- **Versión vigente.** El progreso, los filtros por estado de entrega y por incidencias, y el resumen usan siempre la versión vigente de cada ruta, igual que el panel del conductor.
- **Fechas.** Los filtros «desde» y «hasta» son días completos en America/Lima (UTC−05:00); «hasta» incluye todo el día. Una fecha inexistente o un rango invertido responden 400.
- **Combinación de filtros.** Todos los filtros se combinan con «y». «Estado de entrega» y «con incidencias» se evalúan por ruta: la ruta debe tener alguna entrega en ese estado y alguna incidencia, no necesariamente en la misma parada.
- **Resumen general.** Muestra los totales de toda la operación, sin filtros ni paginación, para dar contexto al listado filtrado.
- **Solo lectura.** No se modifican rutas, entregas ni incidencias. No se implementan indicadores de US-022 ni el historial de US-023.

## 3. Cambios

### Backend

Módulo nuevo `operations`, sin migraciones:

- `GET /operations/summary`: rutas por estado, entregas por estado e incidencias de las rutas en operación.
- `GET /operations/routes`: listado paginado (10 por página, máximo 50) con conductor, vehículo, fechas, contadores de entregas, porcentaje de avance e incidencias.
- `GET /operations/routes/:id`: entregas en orden con dirección, estado, causa de no entrega, hora de atención, estado del pedido e incidencias. Una ruta inexistente o `GENERADA` responde 404.
- `OperationsQueryDto` admite solo los filtros permitidos, con un mensaje por filtro inválido; los parámetros desconocidos se rechazan.
- `OperationsGuard`: Administrador y Operador / Técnico. Se aplican además `JwtAuthGuard` y `RequestOriginGuard`, y el controlador se excluye del límite de peticiones, como las demás consultas.

### Frontend

- Página `OperationsPage` en `/seguimiento`, con enlace «Seguimiento operativo» en el menú lateral de los roles autorizados y protección de ruta en `ProtectedRoute`.
- Los filtros se reflejan en la URL: se pueden compartir y funcionan con Atrás y Adelante. Los parámetros no permitidos de la URL se ignoran.
- La validación local del rango de fechas evita consultas inválidas; los errores del backend se muestran con opción de reintentar.
- `OperationRouteDetail`: detalle de entregas e incidencias. El foco pasa al título al abrir y vuelve al botón de la ruta al cerrar.
- Accesibilidad: etiquetas en todos los filtros, tabla con cabeceras `scope="col"` y una región desplazable con nombre propio, `aria-expanded` en «Ver entregas», nombres accesibles que identifican la ruta y estado anunciado con `role="status"`.
- Diseño adaptable sin desbordamiento horizontal a 375 px. Se corrigió que el texto `.sr-only` de la cabecera, posicionado de forma absoluta, ensanchaba la página.

## 4. Verificaciones ejecutadas

| Comando o verificación | Resultado |
|---|---|
| Backend `npm run typecheck` | Aprobado |
| Backend `npm run lint` | Aprobado |
| Backend `npm run test:coverage` | 538 pruebas aprobadas en 45 suites; statements 90.48 %, branches 81.51 %, functions 87.13 %, lines 93.56 % |
| Backend `npm run test:integration` (PostgreSQL aislado `distrirapido_test`) | 139 pruebas aprobadas en 9 suites, incluida la nueva `operations.integration.ts` (14 pruebas: permisos, resumen, filtros, fechas en Lima, rechazo de filtros y detalle) |
| Backend `npm run build` | Aprobado |
| Frontend `npm run typecheck` | Aprobado |
| Frontend `npm run lint` | Aprobado |
| Frontend `npm run test:coverage -- --pool=forks --maxWorkers=1` | 389 pruebas aprobadas en 41 archivos; statements 88.54 %, branches 81.35 %, functions 85.73 %, lines 93.18 % |
| Frontend `npm run build` | Aprobado; se mantiene la advertencia previa de tamaño de bundle |
| Prueba manual en navegador con datos locales | El resumen y el listado muestran las rutas asignadas con progreso e incidencias. El filtro «Completada» presenta el mensaje sin resultados y conserva el filtro. «Solo con incidencias» y el detalle muestran la incidencia registrada en US-018. Sin desbordamiento horizontal a 375 px. |

**Nota del entorno local:** con Node 26 las pruebas del frontend se ejecutaron con `NODE_OPTIONS=--no-experimental-webstorage`, como se explica en la evidencia de US-018. La CI usa Node 24.

## 5. Pendientes

- Revisión del equipo y aceptación de la historia en Jira.
- Si el equipo decide crear un rol «Supervisor» propio, basta con añadirlo a `OPERATIONS_ROLES` en el backend y a las rutas operativas del frontend.
