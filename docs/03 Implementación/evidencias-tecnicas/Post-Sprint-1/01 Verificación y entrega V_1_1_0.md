# Verificación y preparación de entrega posterior al Sprint 1

Proyecto: DistriRapido. Versión documental: **V_1_1_0**. Fecha de ejecución: **2026-10-08**, America/Lima.

## Auditoría y alcance

Se revisaron estado, diferencias y archivos nuevos antes de editar documentación. Rama: `codex/sprint-1-auth-users-orders`; HEAD: `33d6139` (cierre del Sprint 1). Índice vacío. Remoto: https://github.com/RicardoF1/DistriRapido.git, visibilidad pública verificada mediante consulta de solo lectura a GitHub.

Los cambios pendientes pertenecen al frontend y a la preparación geográfica. No existen modificaciones pendientes del backend, Prisma, migraciones, PostgreSQL ni otros proyectos. Los informes históricos del Sprint 1 y versiones académicas anteriores se conservaron. No se ejecutaron git add, commit, push, merge ni creación de PR.

La auditoría detectó dos ajustes de preparación: se limitó la exclusión de informes coverage a frontend/backend en .gitignore para hacer visible el paquete canónico; se corrigió la expectativa E2E del fondo de login a una sola imagen cover sin degradado, coherente con la eliminación anterior de la capa blanca. No se cambió el comportamiento de aplicación en esta revisión documental.

## Documentos de esta revisión

| Documento | Tratamiento |
| --- | --- |
| README.md | Estado actual, límites, enlaces y preparación de entrega |
| frontend/README.md | Interfaz, pruebas reproducibles y limitaciones |
| geodata/README.md | Procedencia, aprobación provisional, integridad y publicación |
| geodata/FRONTEND-INTEGRATION.md | Estado vigente separado de evidencia histórica |
| geodata/MARKER-SYNC.md | Sincronización actual y evidencia de fase conservada |
| docs/03 Implementación/05 Mejoras posteriores al Sprint 1 V_1_1_0.md | Nuevo complemento menor: arquitectura, RF/RN e historias |
| Este informe V_1_1_0 | Nueva evidencia y lista exacta propuesta |

Los README e informes operativos no adquieren una versión mayor. Los dos documentos nuevos utilizan V_1_1_0; no se justifica V_2_0_0. La versión de datos permanece **1.0.0**, sin modificar geometrías, manifiesto o hashes.

## Funcionalidades verificadas y pendientes

Implementado: AppLayout responsive; login con imagen decorativa y marca existente; panel administrativo con tres accesos y permisos; formulario único con dos columnas y ubicación debajo a todo el ancho; mapa amplio, leyenda compacta y destino magenta. La selección explícita actualiza coordenadas, centra a zoom 17 y confirma cobertura. Editar dirección o fallar geocodificación inversa invalida confirmaciones anteriores.

Leaflet y OpenStreetMap se conservan. Photon prioriza Huancayo con país PE y bbox derivado del GeoJSON, seguido de filtro por polígonos; mantiene debounce, caché, timeout y errores. Distritos: Huancayo (120101), Chilca (120107), El Tambo (120114), Huancán (120119) y Pilcomayo (120125). Bordes incluidos y evaluación a seis decimales; no se excluyeron áreas rurales. Sapallanga, San Agustín de Cajas y Sicaya siguen reservados.

**La validación geográfica del backend no está implementada.** El cliente no es una barrera suficiente frente a peticiones directas. La próxima fase debe validar la misma versión/hash y política de bordes antes de persistir, probar HTTP y base aislada y conservar pedidos históricos. No se inició Sprint 2 ni se añadieron indicadores ficticios.

## Verificaciones ejecutadas

