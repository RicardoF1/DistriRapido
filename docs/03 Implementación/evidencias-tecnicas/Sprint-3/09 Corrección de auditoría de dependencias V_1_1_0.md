# Corrección de auditoría de dependencias — PR 8

Versión V_1_1_0. Fecha local: 2026-10-29. Rama `feature/sprint-3-avances`. Base de revisión: ejecución [40998494538](https://github.com/RicardoF1/DistriRapido/actions/runs/40998494538), donde las verificaciones funcionales aprobaron y fallaron los pasos npm audit de backend/frontend; CodeQL aprobó. Este cambio no modifica lógica de negocio ni el umbral `npm audit --audit-level=high`.

## Evidencia previa y criterio de actualización

Se ejecutó npm audit --json por separado y se respaldaron package.json, lockfiles e informes en una carpeta privada `.local/dependency-audit-*`. Backend: 10 entradas afectadas, tres altas, una moderada y seis bajas. Frontend: cinco entradas, dos altas y tres moderadas. Una entrada puede ser una metavulnerabilidad transitiva: las seis bajas no representan seis defectos independientes.

Se eligieron los parches/minores mínimos corregidos sin cambios de versión mayor. No se ejecutó npm audit fix ni --force. Se conservaron NestJS 11, Express 5, Prisma 6.12.0, Jest 30, ts-jest 29, Vite 7 y Vitest 4. Permanecen los overrides anteriores de handlebars 4.7.10 y js-yaml 5.4.2.

## Backend: inventario completo de entradas afectadas

| Dependencia | Cadena relevante desde el proyecto | Severidad previa | Antes → después | Solución |
|---|---|---|---|---|
| @nestjs/platform-express | Dependencia directa → multer | Alta, transitiva | 11.2.7 → 11.2.7 | Override acotado de multer 2.5.0 |
| multer | @nestjs/platform-express → multer | Alta | 2.4.0 → 2.5.0 | Revisión menor del mismo major |
| body-parser | @nestjs/platform-express → express 5.2.1 → body-parser | Alta | 2.3.0 → 2.4.0 | Override compatible con ^2.2.1 requerido por Express |
| qs | express / body-parser / supertest → superagent → qs | Moderada | 6.16.0 → 6.16.1 | Override compatible con los consumidores; body-parser 2.4.0 exige ^6.16.1 |
| deepmerge | jest → jest-config → deepmerge | Baja | 4.3.1 → 4.3.1 | Pendiente: sin versión 4 corregida publicada al consultar npm |
| jest-config | jest / jest-cli / @jest/core → jest-config → deepmerge | Baja, transitiva | 30.5.2 → 30.5.2 | Mismo pendiente deepmerge |
| @jest/core | jest → @jest/core → jest-config → deepmerge | Baja, transitiva | 30.5.2 → 30.5.2 | Mismo pendiente deepmerge |
| jest-cli | jest → jest-cli → jest-config → deepmerge | Baja, transitiva | 30.5.2 → 30.5.2 | Mismo pendiente deepmerge |
| jest | Dependencia de desarrollo directa → jest-config → deepmerge | Baja, transitiva | 30.5.2 → 30.5.2 | Mismo pendiente deepmerge |
| ts-jest | Dependencia de desarrollo directa → peer Jest → deepmerge | Baja, transitiva | 29.4.14 → 29.4.14 | Mismo pendiente deepmerge |

Fuentes: [aviso Multer](https://github.com/advisories/GHSA-q7qp-rjg7-q26m), [aviso body-parser](https://github.com/advisories/GHSA-27r3-jxmh-p828), [aviso qs](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw), [aviso deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).

NestJS 11.2.8 también fija multer 2.4.0, por lo que actualizar solo ese patch no resuelve la vulnerabilidad. Se mantuvo 11.2.7 y se limitó el override a su dependencia Multer 2.5.0. No se migró a NestJS 12. Se verificaron los peerDependencies instalados de common/core/platform-express/swagger/mapped-types/class-validator: sin incompatibilidades semver.

Para deepmerge, npm informó 4.3.1 como última versión; audit propone bajar Jest a 25.1.0 y ts-jest a 25.5.1. Esa regresión de varias versiones mayores no se aplicó para ocultar entradas bajas. El hallazgo sigue visible, no está suprimido ni exento. Afecta al árbol de desarrollo de Jest; requiere una futura actualización corregida compatible o evaluación separada de alternativa de test runner. No queda ninguna vulnerabilidad alta sin solución compatible en esta entrega.

## Frontend: inventario completo

| Dependencia | Cadena | Severidad previa | Antes → después | Solución |
|---|---|---|---|---|
| vite | Dependencia de desarrollo directa | Alta; también avisos moderados/bajo | 7.3.6 → 7.3.7 | Patch compatible; corrige los avisos del servidor/editor |
| @vitest/mocker | vitest → @vitest/mocker | Moderada | 4.1.11 → 4.1.12 | Patch coordinado con Vitest |
| vitest | Dependencia directa → @vitest/mocker | Moderada, transitiva | 4.1.11 → 4.1.12 | Patch compatible |
| @vitest/coverage-v8 | Dependencia directa → Vitest | Moderada, transitiva | 4.1.11 → 4.1.12 | Mantener versión alineada con Vitest |
| zod | eslint-plugin-react-hooks 7.1.1 → zod | Alta | 4.6.5 → 4.6.6 | Override patch dentro del rango permitido ^3.25.0 o ^4.0.0 |

También se actualizaron los paquetes internos expect, pretty-format, runner, snapshot, spy y utils de Vitest a 4.1.12 por su dependencia exacta; no son ampliaciones de alcance funcional.

Fuentes: [aviso Vite/Windows](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [aviso mocker](https://github.com/advisories/GHSA-qxg6-89mg-rqv8), [aviso de traversal Windows](https://github.com/advisories/GHSA-xp26-3454-mjgp), [aviso Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). El JSON original conservado localmente incluye todos los avisos asociados a cada paquete.

## Lockfiles y reproducibilidad

Se sincronizaron mediante npm install los dos manifests y lockfiles. Se preservaron los metadatos opcionales @emnapi/core y @emnapi/runtime ya presentes antes, evitando la pérdida de entradas de plataformas que npm puede omitir al resolver en Windows. Ambos lockfiles pasaron npm ci --dry-run --ignore-scripts --os=linux --cpu=x64 en carpetas temporales que contenían solo sus manifests. Ambos proyectos pasaron además npm ci real en Windows y se regeneró el cliente Prisma sin migraciones.

La instalación emitió advertencias de peer resolution y deprecaciones existentes (ESLint/glob); no se ocultaron. Los peers relevantes fueron comprobados semánticamente sin conflictos, y no se realizaron cambios mayores ajenos al parche de seguridad.

## Resultado de auditoría

| Proyecto | Antes | Después |
|---|---|---|
| Backend | 3 altas, 1 moderada, 6 bajas | 0 altas/críticas/moderadas; 6 bajas transitivas de Jest/deepmerge |
| Frontend | 2 altas, 3 moderadas | 0 vulnerabilidades |

Ambos proyectos deben aprobar el mismo comando npm audit --audit-level=high de CI. No se modificó el workflow ni el umbral y no se añadieron listas de exclusión.

## Verificaciones funcionales y límites

Resultados locales: 443 pruebas backend (39 suites), 294 frontend (33 archivos), 120 de integración aislada (7 suites), typecheck, lint y builds aprobados. Ambos comandos npm audit --audit-level=high devuelven código cero. E2E: 94 pruebas aprobadas en Edge sobre preview local con API simulada, incluidos login, credenciales, sesiones, conductores, pedidos y planificación; anchos 390/768/1366/1440 y límites responsive. El nuevo resultado de GitHub Actions se comunica tras publicar el commit en la PR 8. Las pruebas con escrituras se limitan al esquema aislado `distrirapido_credentials_20261030_test`; no se aplican migraciones ni se modifica public. E2E utiliza API simulada. No se reconstruye ni cambia Docker: las imágenes actualmente desplegadas no incorporan estas nuevas dependencias hasta una actualización futura autorizada.

Antes/después de integración se verificaron conteos y hashes de las ocho tablas public: iguales. Juan conserva su cuenta/ficha activas, rol y vínculo; se mantiene su versión actual de credenciales 1 y hash Argon2id, sin alterar la contraseña. Una sesión antigua almacenada cifrada recibió HTTP401, confirmando revocación existente. No se intentó recuperar la nueva contraseña de Juan ni restablecerla para probar login; la aceptación de contraseña nueva/anterior se prueba con datos sintéticos aislados. La migración de rutas continúa pendiente.

## Siguiente documento / Siguiente trabajo recomendado

Revisar la actualización de la PR 8 y sus ejecuciones de CI. Mantener visible el pendiente bajo de deepmerge/Jest y actualizarlo cuando exista una solución compatible; desplegar imágenes nuevas únicamente con autorización separada. US-013 sigue requiriendo su migración, OSRM privado y prueba vial real.
