# 06 Evidencia técnica de cierre del Sprint 3 V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7

## Historial Git

    debc2e7 (HEAD -> main, origin/main, origin/HEAD) Merge pull request #12 from RicardoF1/feature/sprint-3-avances
    7325620 (origin/feature/sprint-3-avances, feature/sprint-3-avances) merge(main): reconcile Sprint 3 integration
    12614ce Merge pull request #10 from RicardoF1/feature/sprint-3-completion
    4a63a57 (origin/feature/sprint-3-completion, feature/sprint-3-completion) test(frontend): cover route geometry branches
    a88c453 test(frontend): stabilize map coverage validation
    b54f92b fix(sprint3): reconcile HGR-33 with route operations
    1f10eb6 Feature/sprint 3 avances delivery alternatives (#11)
    0403ab8 Feature/sprint 3 avances delivery alternatives (#11)

## Servicios Docker

    NAME                               IMAGE                            COMMAND                  SERVICE    CREATED          STATUS                 PORTS
    distrirapido_analisis-backend-1    distrirapido_analisis-backend    "docker-entrypoint.s…"   backend    13 minutes ago   Up 13 minutes          127.0.0.1:3000->3000/tcp
    distrirapido_analisis-frontend-1   distrirapido_analisis-frontend   "/docker-entrypoint.…"   frontend   10 minutes ago   Up 10 minutes          127.0.0.1:5173->80/tcp
    distrirapido_analisis-postgres-1   postgres:16-alpine               "docker-entrypoint.s…"   postgres   4 hours ago      Up 4 hours (healthy)   127.0.0.1:5432->5432/tcp

## Estado de migraciones

    Prisma schema loaded from prisma/schema.prisma
    Datasource "db": PostgreSQL database "distrirapido", schema "public" at "postgres:5432"

    9 migrations found in prisma/migrations

    Database schema is up to date!

## Logs recientes del backend

    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RoutesResolver] DriverOwnCredentialsController {/driver}: +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/driver/account/password, POST} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RoutesResolver] DriverAccountsController {/drivers}: +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/drivers/account-options, GET} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/drivers/:id/account, PUT} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/drivers/:id/account, POST} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RoutesResolver] DriversController {/drivers}: +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/drivers, GET} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/drivers/:id, GET} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/drivers, POST} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/drivers/:id, PATCH} route +13ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RoutesResolver] DriverProfileController {/driver}: +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/driver/deliveries/:id/status, PATCH} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/driver/routes, GET} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/driver/routes/:id, GET} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/driver/me, GET} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RoutesResolver] AvailabilityController {/availability}: +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/availability, GET} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/availability/:id, GET} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/availability, POST} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/availability/:id, PATCH} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RoutesResolver] VehiclesController {/vehicles}: +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/vehicles, GET} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/vehicles/:id, GET} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/vehicles, POST} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/vehicles/:id, PATCH} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RoutesResolver] PlanningController {/planning}: +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/planning/candidates, GET} route +2ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/planning, POST} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/planning/:id, GET} route +2ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/planning/:id, PATCH} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/planning/:id/calculations, POST} route +2ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/planning/:id/alternatives, POST} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/planning/:id/calculations/:executionId, GET} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RoutesResolver] RoutesController {/routes}: +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/routes, GET} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/routes/:id/assignment, PATCH} route +2ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/routes/:id, GET} route +1ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [RouterExplorer] Mapped {/routes/:id/versions/:version, GET} route +0ms
    backend-1  | [Nest] 1  - 10/30/2026, 8:42:24 PM     LOG [NestApplication] Nest application successfully started +149ms

## Logs recientes del frontend

    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0)
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: OS: Linux 6.6.87.2-microsoft-standard-WSL2
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1048576:1048576
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker processes
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 29
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 30
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 31
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 32
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 33
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 34
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 35
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 36
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 37
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 38
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 39
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 40
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 41
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 42
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 43
    frontend-1  | 2026/10/30 20:45:41 [notice] 1#1: start worker process 44
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:46:06 +0000] "GET / HTTP/1.1" 200 608 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:46:06 +0000] "GET /assets/index-DCeNsUZ0.css HTTP/1.1" 200 47832 "http://localhost:5173/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:46:06 +0000] "GET /assets/index-y_1CLlAi.js HTTP/1.1" 200 544976 "http://localhost:5173/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:46:06 +0000] "GET /assets/outfit-latin-700-normal-Cu9v6i1X.woff2 HTTP/1.1" 200 14060 "http://localhost:5173/assets/index-DCeNsUZ0.css" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:46:06 +0000] "GET /assets/inter-latin-400-normal-C38fXH4l.woff2 HTTP/1.1" 200 23664 "http://localhost:5173/assets/index-DCeNsUZ0.css" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:46:06 +0000] "GET /assets/login-landscape-DhUmexbi.png HTTP/1.1" 200 1956444 "http://localhost:5173/assets/index-DCeNsUZ0.css" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:46:07 +0000] "GET /assets/inter-latin-600-normal-LgqL8muc.woff2 HTTP/1.1" 200 24452 "http://localhost:5173/assets/index-DCeNsUZ0.css" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:46:07 +0000] "GET /assets/outfit-latin-600-normal-B7SfZ07L.woff2 HTTP/1.1" 200 14140 "http://localhost:5173/assets/index-DCeNsUZ0.css" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:46:07 +0000] "GET /login HTTP/1.1" 200 608 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"
    frontend-1  | 172.23.0.1 - - [30/Oct/2026:20:51:35 +0000] "GET /geodata/coverage/v1/coverage.geojson HTTP/1.1" 200 266201 "http://localhost:5173/pedidos/nuevo" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0" "-"

## Evidencias verificadas

- Proyecto fusionado a main mediante PR #12.
- PostgreSQL saludable.
- Backend publicado localmente en el puerto 3000.
- Frontend publicado localmente en el puerto 5173.
- Paquete privado de geocobertura v1.0.0 validado mediante el aprovisionador oficial.
- Cuenta administrativa local creada mediante db:bootstrap.
- Esquema de base de datos actualizado.

## Restricciones

- El paquete de geocobertura no debe publicarse en Git.
- La cuenta y contraseña locales no se registran en esta evidencia.
- OSRM real requiere aprovisionamiento independiente.
<!-- SPRINT3-OSRM-STATUS -->
## Validación funcional local

Se verificó localmente el flujo de administración hasta la preparación de una planificación con dos pedidos:

- inicio de sesión administrativo;
- registro de vehículo disponible;
- registro de conductor activo;
- vinculación de cuenta de acceso del conductor;
- registro de disponibilidad;
- registro de dos pedidos con ubicación confirmada;
- selección de vehículo, conductor, origen, orden y tiempos de atención;
- preparación correcta de la planificación.

El intento de generar alternativas mostró el resultado **“La ejecución no produjo un recorrido disponible”**. La planificación funciona, pero el cálculo vial y el registro del recorrido permanecen bloqueados hasta aprovisionar y configurar OSRM con su grafo de red. Por esta razón, la consulta de rutas muestra cero recorridos registrados.
