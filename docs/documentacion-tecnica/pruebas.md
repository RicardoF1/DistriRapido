# Pruebas: evidencia histórica y límites

Auditoría documental del 30/10/2026 sobre `feature/sprint-3-avances`, `1e4ce56`. No se repitieron suites del producto en esta tarea. No se atribuyen resultados previos a una ejecución actual. La fecha exacta, salida cruda y SHA de cada corrida no constan en todos los informes; cuando faltan, quedan no acreditados por corrida.

| Conjunto y objetivo | Herramienta / comando desde su proyecto | Resultado histórico | Fuente y alcance |
|---|---|---|---|
| Backend: lógica y HTTP simulado | Jest, `npm run test:coverage` | 443 aprobadas, 39 suites; sin fallos reportados | Informes 06, 08 y 09 Sprint 3; salida cruda no localizada como log independiente |
| Frontend: componentes/servicios | Vitest, `npm run test:coverage -- --pool=forks --maxWorkers=1` | 294 aprobadas, 33 archivos; sin fallos reportados | Informes 06, 08 y 09; no ejecución actual |
| Persistencia y transacciones | Jest/Prisma/PostgreSQL, `npm run test:integration` | 120 aprobadas, 7 suites | Informes 06 y 09; esquema aislado y proveedor sintético, no OSRM real |
| Navegador y responsive | Playwright, `npm run test:e2e -- --config playwright.mock.config.ts` | 94 aprobadas reportadas | Informes 08/09; Edge, preview y API simulada, cuatro anchuras |
| Cifras solicitadas 187 aprobadas / 11 fallidas | Playwright | No corroboradas en informes revisados | No sumarlas a 94 ni presentarlas como resultado actual; falta reporte identificable de esa ejecución |

Los informes 06 y 09 corresponden a fases locales anteriores a su publicación: el commit 1e4ce56 contiene el informe 09, pero no demuestra por sí solo el SHA ejecutado en cada corrida. PR #8 conserva estas cifras como antecedentes. No se verificó CI remoto en esta revisión.

## Evolución y fallos

El informe 04 registra 393 backend, frontend 284 aprobadas/1 fallida, 104 integración y 25 E2E seleccionadas. Identifica mock que reutilizaba Response, discrepancia de aislamiento CI, versión cero, draft y geometría corrupta. El informe 05 documenta las correcciones y resultados posteriores: 426 backend, 289 frontend, 106 integración y 87 E2E. Una corrida intermedia tuvo 86 E2E aprobadas/1 fallida por mock incompleto de sesión, luego 87 aprobadas. Son corridas distintas; no acumular sus totales.

Cobertura del informe 05: backend statements 91.35%, branches 83.15%, functions 90.03%, lines 94.42%; frontend 87.94%, 82.48%, 85.11%, 93.42%. No son porcentajes actuales de 443/294. Existen `coverage-summary.json` en carpetas antiguas y actuales; sin vincular fecha/commit/comando no sirven para una afirmación actual.

## Evidencia disponible

Los nueve informes originales de Sprint 3 son evidencia narrativa versionada. `.local` conserva respaldos, manifiestos, snapshots y capturas; no se publica en bloque. Hay capturas `route-390/768/1366/1440.png` en el directorio privado de correcciones visuales y `panel-390/768/1366/1440.png` en el respaldo del portal. Las primeras documentan fixtures simulados según informe 05. Ninguna acredita una ruta OSRM real. Las capturas requieren revisión visual y de datos personales antes de publicación; quedan excluidas.

`src/frontend/test-results/.last-run.json` dice passed y lista vacía de fallos, pero carece de totales, fecha y commit: no demuestra 187, 94 ni una ejecución específica.

Históricamente se reportan typecheck, lint, builds y validación Prisma aprobados. Compose config verifica sintaxis, no funcionamiento de un grafo. Integración aislada verifica persistencia sin certificar public. No repetir pruebas con escrituras sobre public ni usar credenciales reales en capturas.

Para una siguiente certificación: guardar comando exacto, inicio/fin en Lima, SHA, rama, entorno aislado, resumen y salida saneada; comparar datos antes/después si procede. Falta acreditar aceptación vial real, ejecución del compañero y el origen de 187/11.
