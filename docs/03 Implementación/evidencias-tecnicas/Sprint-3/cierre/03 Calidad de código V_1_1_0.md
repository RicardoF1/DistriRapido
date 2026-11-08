# 03 Calidad de código V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7
- Actualización del análisis estático: 2026-11-06 20:03:59 -05:00, commit 37bd746c8227219aceb5652a9a510fa750f9c9dd
- Validación funcional con OSRM local: 2026-11-06, commit 600564f6c309e36b38904830652c5add1f70a799

## Resultados de pruebas

### Backend

42 suites aprobadas.
463 pruebas aprobadas.
Resultado obtenido durante la reconciliación final del Sprint 3.

### Frontend

37 archivos de pruebas aprobados.
306 pruebas aprobadas.
Cobertura: statements 87.04%, branches 80.09%, functions 83.89%, lines 92.15%.

## Métricas de cobertura frontend

| Métrica | Resultado |
|---|---:|
| Statements | 87.04% |
| Branches | 80.09% |
| Functions | 83.89% |
| Lines | 92.15% |

## Controles aplicados

- ESLint en backend y frontend.
- TypeScript build sin errores.
- Pruebas unitarias y de componentes.
- Cobertura mínima global de ramas de 80%.
- git diff --check antes de commits de reconciliación.
- Prisma validate y migrate status.
- GitHub Actions para push y pull_request.
- CodeQL y code scanning.

## Hallazgos técnicos

- Vite advierte un chunk JavaScript superior a 500 KB.
- Algunas pruebas React emiten advertencias por actualizaciones no envueltas en act(...).
- La instalación del backend reportó seis vulnerabilidades de severidad baja.
- No se aplicó npm audit fix --force para evitar cambios mayores no controlados.

## SonarQube

### Configuración del análisis

- Servidor: SonarQube 10.5.1 Community, ejecutado localmente.
- Proyecto: `distrirapido` (DistriRapido).
- Escáner: `sonarsource/sonar-scanner-cli` en Docker, con la revisión SCM igual al HEAD de main.
- Fuentes: `src/backend/src`, `src/frontend/src` y `src/frontend/coverage-assets.ts`.
- Pruebas: archivos `*.spec.ts`, `*.test.ts` y `*.test.tsx`.
- Exclusiones: `node_modules`, `dist`, reportes de cobertura, `src/backend/src/coverage/generated`, `geodata/coverage/v1` y `e2e`.
- Cobertura: LCOV de Jest y Vitest normalizado a rutas relativas a la raíz del repositorio. Los tres análisis registraron 0 rutas LCOV sin resolver.
- Quality Gate: `Sonar way`, con condiciones solo sobre código nuevo (`new_violations > 0`, `new_coverage < 80`, `new_duplicated_lines_density > 3`, `new_security_hotspots_reviewed < 100`). El periodo de código nuevo es `PREVIOUS_VERSION`.
- Los tokens de análisis y de lectura se usaron solo como variables de sesión y no se registran en esta evidencia.

### Historial de análisis

| Análisis | Commit | Fecha | Quality Gate | Observación |
|---|---|---|---|---|
| 1 | 9ea2146 | 2026-11-06 19:04:23 -05:00 | OK, sin condiciones evaluadas | Primer análisis del proyecto: al no existir una línea base, no había código nuevo y la API devolvió la lista de condiciones vacía. Este OK no equivale a una evaluación de calidad. |
| 2 | d2b632a | 2026-11-06 19:47:17 -05:00 | ERROR | Se evaluaron las condiciones: `new_violations` = 1, `new_coverage` = 97.6 % y `new_duplicated_lines_density` = 0.0 %. La violación fue S4624 (template literals anidados) en `planning-data.ts:39`. La línea de bloqueo ya existía, pero al cambiar su contenido y posición Sonar la registró como nueva. |
| 3 | 37bd746 | 2026-11-06 20:03:59 -05:00 | OK | Se evaluaron las condiciones: `new_violations` = 0, `new_coverage` = 100.0 % (20 líneas) y `new_duplicated_lines_density` = 0.0 %. |

### Métricas

| Métrica | Análisis 1 (9ea2146) | Análisis 3 (37bd746) |
|---|---:|---:|
| Coverage | 86.1% | 86.1% |
| Line coverage | 92.0% | 92.0% |
| Branch coverage | 80.4% | 80.5% |
| Bugs | 2 | 0 |
| Vulnerabilities | 0 | 0 |
| Code smells | 265 | 263 |
| Security hotspots | 5 | 3 (revisados después como SAFE) |
| Duplicated lines density | 0.0% | 0.0% |
| Technical debt | 1763 min | 1748 min (29 h 8 min) |
| NCLOC | 5838 | 5850 |
| Reliability rating | D | A |
| Security rating | A | A |
| Maintainability rating | A | A |
| Security review rating | No consultado | A (100% de hotspots revisados; era E antes de la revisión manual) |

### Pruebas y cobertura del commit analizado (37bd746)

| Módulo | Suites/archivos | Pruebas | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|---:|---:|
| Backend | 42/42 | 473/473 | 90.53% | 81.09% | 87.31% | 93.80% |
| Frontend | 37/37 | 310/310 | 87.07% | 80.09% | 83.92% | 92.16% |

La cobertura frontend se ejecutó con `--testTimeout=15000`. No se modificaron los umbrales de cobertura.

### Correcciones aplicadas

