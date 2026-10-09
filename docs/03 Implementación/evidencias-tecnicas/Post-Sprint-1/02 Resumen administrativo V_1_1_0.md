# Indicadores reales del panel administrativo

Proyecto: DistriRapido. Versión documental: V_1_1_0. Fecha: 2026-10-08 (America/Lima).

## Auditoría previa y decisión

GET /orders devuelve items, total, page y pageSize, usando count con los mismos filtros y una transacción RepeatableRead. Solo Administrador y Operador / Técnico consultan pedidos. Ese total no depende del tamaño de una página. GET /users es exclusivo de Administrador, devuelve todas las cuentas y carece de un resumen agregado. Reutilizarlo descargaría información personal innecesaria. El filtro de estados actualmente habilita únicamente PENDIENTE; Prisma almacena estado como texto, no como enum.

Se implementó GET /admin/summary para resolver todos los indicadores con una solicitud. No cambia los endpoints existentes, los filtros de pedidos ni los estados permitidos. Agrupa exactamente los estados almacenados, sin inventar estados o asumir que todos los pedidos están pendientes.

## Contrato y seguridad

Respuesta: totalOrders, pendingOrders, totalUsers y ordersByState (state/count). El total de pedidos es la suma de la agrupación completa, sin skip/take; pendientes corresponde exclusivamente al grupo PENDIENTE. Usuarios incluye cuentas activas e inactivas. Ambas consultas usan Prisma en la misma transacción RepeatableRead.

El endpoint aplica JwtAuthGuard, AdministratorGuard y RequestOriginGuard existentes, cookie HttpOnly/JWT y Cache-Control: no-store. No devuelve nombres, correos ni información de clientes. Otros roles reciben 403 y no se ejecutan agregaciones; sesión ausente o vencida recibe 401. Se conserva la política CORS existente: RequestOriginGuard controla escrituras, y la lectura de navegador desde origen ajeno queda restringida por CORS.

## Interfaz

Resumen general precede a las tres tarjetas de acceso rápido, cuyo diseño y enlaces se conservan. Tres métricas con iconos y distribución compacta por estados reales. Carga sin cifras, ceros solo tras respuesta válida, vacío explícito y error con Reintentar resumen. Respuestas inconsistentes se rechazan; un error no se convierte en cero. Se aborta al desmontar, una sesión rechazada se descarta y se evita el primer efecto descartado por StrictMode para no duplicar solicitudes. Sin caché global de datos entre cuentas.

Escritorio: tres columnas; tablet: dos; móvil: una. Verificado a 390, 768, 1366 y 1440 px, sin desbordamiento horizontal. Los demás roles no montan ni solicitan el resumen.

## Archivos de esta intervención

- backend/src/app.module.ts
- backend/src/admin/admin.module.ts
- backend/src/admin/admin-summary.controller.ts
- backend/src/admin/admin-summary.dto.ts
- backend/src/admin/admin-summary.service.ts
- backend/src/admin/admin-summary.spec.ts
- frontend/src/features/admin/AdminSummary.tsx
- frontend/src/features/admin/AdminSummary.test.tsx
- frontend/src/services/admin-api.ts
- frontend/src/services/admin-api.test.ts
- frontend/src/pages/AccessPage.tsx
- frontend/src/styles/app.css
- frontend/src/routes/AppRoutes.test.tsx
- frontend/e2e/admin-summary.spec.ts
- frontend/e2e/admin-welcome.spec.ts
- Este informe.

Son 16 archivos de esta intervención; no representan toda la lista pendiente del repositorio. Se preservan las modificaciones anteriores. El informe de preparación de entrega precedente es una fotografía anterior a esta ampliación y su lista no debe reutilizarse sin nueva auditoría Git.

## Verificación ejecutada

| Comprobación | Resultado |
| --- | --- |
| Frontend ESLint y tsc --noEmit | Salida 0 |
| Suite completa frontend | 17 archivos, 214 pruebas aprobadas |
| Revalidación tras último ajuste de efecto/CSS | 3 archivos, 40 pruebas relacionadas aprobadas |
| Frontend Vite build final | Salida 0, 96 módulos |
| Backend ESLint, tsc --noEmit y build | Salida 0 |
| Suite completa backend | 18 suites, 194 pruebas aprobadas |
| Playwright resumen + bienvenida desktop/mobile | 30 pruebas aprobadas |
| Servicio compilado contra PostgreSQL real | 2 pedidos registrados, 2 pendientes, 2 usuarios; único grupo almacenado: PENDIENTE |

La suite completa frontend se ejecutó antes del último ajuste del arranque de efecto y especificidad CSS; después se repitieron las 40 pruebas afectadas, lint, typecheck, build y E2E. No se presenta como una nueva ejecución completa posterior a ese ajuste.

Pruebas de cero, uno, 251 pedidos, ausencia de pendientes y múltiples grupos usan mocks de Prisma, sin crear registros ni habilitar estados nuevos. HTTP/RBAC se prueba con autenticación y Prisma simulados. Componentes cubren carga, error, reintento, validación de respuesta, sesión y cancelación. Playwright usa API/sesión simuladas y verifica una sola solicitud inicial. Sus cifras 2/2/2 coinciden con la consulta real realizada, pero las capturas no representan una sesión real autenticada.

Las dos consultas contra PostgreSQL real fueron únicamente agregaciones de lectura: auditoría independiente y ejecución del servicio compilado. No se ejecutó integración autenticada contra el servidor real ni escenarios de escritura. No se hicieron migraciones, cambios de Prisma, reinicio de base, creación de cuentas/pedidos, commit ni push.

Comandos desde frontend:

```powershell
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --maxWorkers=1
node node_modules/vitest/vitest.mjs run src/features/admin/AdminSummary.test.tsx src/services/admin-api.test.ts src/routes/AppRoutes.test.tsx --maxWorkers=1
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test e2e/admin-summary.spec.ts e2e/admin-welcome.spec.ts --project=desktop --project=mobile
```

Desde backend:

```powershell
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/jest/bin/jest.js --runInBand
node node_modules/typescript/bin/tsc -p tsconfig.build.json
```

Capturas generadas e inspeccionadas en frontend/test-results/admin-summary-390.png y admin-summary-1440.png. También se generaron las de 768 y 1366 px. Son evidencias locales ignoradas por Git; contienen la cuenta sintética admin@example.com. No incorporarlas como datos de producción.

## Verificación local y limitaciones

Actualizar el proceso backend para cargar AdminModule; si ya funciona en modo watch, comprobar que recompiló. Con npm operativo, ejecutar npm run start:dev desde backend y npm run dev desde frontend; los scripts usan la configuración existente. Si el lanzador npm presenta la incidencia local conocida, usar los CLI indicados para verificaciones y node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173 para frontend.

Iniciar sesión con una cuenta Administrador existente y abrir http://localhost:5173/acceso/administrador. La pestaña Red debe mostrar GET /admin/summary con respuesta 200 y una sola solicitud inicial del resumen. Probar el reintento con una interrupción controlada de red del navegador. No cambiar registros para verificar el panel.

Los indicadores son una fotografía consistente al cargar el panel o reintentar; no hay polling ni actualización en tiempo real. Una nueva visita consulta de nuevo. No se incorporan vehículos, conductores ni historias de Sprint 2. La validación geográfica de backend permanece pendiente y no se modifica en esta tarea.

## Siguiente documento / Siguiente trabajo recomendado

Revisar el panel con una sesión Administrador real y auditar nuevamente la lista de entrega antes de autorizar publicación. Mantener separada la próxima fase de validación geográfica de backend; el resumen no la sustituye.
