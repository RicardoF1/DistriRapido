# Reconciliación Post-Sprint 1 sobre main

Proyecto: DistriRapido / EcoRuta Huancayo. Versión documental V_1_1_0. Fecha: 2026-10-08, America/Lima. Esta evidencia sustituye los inventarios anteriores para esta estructura sin reescribir los informes históricos del Sprint 1.

## Worktree, rama y base

- Worktree: C:/Users/HP/Desktop/DistriRapido/.delivery-worktrees/post-sprint1-ui-geocoverage.
- Rama exclusiva: feature/post-sprint1-ui-geocoverage.
- HEAD/base: 1aaa7251789ca92e0034b81290ec6eba6f2ab4a8, igual a origin/main obtenido por fetch antes de crear la rama.
- Original: C:/Users/HP/Desktop/DistriRapido, codex/sprint-1-auth-users-orders, HEAD 33d6139.
- La nueva rama no sigue origin/main automáticamente: se retiró ese upstream para evitar confusión al publicar. No hay commits nuevos.

El worktree se creó con git worktree add -b desde origin/main, después de confirmar ruta y rama inexistentes. Su carpeta se excluyó mediante .git/info/exclude compartido, no mediante un cambio en el .gitignore versionado del original. Solo cambió metadata Git requerida para el worktree; los 67 archivos originales mantienen sus bytes y SHA-256.

## Comparación previa y reconciliación

Se compararon las tres versiones antes de escribir: HEAD original, archivo local y destino de origin/main. Inventario: 67 archivos, 25 con cambios solo locales sobre contenido base idéntico, 40 nuevos y dos con cambios tanto locales como remotos. No hubo destinos faltantes para archivos previamente rastreados.

README.md y .gitignore se integraron con git merge-file sobre las tres versiones. **Sin conflictos de texto**. Se conservaron el índice de documentación y estructura src/ de main; .gitignore mantiene LEVANTAR.md e ignora cobertura de pruebas en src/frontend/coverage y src/backend/coverage sin ocultar geodata/coverage/v1.

Para los 25 archivos cuyo destino remoto coincidía con la base original, se trasladó únicamente el contenido modificado. Los 40 nuevos se copiaron a su destino. No se copiaron directorios completos de código antiguo ni configuración secreta. frontend → src/frontend; backend → src/backend; docs y geodata permanecen en la raíz. No existen frontend ni backend duplicados en la raíz del worktree.

Resoluciones de integración:

1. Importaciones de servicios/test/setup hacia geodata: ../../../ pasó a ../../../../ desde src/frontend/src. Se adaptó también coverage.test.ts.
2. Vitest resuelve ../../geodata desde src/frontend; Vite conserva envDir ../.., puerto predeterminado 5173 y strictPort de main, y permite recursos del repositorio para servir el GeoJSON externo a src/frontend. Solo el servidor de verificación usó 5174 por argumento CLI.
3. README principal, frontend y addendum 05 incorporan el incremento de indicadores ya autorizado. Eliminan afirmaciones obsoletas de «sin indicadores» o «sin cambios backend». Los informes 01–03 conservan la evidencia y rutas históricas de cada fase; los documentos geográficos incorporan una aclaración de estructura vigente.
4. El módulo admin y su integración en AppModule se conservan, sin crear funciones nuevas. Se mantienen JWT/cookies, RBAC, sesiones, consultas, registro, mapa y contratos existentes, además del endpoint /admin/summary implementado en la fase anterior.
5. Docker/compose, CI, package.json y lockfiles de ambos proyectos, index.html, nginx.conf y Prisma mantienen contenido de main. Las diferencias de finales LF/CRLF normales de checkout no se contabilizan como cambios funcionales; se verificaron blobs Git con filtros de ruta.

## Archivos reconciliados y selección exacta

Total final candidato: **69 archivos**, 28 modificados y 41 nuevos, sin staging. Son los 67 trasladados, Vite adaptado y este informe nuevo. Los nuevos son locales no rastreados; la comparación con main no añade ni elimina archivos de Sprint 1.

Archivos de código, pruebas, configuración y documentación (60):

