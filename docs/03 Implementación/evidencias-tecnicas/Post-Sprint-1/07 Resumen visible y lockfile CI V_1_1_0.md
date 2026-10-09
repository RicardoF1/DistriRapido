# Resumen visible y lockfile CI V_1_1_0

Fecha: 2026-10-09. Rama: feature/post-sprint1-ui-geocoverage.

## Diagnóstico y cambios

El endpoint GET /admin/summary y su integración en AccessPage ya existían en esta rama. No se comprobó qué versión está sirviendo la instalación donde se observó la ausencia del resumen. El componente ocultaba las tarjetas durante carga o error; ahora mantiene las tres etiquetas visibles, muestra una raya durante carga y «No disponible» ante error, permite reintentar y actualizar. HTTP 404 informa que debe iniciarse el backend de esta misma versión. Los ceros solo proceden de una respuesta válida. Se conservan accesos rápidos, RBAC y distribución responsive.

El endpoint protegido obtiene el total completo mediante agrupación de pedidos por estado y count de usuarios, en una transacción de lectura RepeatableRead. No cuenta una página ni presupone que todos los pedidos están pendientes. No se cambiaron endpoints, Prisma, migraciones o registros. Los datos ficticios pertenecen exclusivamente a fixtures de pruebas.

El fallo npm ci de Actions #18 se reprodujo por la diferencia de resolvedor: npm local 11.6.2 frente a npm 11.19.0 del runner. Se sincronizó package-lock.json mediante npm install --package-lock-only con npm 11.19.0. Se incorporaron los peers transitorios @emnapi/core y @emnapi/runtime 1.11.3; ninguna versión de dependencia existente cambió. Se conserva handlebars 4.7.10 y los fixtures sintéticos independientes del INEI. package.json y workflow permanecen intactos.

## Archivos

- src/backend/package-lock.json y test/orders.integration.ts.
- src/frontend/src/features/admin/AdminSummary.tsx y AdminSummary.test.tsx.
- src/frontend/src/styles/app.css.
- src/frontend/src/routes/AppRoutes.test.tsx.
- src/frontend/e2e/admin-summary.spec.ts.
- src/frontend/src/features/orders/DeliveryMap.test.tsx: establece un centro sintético explícito en Leaflet antes de probar Enter; jsdom carece de disposición visual. No cambia código del mapa.
- README.md, src/frontend/README.md y este informe.

## Verificaciones ejecutadas

- Instalación limpia backend con npm 11.19.0, copias de package.json/lockfile en directorio local nuevo sin recursos geográficos: npm ci aprobado, 575 paquetes instalados. npm audit --audit-level=high aprobado; quedan 20 vulnerabilidades moderadas informadas por npm.
- Backend: lint, typecheck, 243 pruebas Jest con cobertura y compilación TypeScript aprobados. Incluyen pruebas HTTP y Prisma simulados. No se ejecutó la suite de integración que escribe en PostgreSQL local; el workflow la ejecuta con una base efímera propia.
- Frontend: lint, typecheck, 223 pruebas Vitest y build aprobados. Cobertura: statements 95.72%, branches 91.23%, functions 97.86%, lines 98.36%.
- E2E: 30 aprobadas, API simulada, Edge, 390/768/1366/1440 px, navegación, permisos, carga/error/reintento y respuesta vacía.
- Un primer intento Jest no inició por permisos del directorio temporal Windows; la repetición autorizada aprobó. La primera pasada frontend detectó un centro no determinista en jsdom y la primera E2E detectó dos expectativas antiguas; se corrigieron sus precondiciones/expectativas y se repitieron completas.
- El build local puede incluir los recursos privados disponibles localmente; dist está ignorado y no se publica. CI comprueba un checkout sin dichos recursos. La validación geográfica de producción conserva el bloqueo por ausencia o corrupción.

## Resultado remoto y corrección adicional

Actions #19 aprobó npm ci, las 243 pruebas backend, frontend y CodeQL; falló en integración PostgreSQL porque orders.integration.ts todavía dependía de cobertura privada. Se añadió exclusivamente en esa suite un proveedor de prueba que carga el paquete sintético verificado durante onModuleInit; las coordenadas y expectativas de persistencia ahora usan el punto ficticio (2, 2). Se mantienen todas las aserciones HTTP, persistencia y rollback, el acceso real a la base efímera de CI y el servicio de producción sin cambios. Typecheck y lint aprobados tras este ajuste. El resultado de integración se verificará en la siguiente ejecución remota; no se ejecutó contra PostgreSQL local.

## Publicación y límites

No se incorporan recursos de geodata/coverage/v1/, GeoJSON privados, RAR/GPKG, secretos, node_modules, dist ni directorios temporales. El aprovisionamiento geográfico sigue requiriendo autorización privada; no se autoriza redistribuir esos datos ni imágenes que los incluyan. No se ejecutó Docker ni se modificó el checkout original. El estado remoto de Actions debe comprobarse sobre el hash publicado; las verificaciones locales no prueban por sí solas el éxito del runner.

## Verificación local

Iniciar frontend y API desde este mismo worktree con la configuración privada existente, entrar como Administrador y abrir /acceso/administrador. Confirmar cantidades desde el endpoint, usar Actualizar resumen y verificar que una indisponibilidad de API muestra error en lugar de ceros.

## Siguiente documento / Siguiente trabajo recomendado

Registrar el resultado de Actions asociado al commit publicado y verificar con el equipo que frontend y API utilizan la misma versión. Resolver los permisos de redistribución antes de distribuir recursos geográficos o imágenes de despliegue.
