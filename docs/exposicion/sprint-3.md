# Sprint 3: alcance y HGR-32

## Cronología Git local

| Commit | Aporte comprobable |
|---|---|
| `90df55e` | Conservación de correo de login sin persistir contraseña |
| `0a59c1f` | Cuentas de conductores, credenciales y portal propio |
| `7a93c07` | Planificación versionada, adaptador OSRM y consulta US-013 |
| `1aa75c8` | Informes originales y requisitos de entrega |
| `1e4ce56` | Correcciones compatibles de auditoría de dependencias |

GitHub, consultado el 30/10/2026 mediante conector: [PR #8](https://github.com/RicardoF1/DistriRapido/pull/8) cerrada, sin fusionar y marcada como borrador; head `1e4ce56b879871ee3289ddc4e5dc5ac709184d36`, igual al HEAD local. Esto comprueba esa PR, no descarta cambios del compañero en otras ramas. El intento `git ls-remote` falló por conexión; no se actualizaron refs ni se hizo merge.

## HGR-32 / US-013: parcialmente implementada

| Capacidad | Evidencia de código | Estado |
|---|---|---|
| Candidatos de pedidos y recursos | `planning.controller.ts`, `planning.service.ts` | Implementada; ejecución operativa actual no verificada |
| Origen, orden y retorno explícitos | DTO y cliente `planning-api.ts` | Implementada; no toma ubicación implícita de un conductor |
| Cálculo secuencial | Adaptador OSRM en backend | Implementado; no es optimización genética |
| Distancia, duración y paradas | Tipos de rutas y servicio | Implementado; métricas reales pendientes de proveedor real |
| Mapa y versiones | Pantallas de rutas y `routes.service.ts` | Implementado; pruebas históricas simuladas |
| Persistencia | Migración `202610290001_planificacion_rutas` | Pruebas históricas PostgreSQL aislado; migración public pendiente en último preflight |
| Acceso | JwtAuthGuard y PlanningGuard | Administrador y Operador / Técnico; Conductor/Auditor denegados |

Controladores: [planificación](../../src/backend/src/planning/planning.controller.ts) y [rutas](../../src/backend/src/routes/routes.controller.ts).

Endpoints comprobados: GET `/planning/candidates`, POST `/planning`, GET/PATCH `/planning/:id`, POST `/planning/:id/calculations`, GET `/planning/:id/calculations/:executionId`, GET `/routes`, GET `/routes/:id`, GET `/routes/:id/versions/:version`. Las consultas no generan recorridos. El cálculo usa Idempotency-Key y versión esperada.

El cliente distingue validación 400, permisos 403, ausencia 404, conflicto 409, red no conectable 422, cupo 429, proveedor inválido 502, infraestructura pendiente 503 y plazo agotado 504. Ver `src/frontend/src/services/api.ts`. Un error no debe mostrarse como lista vacía ni dibujar una geometría aproximada.

## Historias posteriores

| Historia solicitada | Estado de esta entrega |
|---|---|
| HGR-33 comparar alternativas | Pendiente; no se acredita funcionalidad completa ni aceptación |
| HGR-34 asignar rutas | Pendiente; seleccionar candidatos no constituye asignación |
| HGR-35 consultar ruta asignada | Pendiente; portal de conductor preparatorio no demuestra ruta asignada |
| HGR-36 actualizar entrega | Pendiente; no confundir con cambios administrativos de estados de pedidos |

No se implementó ninguna de estas historias en esta tarea. Para aceptar HGR-32 falta comprobar los últimos commits del compañero, migración autorizada, OSRM privado y grafo real, recursos válidos, recorrido desde navegador, métricas/historial y pruebas correspondientes. Procedimiento de infraestructura: [guía OSRM](../../infra/osrm/README.md).