```text
.gitignore
README.md
docs/03 Implementación/05 Mejoras posteriores al Sprint 1 V_1_1_0.md
docs/03 Implementación/evidencias-tecnicas/Post-Sprint-1/01 Verificación y entrega V_1_1_0.md
docs/03 Implementación/evidencias-tecnicas/Post-Sprint-1/02 Resumen administrativo V_1_1_0.md
docs/03 Implementación/evidencias-tecnicas/Post-Sprint-1/03 Preparación de rama de entrega V_1_1_0.md
docs/03 Implementación/evidencias-tecnicas/Post-Sprint-1/04 Reconciliación sobre main V_1_1_0.md
geodata/FRONTEND-INTEGRATION.md
geodata/MARKER-SYNC.md
geodata/README.md
geodata/coverage.ts
geodata/tools/prepare_coverage.py
src/backend/src/admin/admin-summary.controller.ts
src/backend/src/admin/admin-summary.dto.ts
src/backend/src/admin/admin-summary.service.ts
src/backend/src/admin/admin-summary.spec.ts
src/backend/src/admin/admin.module.ts
src/backend/src/app.module.ts
src/frontend/README.md
src/frontend/e2e/admin-summary.spec.ts
src/frontend/e2e/admin-welcome.spec.ts
src/frontend/e2e/login-background.spec.ts
src/frontend/e2e/login.spec.ts
src/frontend/e2e/order-address.spec.ts
src/frontend/e2e/order-coverage.spec.ts
src/frontend/e2e/order-delivery-time.spec.ts
src/frontend/e2e/order-marker-sync.spec.ts
src/frontend/e2e/order-navigation.spec.ts
src/frontend/e2e/orders.spec.ts
src/frontend/e2e/responsive.spec.ts
src/frontend/e2e/users.spec.ts
src/frontend/src/assets/login-landscape.png
src/frontend/src/features/admin/AdminSummary.test.tsx
src/frontend/src/features/admin/AdminSummary.tsx
src/frontend/src/features/orders/DeliveryMap.test.tsx
src/frontend/src/features/orders/DeliveryMap.tsx
src/frontend/src/features/orders/OrderForm.tsx
src/frontend/src/features/orders/coverage-failure.test.tsx
src/frontend/src/features/orders/orders.test.tsx
src/frontend/src/features/orders/useDeliveryAddress.test.tsx
src/frontend/src/features/orders/useDeliveryAddress.ts
src/frontend/src/hooks/useCoverage.ts
src/frontend/src/layouts/AdminLayout.tsx
src/frontend/src/layouts/AppLayout.test.tsx
src/frontend/src/layouts/AppLayout.tsx
src/frontend/src/layouts/AuthLayout.tsx
src/frontend/src/layouts/OrderLayout.tsx
src/frontend/src/pages/AccessPage.tsx
src/frontend/src/pages/OrderRegistrationPage.tsx
src/frontend/src/routes/AppRoutes.test.tsx
src/frontend/src/services/admin-api.test.ts
src/frontend/src/services/admin-api.ts
src/frontend/src/services/coverage.test.ts
src/frontend/src/services/coverage.ts
src/frontend/src/services/geocoding.test.ts
src/frontend/src/services/geocoding.ts
src/frontend/src/styles/app.css
src/frontend/src/test/setup.ts
src/frontend/vite.config.ts
src/frontend/vitest.config.ts
```

Paquete geográfico local (9); **publicación condicionada a aclarar redistribución INEI**:

```text
geodata/coverage/v1/120101.geojson
geodata/coverage/v1/120107.geojson
geodata/coverage/v1/120114.geojson
geodata/coverage/v1/120119.geojson
geodata/coverage/v1/120125.geojson
geodata/coverage/v1/coverage.geojson
geodata/coverage/v1/manifest.json
geodata/coverage/v1/test-points.json
geodata/coverage/v1/validation.json
```

La imagen src/frontend/src/assets/login-landscape.png fue suministrada por el usuario y se conserva sin edición. Documentar su procedencia de publicación; no se verificó licencia independiente. Todos los demás cambios pertenecen a los incrementos autorizados, incluidos indicadores; no hay modificaciones de otros proyectos.

No publicar una entrega que excluya el GeoJSON requerido por imports y tests; resolver permisos o distribución reproducible primero. Esta lista prepara revisión, no autoriza publicación.

## Verificaciones ejecutadas en este worktree

| Verificación | Resultado |
| --- | --- |
| Frontend lint y typecheck | Salida 0 |
| Frontend Vitest con cobertura | 17 archivos, 214 pruebas aprobadas |
| Frontend cobertura configurada | Statements 97%; branches 91.36%; functions 98.68%; lines 99.62%; umbrales aprobados |
| Frontend build | Salida 0, 96 módulos |
| Backend lint, typecheck y build | Salida 0 |
| Backend Jest con cobertura | 18 suites, 194 pruebas aprobadas; 100% en el alcance instrumentado de la configuración |
| Playwright desktop/mobile | 92 pruebas aprobadas, 3.4 minutos, API simulada |
| Conservación original | 67 hashes intactos; todos los destinos presentes |
| GeoJSON canónico | Ocho hashes del manifiesto intactos; recurso emitido por Vite coincide con hash combinado |
| Documentación y Git | 10 Markdown con enlaces/footer válidos; diff --check correcto; índice vacío; sin patrones de secretos detectados |

