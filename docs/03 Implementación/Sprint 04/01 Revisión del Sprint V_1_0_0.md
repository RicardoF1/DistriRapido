# Revisión del sprint

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)

**Nombre del Proyecto:** DistriRapido — Sistema de planificación y seguimiento de entregas de última milla

**Líder del Proyecto:** Rupay Chira, Rosalyn Exkra

> Sprint 4 · Versión V_1_0_0 · Fecha de corte: 2026-11-18 (America/Lima). El estado técnico corresponde a la rama `feature/us-021-registrar-sostenibilidad` (`cc3ad8c`), que contiene la rama `sprint-4` completa.

## Historias de Usuario completadas en este Sprint

Las cuatro historias están implementadas y verificadas con pruebas automatizadas y manuales en el entorno local. Cada una tiene su informe técnico en esta misma carpeta.

| Código | Título | SP | Criterios de aceptación verificados | Cierre (PR / commit) |
|---|---|---|---|---|
| US-018 (RF-015, ST-019) | Registrar incidencias de entrega | 5 | **Escenario 1:** la incidencia se guarda asociada a la entrega y al conductor de la sesión (`POST /driver/deliveries/:id/incidents`). **Escenario 2:** sin tipo o descripción se rechaza con HTTP 400 y un mensaje por campo, que el formulario muestra junto al campo. | [PR #13](https://github.com/RicardoF1/DistriRapido/pull/13) · [`fdab8f5`](https://github.com/RicardoF1/DistriRapido/commit/fdab8f5) |
| US-019 (RF-016, ST-020) | Consultar estado operativo | 5 | **Escenario 1:** la página «Seguimiento operativo» presenta el resumen, las rutas en operación y el detalle de entregas e incidencias. **Escenario 2:** los filtros (estado de ruta y de entrega, fechas, placa o conductor, «solo con incidencias») muestran solo los registros que corresponden. **Ruta infeliz:** sin coincidencias se informa y los filtros se conservan. | [`853653c`](https://github.com/RicardoF1/DistriRapido/commit/853653c) en `sprint-4` |
| US-020 (RF-019, ST-021) | Confirmar ruta | 5 | **Escenario 1:** una ruta `GENERADA` y revisada pasa a `CONFIRMADA` con fecha, usuario y versión confirmada (`PATCH /routes/:id/confirmation`). **Escenario 2:** si no cumple las condiciones, el backend responde 409 con todas las condiciones pendientes y la interfaz bloquea el botón. | [PR #20](https://github.com/RicardoF1/DistriRapido/pull/20) · [`af5af0d`](https://github.com/RicardoF1/DistriRapido/commit/af5af0d) |
| US-021 (RF-017, ST-022) | Registrar información de sostenibilidad | 5 | **Escenario 1:** el registro (distancia, combustible, factor de emisión y origen) se guarda asociado a la ruta, su versión, su vehículo y el usuario; las emisiones de CO₂ las calcula el servidor. **Escenario 2:** con información incompleta responde 400 `INFORMACION_INSUFICIENTE` con la lista de campos requeridos y no guarda nada. | [`cc3ad8c`](https://github.com/RicardoF1/DistriRapido/commit/cc3ad8c) en `feature/us-021-registrar-sostenibilidad` |

**Total implementado:** 20 Story Points.

### Evidencia de calidad (último corte, US-021)

| Verificación | Resultado |
|---|---|
| Backend `npm run test:coverage` | 609 pruebas aprobadas en 48 suites; statements 91.65 %, branches 82.46 %, lines 94.82 % |
| Backend `npm run test:integration` (PostgreSQL aislado) | 141 pruebas aprobadas en 9 suites |
| Frontend `vitest --coverage` | 436 pruebas aprobadas en 45 archivos; statements 89.3 %, branches 82.95 %, lines 93.87 % |
| Migraciones | Tres migraciones aditivas: `202611090001_us018_incidencias_entrega`, `202611170001_us020_confirmar_ruta`, `202611170002_us021_registrar_sostenibilidad` |

Detalle por historia: [US-018](01%20US-018%20Registrar%20incidencias%20V_1_0_0.md) · [US-019](02%20US-019%20Consultar%20estado%20operativo%20V_1_0_0.md) · [US-020](03%20US-020%20Confirmar%20ruta%20V_1_0_0.md) · [US-021](04%20US-021%20Registrar%20sostenibilidad%20V_1_0_0.md).

## Demostración del trabajo completado

**Entorno:** local (frontend Vite en `localhost:5173`, backend NestJS en `localhost:3000`, PostgreSQL 16 y OSRM local), con datos de prueba.

**Validación manual realizada por el equipo durante el sprint** (registrada en cada informe técnico):

- **US-018:** envío vacío señalado campo por campo sin llamar al servidor; incidencia con información complementaria guardada, visible en la parada y persistente tras recargar, sin cambiar el estado de la entrega. Probado en escritorio y a 375 px.
- **US-020:** una ruta cuyo vehículo y pedidos ya estaban en rutas asignadas recibió el 409 con la condición pendiente y la opción «Recargar ruta»; una ruta no confirmable mostró la condición y bloqueó el botón.
- **US-019 y US-021:** flujo completo verificado con pruebas de integración contra PostgreSQL (14 pruebas nuevas en `operations.integration.ts` y casos nuevos en `routing.integration.ts`).

**Demostración a los stakeholders:** se presenta al docente en la Inspección 5 del 2026-11-20, de 18:20 a 18:40. Recorrido previsto: planificar una ruta → confirmarla (US-020) → asignarla al conductor → registrar una incidencia desde el panel del conductor (US-018) → consultarla en «Seguimiento operativo» con filtros (US-019) → registrar la información de sostenibilidad de la ruta (US-021). La retroalimentación recibida se registrará en la versión V_1_1_0 de este documento.

## Pendientes

| Elemento | Estado | Tratamiento |
|---|---|---|
| Integración en `main` | US-018, US-019 y US-020 están en `sprint-4`; US-021 sigue en su rama de funcionalidad; `main` todavía no contiene el incremento del Sprint 4 | Abrir el PR de US-021 hacia `sprint-4` y luego el PR de `sprint-4` hacia `main`, con los checks de CI en verde |
| Aceptación en Jira | Los cuatro informes técnicos la registran como pendiente | El Product Owner revisa los criterios y mueve las historias a Finalizada |
| US-022 Consultar indicadores (5 SP) y US-023 Consultar historial (5 SP) | Sin iniciar | Pasan al siguiente sprint. US-021 ya deja la tabla `registros_sostenibilidad` con los índices que necesitan |
| Roles «Supervisor» y «Planificador» | No existen en el sistema; por decisión del equipo los ejercen Administrador y Operador / Técnico | Si se crean, basta con añadirlos a `OPERATIONS_ROLES` y a `PlanningGuard` |
| Aviso de seguridad de `picomatch` | Detectado durante US-020 | Corregir en una rama propia antes de que bloquee la CI |
| HGR-43 / US-024 (deuda del Sprint 3) | Sigue en el backlog | Reprogramar y replanificar pedidos no entregados |
| Corrección de registros de sostenibilidad | Fuera de alcance de US-021 (un solo registro por ruta) | Requiere una historia propia con trazabilidad del cambio |

---

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 2026-11-18 | Versión inicial de la Revisión del Sprint 4. |

[← Volver al README principal](../../../README.md)