| Verificación | Resultado ejecutado |
| --- | --- |
| Frontend ESLint y TypeScript --noEmit | Correctos, salida 0 |
| Frontend Vitest, maxWorkers=1 | 15 archivos, **197 pruebas aprobadas** |
| Frontend Vite build | Correcto, 94 módulos; salida 0 |
| Backend ESLint y TypeScript --noEmit | Correctos, salida 0 |
| Backend Jest --runInBand | 17 suites, **181 pruebas aprobadas** |
| Backend tsc -p tsconfig.build.json | Correcto, salida 0 |
| Playwright, proyectos desktop/mobile | **76 pruebas aprobadas**, 2.8 minutos |
| git diff --check | Sin errores de espacios; advertencias normales LF/CRLF |
| Integridad y geometrías de cobertura | Ocho hashes del manifiesto coinciden; cinco MultiPolygon válidos, UBIGEO/provincia/departamento correctos, archivos individuales iguales al combinado y sin solapamientos de área |

Comandos ejecutados desde frontend, usando los CLI ya instalados por una incidencia del lanzador npm local:

```powershell
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --maxWorkers=1
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test e2e/login-background.spec.ts e2e/responsive.spec.ts e2e/admin-welcome.spec.ts e2e/order-address.spec.ts e2e/order-coverage.spec.ts e2e/order-marker-sync.spec.ts e2e/order-navigation.spec.ts e2e/order-delivery-time.spec.ts e2e/order-consultation.spec.ts --project=desktop --project=mobile
```

Desde backend:

```powershell
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/jest/bin/jest.js --runInBand
node node_modules/typescript/bin/tsc -p tsconfig.build.json
```

Los E2E verifican navegación, permisos, formulario, selección, arrastre, fallos, cobertura y responsive con **API/sesiones/Photon simulados**; las solicitudes de escritura están interceptadas y no modifican datos reales. No certifican disponibilidad de Photon/OSM ni integración real con PostgreSQL. Se comprobaron anchos 390, 768, 1366 y 1440 px y límites 767/768 y 1023/1024. Las pruebas de integración de componentes forman parte de Vitest.

**No ejecutado:** integración backend con PostgreSQL (sin TEST_DATABASE_URL de base aislada), E2E con cuentas/API reales y build Docker. No se reinició ni vació ninguna base. Los conteos de pruebas anteriores en documentos geográficos corresponden a sus fases históricas y no sustituyen esta ejecución.

## Procedencia, seguridad y riesgos

