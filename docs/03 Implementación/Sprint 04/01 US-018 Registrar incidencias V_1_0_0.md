# US-018: Registrar incidencias de entrega

Versión documental: V_1_0_0. Fecha: 2026-11-09, America/Lima. Rama: `feature/us-018-registrar-incidencias`, basada en `main` (`f3b2633`). Estado: implementado y verificado en el entorno local de desarrollo; pendiente de revisión y aceptación del equipo.

## 1. Historia y trazabilidad

| Elemento | Valor |
|---|---|
| Historia | US-018 Registrar incidencias de entrega (5 SP, prioridad Alta) |
| Épica | EP-04 Ejecución y seguimiento de entregas |
| Requisito | RF-015 Registrar incidencias de entrega |
| Subtarea | ST-019 Implementar registro de incidencias |
| Rol | Usuario Final / Conductor |

> Como **Conductor**, quiero **registrar una incidencia asociada a una entrega**, para **informar situaciones que afecten su ejecución**.

| Criterio | Implementación | Evidencia automatizada |
|---|---|---|
| Escenario 1 / Ruta Gold: con información válida, la incidencia se almacena y se asocia a la entrega | `POST /driver/deliveries/:id/incidents` guarda `parada_id` y `conductor_id` de la sesión; el detalle de la ruta del conductor devuelve las incidencias de cada parada | `driver-incidents.spec.ts`, `driver-incidents.integration.ts`, `DeliveryIncidents.test.tsx`, `DriverAccessPage.test.tsx` |
| Ruta Feliz: información complementaria permitida | Campo opcional `detalle_complementario` (hasta 500 caracteres) | Mismas pruebas |
| Escenario 2 / Ruta Infeliz: sin información obligatoria se rechaza y se indican los datos faltantes | El frontend marca cada campo faltante antes de enviar; el backend responde HTTP 400 con un mensaje por campo (`tipo: …`, `descripcion: …`), que el formulario muestra junto al campo | `driver-incidents.spec.ts`, `driver-incidents.integration.ts`, `DeliveryIncidents.test.tsx`, `driver-profile-api.test.ts` |

## 2. Decisiones del incremento

- **Datos obligatorios:** `tipo` y `descripcion`. **Opcional:** `detalle_complementario`.
- **Catálogo cerrado de tipos**, acordado con el equipo para este incremento porque la documentación no lo definía: `CLIENTE_AUSENTE`, `DIRECCION_INCORRECTA`, `ACCESO_RESTRINGIDO`, `VIA_BLOQUEADA`, `VEHICULO_AVERIADO`, `CARGA_DANADA`, `OTRO`. Se valida en el DTO y con una restricción `CHECK` en PostgreSQL.
- **Independiente del estado de la entrega:** registrar una incidencia no modifica `estado_entrega`, `version_entrega` ni el pedido. El resultado de la entrega sigue siendo responsabilidad de US-017.
- **Varias incidencias por entrega**, ordenadas por fecha de registro.
- **Mismas reglas de propiedad que US-017:** rol Conductor, ficha y cuenta activas, entrega de una ruta propia y de su versión vigente, y ruta en `ASIGNADA` o `EN_CURSO`. Una entrega ajena o inexistente responde 403 sin revelar su existencia; una ruta completada o una versión anterior responden 409.
- **Fuera de alcance:** consulta de incidencias por el Supervisor (US-019, RF-016), reoptimización por incidencias (modelo C4), edición y eliminación de incidencias.

## 3. Cambios

### Base de datos

Migración aditiva `202611090001_us018_incidencias_entrega`: tabla `incidencias_entrega` con claves foráneas `ON DELETE RESTRICT` a `paradas_ruta` y `conductores`, restricciones de tipo y de longitud de textos, e índices por parada y fecha y por conductor. No modifica ni elimina datos existentes. Modelo Prisma `IncidenciaEntrega`.

### Backend

- `CreateDeliveryIncidentDto`: recorta los textos y trata como ausente la información complementaria vacía; los mensajes indican el campo afectado.
- `DriverProfileService.createIncident`: valida la propiedad y el estado dentro de una transacción e inserta la incidencia.
- `DriverProfileService.route`: incluye `incidencias` en cada parada del detalle de la ruta del conductor.
- `DriverProfileController`: `POST /driver/deliveries/:id/incidents` (201), documentado en Swagger.

### Frontend

- `DeliveryIncidents`: lista de incidencias registradas y formulario plegable «Registrar incidencia» en cada parada del panel del conductor, visible solo si la ruta está `ASIGNADA` o `EN_CURSO`.
- Accesibilidad: etiquetas asociadas, campos obligatorios marcados, `aria-invalid` y `aria-describedby` con el mensaje de cada campo, foco en el primer campo con error, foco devuelto al botón al guardar o cancelar y confirmación en la región `status` existente.
- `driverProfileApi.createIncident` y tipos `DeliveryIncident` e `IncidentType`. `api.ts` conserva los mensajes por campo de la respuesta 400 de incidencias.

## 4. Verificaciones ejecutadas

| Comando o verificación | Resultado |
|---|---|
| Backend `npm run typecheck` | Aprobado |
| Backend `npm run lint` | Aprobado |
| Backend `npm run test:coverage` | 513 pruebas aprobadas en 44 suites; statements 90.82 %, branches 81.58 %, functions 87.43 %, lines 94.08 % |
| Backend `npm run test:integration` (PostgreSQL aislado `distrirapido_test`) | 125 pruebas aprobadas en 8 suites, incluida la nueva `driver-incidents.integration.ts` (5 pruebas) |
| Backend `npm run build` | Aprobado |
| Frontend `npm run typecheck` | Aprobado |
| Frontend `npm run lint` | Aprobado |
| Frontend `npm run test:coverage -- --pool=forks --maxWorkers=1` | 373 pruebas aprobadas en 39 archivos; statements 88.29 %, branches 81.35 %, functions 85.48 %, lines 93.19 % |
| Frontend `npm run build` | Aprobado; se mantiene la advertencia previa de tamaño de bundle |
| Prueba manual en navegador (escritorio y 375 px) | Envío vacío: se señalan tipo y descripción y no se llama al servidor. Registro con información complementaria: se guarda, aparece en la parada, persiste tras recargar y la entrega sigue `PENDIENTE`. Sin desbordamiento horizontal en móvil. |

**Nota del entorno local:** con Node 26 las pruebas del frontend que usan `sessionStorage` y `localStorage` (LoginForm, usuarios, pedidos) fallan porque el almacenamiento web nativo de Node sustituye al de jsdom. Con `NODE_OPTIONS=--no-experimental-webstorage` pasan todas. La CI usa Node 24 y no se ve afectada. Este problema es ajeno a US-018.

## 5. Pendientes

- Revisión del equipo y aceptación de la historia en Jira.
- Consulta de incidencias por el Supervisor en US-019.

[← Volver al README principal](../../../README.md)
