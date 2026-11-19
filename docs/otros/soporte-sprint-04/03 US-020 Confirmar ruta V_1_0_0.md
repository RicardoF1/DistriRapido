# US-020: Confirmar ruta

Versión documental: V_1_0_0. Fecha: 2026-11-17, America/Lima. Rama: `feature/us-020-confirmar-ruta`, creada desde `sprint-4` después de integrar `main` (`7dff763`). Estado: implementado y verificado en el entorno local de desarrollo; pendiente de revisión y aceptación del equipo.

## 1. Historia y trazabilidad

| Elemento | Valor |
|---|---|
| Historia | US-020 Confirmar ruta (5 SP, prioridad Alta) |
| Épica | EP-04 Ejecución y seguimiento de entregas |
| Requisito | RF-019 Confirmar ruta |
| Subtarea | ST-021 Implementar confirmación de ruta |
| Actor documentado | Planificador logístico |

> Como **Planificador logístico**, quiero **confirmar una ruta previamente revisada**, para **habilitarla para su ejecución operativa**.

| Criterio | Implementación | Evidencia automatizada |
|---|---|---|
| Escenario 1: una ruta generada y revisada, al confirmarse, pasa al estado que corresponde para su ejecución | `PATCH /routes/:id/confirmation` cambia la ruta de `GENERADA` a `CONFIRMADA` y registra la fecha, el usuario y la versión confirmada. La sección «Confirmación» del detalle de la ruta muestra esos datos y habilita la asignación de conductor | `route-confirmation.spec.ts`, `routing.integration.ts`, `route-confirmation.test.tsx` |
| Escenario 2: si la ruta no cumple las condiciones, se impide la confirmación y se indica la condición pendiente | El backend devuelve 409 con todas las condiciones pendientes en un solo mensaje. La interfaz anticipa las que puede conocer y bloquea el botón | Mismas pruebas (cada condición por separado y combinadas) |

## 2. Decisiones del incremento

- **Actor Planificador.** No existe un rol «Planificador». Como en US-019, la acción la ejercen **Administrador** y **Operador / Técnico** a través del `PlanningGuard` que ya protege las rutas. Conductor y Auditor Externo reciben 403.
- **Estado nuevo `CONFIRMADA`.** El ciclo pasa a ser `GENERADA → CONFIRMADA → ASIGNADA → EN_CURSO → COMPLETADA`. Se eligió un estado, y no solo un campo, porque el criterio pide «cambiarla al estado correspondiente». La confirmación se registra con `confirmado_en`, `confirmado_por` y `version_confirmada`.
- **Condiciones para confirmar.** Se reutilizan las comprobaciones existentes:
  1. La ruta está `GENERADA` y sin conductor.
  2. La versión actual es confirmable y tiene la jornada calculada.
  3. No hay advertencias vigentes: pedidos cambiados desde el cálculo (`PEDIDO_DESACTUALIZADO`), fuentes cambiadas (`FUENTES_DESACTUALIZADAS`) ni recursos o pedidos no disponibles (`RECURSOS_O_PEDIDOS_NO_DISPONIBLES`).
  4. El vehículo está disponible y ni el vehículo ni los pedidos pertenecen a otra ruta activa.
- **La asignación exige confirmación.** `PATCH /routes/:id/assignment` y `GET /routes/:id/assignment-candidates` solo aceptan rutas `CONFIRMADA` cuya versión confirmada sea la vigente. Una ruta `GENERADA` responde «Confirma la ruta antes de asignarle un conductor.». Este cambio modifica el flujo de US-015.
- **Reserva de recursos.** Una ruta `CONFIRMADA` cuenta como activa: reserva su vehículo y sus pedidos frente a otras rutas aunque aún no tenga conductor.
- **Rutas anteriores.** Las rutas asignadas antes de US-020 se conservan sin datos de confirmación; la migración no las modifica.
- **Fuera de alcance.** No se implementa «desconfirmar». Las rutas no se recalculan por versión, así que no hizo falta bloquear un recálculo. US-019 y el panel del conductor no cambian, porque solo muestran rutas asignadas o posteriores.

## 3. Cambios

### Base de datos

Migración aditiva `202611170001_us020_confirmar_ruta`:

- Columnas `confirmado_en`, `confirmado_por` (con clave foránea a `usuarios`) y `version_confirmada` en `rutas`.
- `chk_rutas_estado_operativo` admite `CONFIRMADA`.
- `chk_rutas_asignacion_coherente`: una ruta `CONFIRMADA` no tiene conductor y sí tiene fecha de confirmación.
- `chk_rutas_confirmacion_completa`: los tres datos de confirmación se registran juntos o no se registran.
- `chk_rutas_confirmacion_antes_asignacion`: la asignación no puede ser anterior a la confirmación.

### Backend

- `PATCH /routes/:id/confirmation` con `ConfirmRouteDto` (`expected_estado: 'GENERADA'` y `confirmed: true`). Se ejecuta en una transacción `Serializable` con bloqueo `FOR UPDATE`, igual que la asignación, para evitar dobles confirmaciones.
- Si hay condiciones pendientes, se reúnen todas en un 409: «No se puede confirmar la ruta. Condiciones pendientes: …». Los errores de infraestructura no se convierten en condiciones.
- Se extrajeron a funciones compartidas las comprobaciones que antes estaban dentro de la consulta de la ruta (`stopWarnings`, `sourceWarnings`, `calculatedVersion`). La consulta y la confirmación usan la misma lógica.
- `GET /routes/:id` devuelve además `confirmado_en`, `version_confirmada` y el correo del usuario que confirmó.

### Frontend

- `RouteConfirmationPanel`: casilla de revisión explícita, botón «Confirmar ruta», bloqueo de doble envío y mensajes de error con `role="alert"`. En los conflictos 409 ofrece «Recargar ruta».
- La sección «Confirmación» del detalle muestra el estado legible, la fecha, el usuario y la versión confirmada. Las condiciones que se pueden anticipar se listan con `role="status"` y bloquean la confirmación.
- Etiquetas legibles para todos los estados (`route-states.ts`). La asignación envía `expected_estado: 'CONFIRMADA'` y explica que primero hay que confirmar.

## 4. Verificaciones ejecutadas

| Comando o verificación | Resultado |
|---|---|
| Backend `npm run typecheck` | Aprobado |
| Backend `npm run lint` | Aprobado |
| Backend `npm run test:coverage` | 567 pruebas aprobadas en 47 suites; statements 91.46 %, branches 81.83 %, functions 87.24 %, lines 94.65 % |
| Backend `npm run test:integration` (PostgreSQL aislado `distrirapido_test`) | 140 pruebas aprobadas en 9 suites. La nueva prueba de `routing.integration.ts` cubre las condiciones pendientes, la confirmación, la doble confirmación, la asignación habilitada y las restricciones `CHECK` |
| Backend `npm run build` | Aprobado |
| Frontend `npm run typecheck` | Aprobado |
| Frontend `npm run lint` | Aprobado |
| Frontend `vitest run --coverage --pool=forks --maxWorkers=1` | 414 pruebas aprobadas en 43 archivos; statements 88.65 %, branches 81.8 %, functions 86.17 %, lines 93.46 % |
| Frontend `npm run build` | Aprobado |
| `npm audit --audit-level=high` (backend y frontend) | **No aprobado, sin relación con US-020.** Hay un aviso alto de `picomatch` (ReDoS) que llega a través de las herramientas de prueba (`ts-jest` y `vitest`). Los `package-lock.json` son idénticos a los de `main`, así que el aviso es nuevo y no lo introduce esta rama. Se tratará aparte. |
| Prueba manual en navegador con datos locales | Escenario 2: una ruta cuyo vehículo y pedidos ya estaban en rutas asignadas recibió el 409 con la condición pendiente y la opción de recargar. Una ruta no confirmable mostró la condición y bloqueó el botón. Escenario 1: con un vehículo y un pedido libres, la ruta pasó a «Confirmada» con fecha, usuario y versión, y apareció el panel de asignación. |

**Nota del entorno local:** con Node 26 las pruebas del frontend se ejecutaron con `NODE_OPTIONS=--no-experimental-webstorage`. La CI usa Node 24.

## 5. Pendientes

- Revisión del equipo y aceptación de la historia en Jira.
- Resolver el aviso de `picomatch` en una rama propia antes de que bloquee la CI.
- Si el equipo crea un rol «Planificador» propio, basta con añadirlo a `PlanningGuard`.

[← Volver al README principal](../../../README.md)