- Fuente institucional: [INEI](https://ide.inei.gob.pe/), descarga Distrito.rar, catálogo «Actualizado al 2023». EPSG:4326/WGS84, orden longitud/latitud. El metadato interno gpkg_last_change de 2026 no demuestra actualización administrativa a 2026.
- No se identificó una licencia explícita de redistribución para esa descarga. Acceso gratuito no prueba autorización para incluir derivados en un repositorio público. **La publicación del paquete geográfico queda condicionada a aclarar esos permisos.** Se preservó la documentación original de incertidumbre y la aprobación provisional; el status histórico del manifiesto no se reescribió.
- SHA-256 del combinado: `ac5f8b3366d5e028e5acf51e74dfcea18ab0a8db1edbcf1cc6236c9634afd33b`. Se verificaron los ocho archivos derivados y el RAR conservado fuera del repositorio. El GPKG original no estaba disponible en la ubicación temporal revisada y su hash no se recalculó en esta auditoría; se conserva el registro de preparación.
- Escaneo por patrones sobre archivos rastreados y nuevos visibles: sin secretos detectados. La coincidencia en docker-compose.yml corresponde a interpolación de variables, no a una contraseña literal. No equivale a auditoría de todo el historial Git.
- Sin .env, node_modules, informes generados, claves privadas, RAR/GPKG originales ni datos personales reales en la lista propuesta. Los emails de fixtures usan example.com y son sintéticos.
- La imagen de login fue suministrada por el usuario. Se mantiene intacta con metadatos C2PA; no hay EXIF/texto ni rutas locales personales identificadas. No se verificó una licencia externa independiente de publicación de ese recurso.
- **Empaquetado pendiente:** Docker usa contexto ./frontend y no incluye ../geodata, requerido por coverage.ts. El build local exitoso no garantiza build Docker. No se modificaron Dockerfile ni compose; resolver el contexto o empaquetado compartido en una intervención autorizada antes de prometer despliegue reproducible.
- La fuente administrativa puede no representar cobertura urbana efectiva, acceso vial o precisión jurídica. No se inventaron límites urbanos. Futuras revisiones deben versionar datos sin sobrescribir v1.

## Lista exacta propuesta para el commit

Total: **54 archivos** (45 de documentación/frontend/preparación y 9 del paquete geográfico). Esta es una propuesta para revisión, no un staging realizado. La entrega funcional completa depende del paquete geográfico; **no publicar los primeros archivos como una entrega compilable dejando fuera los recursos importados**. Si la redistribución sigue sin resolver, posponer la entrega funcional y acordar una alternativa de distribución reproducible.

Archivos fuera del paquete de datos:

```text
.gitignore
README.md
docs/03 Implementación/05 Mejoras posteriores al Sprint 1 V_1_1_0.md
docs/03 Implementación/evidencias-tecnicas/Post-Sprint-1/01 Verificación y entrega V_1_1_0.md
frontend/README.md
frontend/e2e/admin-welcome.spec.ts
frontend/e2e/login-background.spec.ts
frontend/e2e/login.spec.ts
frontend/e2e/order-address.spec.ts
frontend/e2e/order-coverage.spec.ts
frontend/e2e/order-delivery-time.spec.ts
frontend/e2e/order-marker-sync.spec.ts
frontend/e2e/order-navigation.spec.ts
frontend/e2e/orders.spec.ts
frontend/e2e/responsive.spec.ts
frontend/e2e/users.spec.ts
frontend/src/assets/login-landscape.png
frontend/src/features/orders/DeliveryMap.test.tsx
frontend/src/features/orders/DeliveryMap.tsx
frontend/src/features/orders/OrderForm.tsx
frontend/src/features/orders/coverage-failure.test.tsx
frontend/src/features/orders/orders.test.tsx
frontend/src/features/orders/useDeliveryAddress.test.tsx
frontend/src/features/orders/useDeliveryAddress.ts
frontend/src/hooks/useCoverage.ts
frontend/src/layouts/AdminLayout.tsx
frontend/src/layouts/AppLayout.test.tsx
frontend/src/layouts/AppLayout.tsx
frontend/src/layouts/AuthLayout.tsx
frontend/src/layouts/OrderLayout.tsx
frontend/src/pages/AccessPage.tsx
frontend/src/pages/OrderRegistrationPage.tsx
frontend/src/routes/AppRoutes.test.tsx
frontend/src/services/coverage.test.ts
frontend/src/services/coverage.ts
frontend/src/services/geocoding.test.ts
frontend/src/services/geocoding.ts
frontend/src/styles/app.css
frontend/src/test/setup.ts
frontend/vitest.config.ts
geodata/FRONTEND-INTEGRATION.md
geodata/MARKER-SYNC.md
geodata/README.md
geodata/coverage.ts
geodata/tools/prepare_coverage.py
```

Paquete canónico: incluir únicamente tras resolver permisos de redistribución pública:

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

No incluir fuentes binarias descargadas, temporales, dist, test-results, playwright-report, coverage de tests ni .env. No hay archivos de backend para subir.

## Rama y mensaje sugerido

Rama actual: `codex/sprint-1-auth-users-orders`.

Mensaje propuesto para la entrega completa, después de resolver publicación y revisar esta lista:

```text
feat(frontend): mejorar interfaz responsive y cobertura geográfica de entregas

Documentar mejoras posteriores al Sprint 1 y cobertura administrativa v1.0.0.
Añadir validación y sincronización del destino en frontend, con pruebas responsive.
Mantener pendiente la validación geográfica del backend.
```

Antes de subir: revisión del usuario, resolución documentada de permisos INEI y decisión sobre empaquetado Docker. Después, seleccionar explícitamente los archivos aprobados; evitar git add . indiscriminado. Esta revisión no autoriza ni ejecuta publicación.

## Siguiente documento / Siguiente trabajo recomendado

Resolver permisos de redistribución y empaquetado compartido; luego especificar e implementar validación territorial del backend con pruebas HTTP/PostgreSQL en una base aislada. Son necesarios para que la entrega sea publicable, reproducible y funcionalmente completa.
