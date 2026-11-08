# 06 Evidencia técnica de cierre del Sprint 3 V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7
- Actualización del análisis estático: 2026-11-06 20:03:59 -05:00, commit 37bd746c8227219aceb5652a9a510fa750f9c9dd
- Validación funcional con OSRM local: 2026-11-06, commit 600564f6c309e36b38904830652c5add1f70a799

## Historial Git

    debc2e7 (HEAD -> main, origin/main, origin/HEAD) Merge pull request #12 from RicardoF1/feature/sprint-3-avances
    7325620 (origin/feature/sprint-3-avances, feature/sprint-3-avances) merge(main): reconcile Sprint 3 integration
    12614ce Merge pull request #10 from RicardoF1/feature/sprint-3-completion
    4a63a57 (origin/feature/sprint-3-completion, feature/sprint-3-completion) test(frontend): cover route geometry branches
    a88c453 test(frontend): stabilize map coverage validation
    b54f92b fix(sprint3): reconcile HGR-33 with route operations
    1f10eb6 Feature/sprint 3 avances delivery alternatives (#11)
    0403ab8 Feature/sprint 3 avances delivery alternatives (#11)

## Servicios Docker (estado del 2026-10-30)

    NAME                               IMAGE                            COMMAND                  SERVICE    CREATED          STATUS                 PORTS
    distrirapido_analisis-backend-1    distrirapido_analisis-backend    "docker-entrypoint.s…"   backend    13 minutes ago   Up 13 minutes          127.0.0.1:3000->3000/tcp
    distrirapido_analisis-frontend-1   distrirapido_analisis-frontend   "/docker-entrypoint.…"   frontend   10 minutes ago   Up 10 minutes          127.0.0.1:5173->80/tcp
    distrirapido_analisis-postgres-1   postgres:16-alpine               "docker-entrypoint.s…"   postgres   4 hours ago      Up 4 hours (healthy)   127.0.0.1:5432->5432/tcp

## Estado de migraciones (2026-10-30)

    Prisma schema loaded from prisma/schema.prisma
    Datasource "db": PostgreSQL database "distrirapido", schema "public" at "postgres:5432"

    9 migrations found in prisma/migrations

    Database schema is up to date!

## Logs recientes del backend (2026-10-30)

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

## Logs recientes del frontend (2026-10-30)

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
- OSRM local aprovisionado y cálculo vial validado desde la interfaz el 2026-11-06 (ver Validación funcional local).

## Análisis estático final

| Análisis | Commit | Quality Gate | Resultado |
|---|---|---|---|
| 1 | 9ea2146 | OK, sin condiciones evaluadas | Primer análisis: sin línea base de código nuevo, por lo que no se evaluaron condiciones. |
| 2 | d2b632a | ERROR | `new_violations` = 1 (S4624 en `planning-data.ts`). |
| 3 | 37bd746 | OK | `new_violations` = 0, `new_coverage` = 100.0%, `new_duplicated_lines_density` = 0.0%. |

Resultado del análisis 3 (commit `37bd746c8227219aceb5652a9a510fa750f9c9dd`):

- Coverage 86.1%, line coverage 92.0%, branch coverage 80.5%.
- Bugs 0, vulnerabilities 0, code smells 263, Security Hotspots 3 (revisados manualmente y clasificados REVIEWED / SAFE).
- Duplicación 0.0%, deuda técnica 1748 min (29 h 8 min), NCLOC 5850.
- Reliability A (antes D), Security A, Maintainability A. Security review rating A: 100% de hotspots revisados (era E antes de la revisión manual del 2026-11-06 20:45 -05:00).
- Backend: 42 suites y 473 pruebas aprobadas. Frontend: 37 archivos y 310 pruebas aprobadas.
- Rutas LCOV sin resolver: 0.

Últimos cinco commits de main en el momento del análisis 3 (git log -5 --oneline):

    37bd746 refactor(planning): simplify route lock query construction
    d2b632a fix(quality): address reliability and security findings
    19d6c45 docs: retirar carpeta Post-Sprint-1
    77d7e10 docs: corregir caracteres y codificacion en cierre sprint 3
    9ea2146 test(frontend): stabilize delivery map marker assertion

Pendientes: clasificación de los 8 issues S2699 de pruebas con Supertest y atención de los code smells restantes. Los tres Security Hotspots ya se revisaron en SonarQube, con comentario técnico y estado SAFE. El detalle está en 03 Calidad de código V_1_0_0 y 04 OWASP V_1_0_0.

## Restricciones

- El paquete de geocobertura no debe publicarse en Git.
- La cuenta y contraseña locales no se registran en esta evidencia.
- El PBF, el recorte y el grafo OSRM son privados: se aprovisionan por separado en `.local/osrm-data` y no se publican en Git.
<!-- SPRINT3-OSRM-STATUS -->
## Validación funcional local

Estado anterior (2026-10-30): se verificó localmente el flujo de administración hasta la preparación de una planificación con dos pedidos:

- inicio de sesión administrativo;
- registro de vehículo disponible;
- registro de conductor activo;
- vinculación de cuenta de acceso del conductor;
- registro de disponibilidad;
- registro de dos pedidos con ubicación confirmada;
- selección de vehículo, conductor, origen, orden y tiempos de atención;
- preparación correcta de la planificación.

En aquel momento, el intento de generar alternativas mostró **“La ejecución no produjo un recorrido disponible”**: la ejecución quedó FALLIDA con `HTTP_503` porque OSRM aún no estaba aprovisionado, y la consulta de rutas mostraba cero recorridos registrados. Ese bloqueo quedó resuelto con la validación del 2026-11-06; la ejecución fallida se conserva como historial.

### Validación con OSRM local (2026-11-06)

Entorno validado:

- Commit `600564f6c309e36b38904830652c5add1f70a799` en `main`, sin cambios locales.
- Imágenes de backend (`sha256:62201174aae41d4b107aa9aac1aca68e66e83d3ecb208bab8b1ad07937aefd41`) y frontend (`sha256:93f87b9a1f1a752b0c0a78901546a993216675d5883e5f7f2d85e8eabfeaf62f`) reconstruidas desde ese commit antes de la validación.
- OSRM v26.10.0 con la imagen `ghcr.io/project-osrm/osrm-backend:v26.10.0-debian@sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f`, perfil `driving` generado con `/opt/car.lua` y algoritmo MLD.
- Grafo preparado a partir de `huancayo.osm.pbf`, recorte del extracto Geofabrik `peru-261105.osm.pbf` con el bounding box `-75.40,-12.25,-74.80,-11.75`. SHA-256 del recorte: `70cce1d0a42c52de0a5aa1b18a72fb3c184143b50ef1cf83cf426113c1beedb1`. Resultado: 26 archivos `huancayo.osrm.*`, 36 253 316 bytes; SHA-256 del manifiesto: `f5f2e73d94051181fce2e8ddb0ff204e06e1d2909721e2c64d1c11a0143369ce`.
- Revisión del grafo: `geofabrik-peru-261105-sha256:70cce1d0a42c-car-mld-osrm-v26.10.0`.
- Servicios levantados con `docker-compose.yml` y `docker-compose.osrm.yml`: PostgreSQL healthy en 127.0.0.1:5432, OSRM en 127.0.0.1:5000, backend en 127.0.0.1:3000 y frontend en 127.0.0.1:5173.
- OSRM respondió consultas reales a través de Compose (HTTP 200, `code=Ok`) y desde el contenedor backend por `http://osrm:5000`.
- PostgreSQL se arrancó sin recrearlo, conserva el volumen `distrirapido_analisis_postgres-data` y reconoce las 9 migraciones; `prisma migrate status` responde "Database schema is up to date!". No se ejecutaron seeds ni bootstrap.
- Observación del build: npm avisó de scripts de instalación no cubiertos por `allowScripts`, entre ellos los de `argon2` y Prisma. Ambos se comprobaron en un contenedor desechable antes de recrear los servicios.

Ruta de referencia, versión `d9ebaee0-85df-4504-99d6-764839838c6a`:

| Criterio | Resultado |
|---|---|
| Procedencia | `provider=OSRM`, `profile=driving`, revisión `geofabrik-peru-261105-sha256:70cce1d0a42c-car-mld-osrm-v26.10.0` |
| Método | `SECUENCIAL_OSRM`, `optimized=false` |
| Distancia | 3 888.7 m, mostrada como 3.89 km |
| Viaje estimado | 356.2 s, mostrado como 5.9 min |
| Duración con atención y esperas | 7 800 s, mostrada como 130 min |
| Geometría | `LineString` con 86 coordenadas, visible en el mapa |
| Paradas | 2, en el orden confirmado; finalización en el último pedido |
| Ajuste de puntos | origen 0.1 m, pedido `390deb77` 49.9 m, pedido `ed2a4fb3` 23.1 m; límite 100 m |
| Avisos | `warnings=[]`, `confirmable=true` |
| Ejecución | COMPLETADA, sin código de error |
| Estado | ruta GENERADA; paradas y pedidos en PENDIENTE |

En la base existen tres rutas porque se realizaron tres ejecuciones manuales en la interfaz. Además de la ruta de referencia, las versiones `c89138c6` y `b04c7f85` se generaron con la opción de alternativas, la estrategia de orden confirmado y otro origen; cada una mide 4.30 km y 6.5 min, con la misma procedencia y revisión. Son cálculos reales de OSRM, no resultados sintéticos: OSRM registró exactamente tres consultas del backend, todas con HTTP 200.

Las tres rutas están en estado GENERADA y **0 rutas tienen conductor asignado**, porque la interfaz indica: "La asignación no está habilitada en este incremento." El backend dispone del endpoint `PATCH /routes/:id/assignment` con control de versión, pero la interfaz web no ofrece todavía la acción de asignar. La ausencia de asignación responde al alcance del incremento y no es un fallo de OSRM. El cálculo es secuencial sobre el orden confirmado (`optimized=false`), no una ruta óptima global, y no considera tráfico en tiempo real. OSRM no devuelve `data_version`; la trazabilidad se apoya en la revisión del grafo.

El procedimiento completo, la procedencia de los datos y los comandos están en `infra/osrm/README.md`. El PBF, el recorte, el grafo y su manifiesto permanecen en `.local/osrm-data`, fuera de Git.