Los comandos se ejecutaron con Node y CLI instalados desde src/frontend o src/backend. Se copiaron las dependencias existentes a node_modules del worktree para no escribir en las instalaciones originales; no se modificaron package.json/lockfiles ni se añadieron dependencias. Versiones clave coinciden con el lock: Vite 7.3.6, Vitest 4.1.11, React 19.3.0, TypeScript 5.9.3, Prisma 6.12.0 y Jest 30.5.2. No se ejecutó instalación limpia npm ci ni auditoría de vulnerabilidades en esta fase.

Desde src/frontend:

```powershell
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --maxWorkers=1 --coverage
node node_modules/vite/bin/vite.js build
# Servidor separado; no interrumpe 5173 original
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort
# En otra terminal:
$env:E2E_BASE_URL = 'http://127.0.0.1:5174'
node node_modules/@playwright/test/cli.js test e2e/login-background.spec.ts e2e/responsive.spec.ts e2e/admin-welcome.spec.ts e2e/admin-summary.spec.ts e2e/order-address.spec.ts e2e/order-coverage.spec.ts e2e/order-marker-sync.spec.ts e2e/order-navigation.spec.ts e2e/order-delivery-time.spec.ts e2e/order-consultation.spec.ts --project=desktop --project=mobile
```

Desde src/backend:

```powershell
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/jest/bin/jest.js --runInBand --coverage
node node_modules/typescript/bin/tsc -p tsconfig.build.json
```

Se verifican login y sesiones mediante componentes/integración simulada; los E2E cubren aspecto del login, panel, navegación/logout, roles, registro, consulta/filtros, dirección explícita, clic/arrastre, errores Photon/cobertura, marcador magenta, repetición del destino, envío de coordenadas y conservación del formulario. Anchos 390/768/1366/1440 y límites 767/768, 1023/1024.

La integración HTTP backend de las suites ejecutadas usa Auth/Prisma simulados. Los E2E usan sesiones/API/Photon simulados y teselas bloqueadas. **No certifican disponibilidad de Photon/OSM ni flujo autenticado con servicios reales**. Los tests PostgreSQL que crean/eliminan fixtures y los E2E login/users/orders con escritura real no se ejecutaron; no se creó ninguna base aislada ni se accedió a la base real en esta reconciliación. No se hizo build Docker.

## Exclusiones y pendientes

Excluir de publicación: .env y variantes; node_modules; dist; informes coverage; test-results y playwright-report; fuentes INEI RAR/GPKG; logs, temporales, inventarios de hashes; backend/.local/ original y sus bases/configuración. No se copiaron .env, PostgreSQL local ni sus volúmenes. No se ejecutaron migraciones, reset, limpieza destructiva o cambios sobre Optica_Banglor.

Pendientes:

- **Validación geográfica backend:** OrdersService.create no valida pertenencia a polígonos. No se implementa aquí ni se declara cobertura funcional de extremo a extremo.
- **Docker:** contextos src/frontend y src/backend siguen excluyendo geodata raíz. Propuesta: contexto de raíz con COPY selectivos o artefacto compartido versionado/hash para frontend/backend; evitar geometrías duplicadas. No se cambia Docker en esta fase. Mantener este límite al evaluar desplegabilidad.
- **INEI:** versión administrativa 1.0.0, catálogo actualizado al 2023, WGS84, límites sin recorte rural; gpkg_last_change de 2026 no acredita vigencia administrativa a 2026. Se conserva incertidumbre de redistribución y manifiesto sin reescribir su snapshot. Resolver permiso antes de una publicación pública.
- **Documentación:** README y addendum vigentes están reconciliados; las rutas antiguas de informes 01–03 y evidencias de fase son históricas. No atribuir conteos actuales al cierre Sprint 1. Este informe y su lista son la referencia de revisión de esta rama.

## Estado final y revisión local

Rama feature/post-sprint1-ui-geocoverage con HEAD igual a la base remota, árbol de trabajo modificado y archivos nuevos locales. Índice vacío. Sin commit, push, merge o PR; git merge-file fue solo reconciliación de contenido, no una fusión de ramas. Original conserva su rama, 67 pendientes originales y hashes; main local no se movió.

Abrir el worktree en el editor. El frontend de prueba está en http://127.0.0.1:5174/login; para uso real necesita backend/configuración existentes fuera de Git. No se copian secretos para facilitar una vista. Las capturas simuladas se generan bajo src/frontend/test-results y se excluyen de publicación.

Mensaje sugerido después de revisión y resolución de publicación: feat: improve post-sprint1 UI, admin metrics and delivery geocoverage. Antes de cualquier staging/commit/push se requiere autorización del usuario y una revisión actualizada de permisos y lista exacta.

## Siguiente documento / Siguiente trabajo recomendado

Revisar esta rama y decidir el empaquetado de geodata y sus permisos antes de publicar. Después preparar la fase de validación territorial del backend; la reconciliación no sustituye esa protección.
