# 03 Calidad de código V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7
- Actualización del análisis estático: 2026-11-06 20:03:59 -05:00, commit 37bd746c8227219aceb5652a9a510fa750f9c9dd

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