- `d2b632a` (`fix(quality): address reliability and security findings`):
  - S2871, bug Critical en `src/backend/src/planning/planning-data.ts`: el ordenamiento de identificadores de bloqueo usa el comparador explícito `compareLockIds`, determinista e independiente del locale.
  - S1082, bug Minor en `src/frontend/src/layouts/AppLayout.tsx`: se quitó el manejador de clic del `nav`. El menú se cierra desde cada `NavLink`, desde los enlaces de ancla y cuando cambia la ruta.
  - S5852 en `src/backend/src/orders/order.dto.ts` (dos hotspots): la expresión de zona horaria es ahora de tiempo lineal. Se agregaron pruebas para Z, milisegundos, desplazamientos positivo y negativo, valor sin zona horaria y una cadena de 100 000 caracteres T.
  - En `LoginForm.tsx` y `UserForm.tsx` la longitud máxima de 255 caracteres se valida antes de aplicar la expresión del correo.
- `37bd746` (`refactor(planning): simplify route lock query construction`):
  - S4624: la lista de identificadores se construye en la variable `lockIds` fuera de la plantilla SQL. Una prueba verifica que la consulta, el orden de bloqueo y la omisión de grupos vacíos no cambiaron.

Resultado: los dos bugs quedaron corregidos y Reliability rating mejoró de D a A.

### Hallazgos abiertos

- Bugs: 0. Vulnerabilities: 0.
- Code smells: 263 issues sin resolver (Blocker 8, Critical 21, Major 195, Minor 39).
- Los 8 Blocker corresponden a S2699 ("Add at least one assertion to this test case") en pruebas que verifican el código HTTP con `.expect(código)` de Supertest, una aserción que Sonar no reconoce:
  - `src/backend/src/drivers/driver-accounts.spec.ts`: líneas 56, 65, 91 y 109.
  - `src/backend/src/drivers/driver-profile.spec.ts`: líneas 52 y 61.
  - `src/backend/src/drivers/drivers.spec.ts`: línea 36.
  - `src/backend/src/orders/order-consultation.spec.ts`: línea 88.
  - No se agregaron aserciones de relleno ni comentarios NOSONAR. Los ocho issues siguen abiertos, pendientes de revisión manual en SonarQube.
- Los 21 Critical son code smells de mantenibilidad: complejidad cognitiva (S3776, 14), uso de `void` (S3735, 4) y funciones anidadas en exceso (S2004, 3).
- Sigue abierto un S4624 anterior en `src/frontend/src/features/orders/OrderForm.tsx:84`, fuera del alcance de estas correcciones.
- Los tres Security Hotspots que quedaron tras el análisis 3 se revisaron manualmente en SonarQube el 2026-11-06 20:45 -05:00. Cada uno recibió un comentario técnico y quedó en estado REVIEWED / SAFE. Los hotspots no se eliminaron del código: se revisaron y se clasificaron como seguros (detalle en 04 OWASP V_1_0_0). Con el 100% de los hotspots revisados, Security review rating pasó de E a A sin un nuevo análisis.

## Conclusión

El incremento cumple lint, build, pruebas y cobertura mínima. El tercer análisis de SonarQube sobre `37bd746` evaluó las condiciones de código nuevo y terminó con el Quality Gate en OK, 0 bugs, 0 vulnerabilidades y Reliability, Security y Maintainability en A. Los 3 Security Hotspots se revisaron manualmente y quedaron REVIEWED / SAFE, por lo que Security review rating es A (100% revisados). Quedan pendientes 263 code smells, incluidos 8 S2699 de pruebas con Supertest por clasificar.
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

Sobre `main` en `600564f6c309e36b38904830652c5add1f70a799`, con backend y frontend reconstruidos desde ese commit, OSRM v26.10.0 (`ghcr.io/project-osrm/osrm-backend:v26.10.0-debian@sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f`, perfil `driving`, MLD) respondió a través de Compose y desde el backend por `http://osrm:5000`. PostgreSQL conservó su volumen y reconoce las 9 migraciones. La ruta de referencia `d9ebaee0-85df-4504-99d6-764839838c6a`, con revisión `geofabrik-peru-261105-sha256:70cce1d0a42c-car-mld-osrm-v26.10.0` y método `SECUENCIAL_OSRM`, midió 3 888.7 m (3.89 km), 356.2 s de viaje (5.9 min) y 7 800 s con atención y esperas (130 min), con `LineString` de 86 coordenadas, 2 paradas ordenadas, ajustes de 0.1 m, 49.9 m y 23.1 m (límite 100 m), `warnings=[]` y ejecución COMPLETADA.

En la base existen tres rutas porque se realizaron tres ejecuciones manuales en la interfaz. Además de la ruta de referencia, las versiones `c89138c6` y `b04c7f85` se generaron con la opción de alternativas, la estrategia de orden confirmado y otro origen; cada una mide 4.30 km y 6.5 min, con la misma procedencia y revisión. Son cálculos reales de OSRM, no resultados sintéticos: OSRM registró exactamente tres consultas del backend, todas con HTTP 200.

Las tres rutas están en estado GENERADA y **0 rutas tienen conductor asignado**, porque la interfaz indica: "La asignación no está habilitada en este incremento." El backend dispone del endpoint `PATCH /routes/:id/assignment` con control de versión, pero la interfaz web no ofrece todavía la acción de asignar. La ausencia de asignación responde al alcance del incremento y no es un fallo de OSRM. El cálculo es secuencial sobre el orden confirmado (`optimized=false`), no una ruta óptima global, y no considera tráfico en tiempo real. OSRM no devuelve `data_version`; la trazabilidad se apoya en la revisión del grafo.

Esta validación funcional no modificó código, por lo que los resultados de SonarQube registrados arriba siguen vigentes. Detalle en 06 Evidencia técnica de cierre del Sprint 3 V_1_0_0 y en `infra/osrm/README.md`.
