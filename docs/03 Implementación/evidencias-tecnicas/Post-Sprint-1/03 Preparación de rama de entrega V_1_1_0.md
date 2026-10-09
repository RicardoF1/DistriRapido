# Preparación de rama de entrega Post-Sprint 1

Proyecto: DistriRapido / EcoRuta Huancayo. Versión documental: V_1_1_0. Fecha: 2026-10-08, America/Lima.

## Resultado y límite de esta preparación

**No se creó ni se cambió de rama.** La base remota reorganizó el código en src/frontend y src/backend, mientras los cambios locales siguen en frontend y backend. Trasladar las mejoras exige reconciliación de rutas y contenido. La instrucción del usuario exige presentar primero el plan y esperar autorización para worktree, stash, rebase u otra operación compleja. No se creó una rama con base incorrecta, no se intentó forzar el checkout y no se usó stash ni commit temporal.

Solo se actualizaron referencias remotas mediante git fetch origin y se creó este informe. No se modificaron archivos existentes, backend, Prisma, Docker, PostgreSQL ni datos. No se accedió a Optica_Banglor.

## Estado de Git verificado

| Elemento | Resultado |
| --- | --- |
| Rama inicial y final | codex/sprint-1-auth-users-orders |
| HEAD | 33d6139e6404f70e12c76a6111f51245f24057db |
| main local | 968f8924de92f8d6019f3fd664317981b7ca21de |
| origin/main consultado y obtenido | 1aaa7251789ca92e0034b81290ec6eba6f2ab4a8 |
| main frente a origin/main | 0 commits exclusivos locales, 5 por detrás |
| HEAD frente a origin/main | 0 commits exclusivos locales, 2 por detrás |
| HEAD frente a su upstream | 0 por delante, 0 por detrás |
| Commits locales no publicados entre ramas locales y referencias remotas obtenidas | Ninguno |
| Rama solicitada feature/post-sprint1-ui-geocoverage | No existe local ni remotamente en la consulta realizada |
| Sprint 1 integrado | Sí: HEAD es antecesor de origin/main; merge 43f9e9d, PR #2 |
| Cambio estructural posterior | 1aaa725, PR #3: traslado a src/frontend y src/backend |
| Índice | Vacío; nada preparado para commit |

Antes de fetch, origin/main local era fe0779a y main aparecía un commit por delante; esas referencias estaban desactualizadas y no demostraban el estado real de GitHub. El acceso remoto se verificó con ls-remote, sin escrituras en GitHub. No se actualizó la rama main local ni el árbol de trabajo.

La reorganización también modificó README, .gitignore, compose, CI, scripts de backend, Vite, index.html y nginx. Deben conservarse esos cambios remotos; copiar directorios antiguos completos encima del nuevo main sería incorrecto.

## Inventario y conservación

Se identificaron **66 archivos pendientes preexistentes: 27 modificados y 39 nuevos**. Los 54 archivos del informe 01 siguen disponibles. Hay 12 adicionales del incremento autorizado de indicadores reales: seis backend, cinco frontend nuevos y el informe 02. Cuatro archivos compartidos ya figuraban en la lista anterior y contienen también ajustes de indicadores.

Este informe añade un archivo: inventario propuesto **67 archivos**, sin staging. Se compararon SHA-256 de los 66 archivos previos antes y después de esta preparación, sin diferencias. El inventario temporal de hashes se guarda fuera del repositorio y no contiene contenidos de archivos ni credenciales. La comprobación no es una copia de respaldo recuperable.

No se trasladó, eliminó ni sobrescribió contenido. Los ignorados permanecen en su ubicación: .env; backend/.local/ (incluye PostgreSQL local, configuración y logs); node_modules; dist; coverage de tests; frontend/test-results. La ausencia de cambios de rama preserva también estos recursos. No se escanearon ni copiaron los contenidos de bases locales o archivos de entorno. Ningún GeoJSON canónico está ignorado por la configuración local vigente.

## Lista exacta y clasificación propuesta

Las rutas siguientes son **las rutas locales actuales**. Una entrega basada en main debe mapear frontend/ a src/frontend/ y backend/ a src/backend/. Las rutas de docs/ y geodata/ permanecen en la raíz. Estos destinos son una propuesta, no archivos movidos ni un staging final.

**Archivos listos para commit ahora: ninguno**, porque primero hay que reconciliar la base y verificar el resultado. Se separa la selección por contenido para hacer la revisión concreta.

### Candidatos sin incidencia particular de contenido (49 archivos)

Son mejoras relacionadas con la entrega. Requieren el traslado autorizado cuando corresponda, pruebas sobre la nueva base y aprobación. Incluyen los indicadores administrativos ya autorizados; no son cambios accidentales de otro proyecto.

```text
backend/src/admin/admin-summary.controller.ts
backend/src/admin/admin-summary.dto.ts
backend/src/admin/admin-summary.service.ts
backend/src/admin/admin-summary.spec.ts
backend/src/admin/admin.module.ts
backend/src/app.module.ts
docs/03 Implementación/evidencias-tecnicas/Post-Sprint-1/01 Verificación y entrega V_1_1_0.md
docs/03 Implementación/evidencias-tecnicas/Post-Sprint-1/02 Resumen administrativo V_1_1_0.md
docs/03 Implementación/evidencias-tecnicas/Post-Sprint-1/03 Preparación de rama de entrega V_1_1_0.md
frontend/e2e/admin-summary.spec.ts
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
frontend/src/features/admin/AdminSummary.test.tsx
frontend/src/features/admin/AdminSummary.tsx
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
frontend/src/services/admin-api.test.ts
frontend/src/services/admin-api.ts
frontend/src/services/geocoding.test.ts
frontend/src/services/geocoding.ts
frontend/src/styles/app.css
geodata/FRONTEND-INTEGRATION.md
geodata/MARKER-SYNC.md
geodata/README.md
geodata/coverage.ts
geodata/tools/prepare_coverage.py
```

### Revisión específica obligatoria (18 archivos)

Los nueve archivos de geodata/coverage/v1 requieren aclarar redistribución INEI. La imagen requiere documentar procedencia de publicación; fue aportada por el usuario y se preserva intacta. .gitignore y README deben reconciliar cambios remotos, y los documentos vigentes deben incorporar el incremento de indicadores. Los archivos de configuración/importación necesitan corregir rutas hacia geodata al trasladar frontend un nivel adicional.

```text
.gitignore
README.md
docs/03 Implementación/05 Mejoras posteriores al Sprint 1 V_1_1_0.md
frontend/README.md
frontend/src/assets/login-landscape.png
frontend/src/services/coverage.test.ts
frontend/src/services/coverage.ts
frontend/src/test/setup.ts
frontend/vitest.config.ts
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

No publicar una entrega incompleta excluyendo el GeoJSON que frontend importa. El permiso de redistribución y una distribución reproducible deben resolverse antes de esa publicación. La lista final de staging tendrá que regenerarse en la nueva base; no usar esta lista de rutas antiguas literalmente allí.

### Excluir

- .env y cualquier configuración secreta, incluidas backend/.local/*.env.
- backend/.local/ completo, en particular postgres/, configuración y logs de base local.
- backend/node_modules/, frontend/node_modules/.
- backend/dist/, frontend/dist/.
- backend/coverage/, frontend/coverage/.
- frontend/test-results/, playwright-report/ y temporales.
- Fuentes INEI originales RAR/GPKG, claves privadas y archivos de otros proyectos.
- El inventario temporal de conservación fuera del repositorio.

Los 67 candidatos no contienen esas rutas ni bases de datos. No se incluyen archivos que representen nuevas dependencias instaladas.

## Documentación revisada

README.md, frontend/README.md, geodata/README.md, FRONTEND-INTEGRATION.md, MARKER-SYNC.md, el addendum 05 V_1_1_0 y los informes 01 y 02 V_1_1_0. Los títulos/versiones oficiales se conservan. Los informes históricos del Sprint 1 no presentan diferencias locales.

Se verifican descripciones de responsive, login, formulario único, Leaflet/OSM/Photon, cinco distritos, límites administrativos v1.0.0, filtro exterior, marcador magenta y zoom 17. El informe 02 describe correctamente GET /admin/summary y sus resultados posteriores.

**Desactualizaciones detectadas:** README principal aún dice que no hay indicadores/endpoints nuevos; frontend/README dice que los indicadores están pendientes; el addendum 05 afirma que no hay cambios backend/API y mantiene indicadores entre lo planificado. Eso era correcto al escribirlos, pero el incremento posterior lo cambió. El informe 01 es una fotografía de 54 archivos, no el inventario actual. No se sobrescribieron esos documentos en esta fase; hay que reconciliar sus secciones vigentes con el informe 02 y la nueva estructura, sin atribuir resultados nuevos al cierre histórico.

Todos los Markdown nuevos o anteriormente actualizados conservan Siguiente documento / Siguiente trabajo recomendado. Este informe también la incluye. Las referencias y comandos que mencionan frontend/backend deberán adaptarse durante el traslado; los textos históricos pueden mantener sus rutas de fase con una aclaración.

## Pendientes técnicos y seguridad

1. OrdersService.create **no valida polígonos GeoJSON antes de crear registros**. La validación frontend no cierra esa protección; el endpoint de indicadores no la implementa. No se modifica aquí.
2. Docker local usa contextos ./frontend y ./backend; el main actualizado usa ./src/frontend y ./src/backend. Ninguno incluye geodata raíz en esos contextos. La futura validación de backend tampoco podría cargarlo sin empaquetado adicional. Propuesta: contexto de repositorio con COPY selectivos y compilación de política compartida, o artefacto versionado con bytes/hash canónicos. No duplicar manualmente límites. Docker no se modifica en esta fase.
3. INEI: se conserva origen https://ide.inei.gob.pe/, etiqueta actualizado al 2023, consulta 2026-10-08, WGS84/EPSG:4326, metadato interno gpkg_last_change y permiso de redistribución no aclarado. No se presume licencia libre. Revisión afecta al paquete de nueve archivos listado arriba.
4. Nueva estructura: ../../../geodata desde servicios/tests de frontend dejaría de apuntar a la raíz; vitest necesita ../../geodata desde su configuración. El .gitignore debe conservar LEVANTAR.md de main y cambiar las rutas de informes de cobertura sin ocultar el paquete canónico. No se aplican estos cambios hasta autorización.
5. Escaneo por patrones sobre los 66 archivos visibles previos: sin coincidencias de claves privadas, tokens GitHub, claves AWS ni claves OpenAI. No es una auditoría de todo el historial ni prueba absoluta de ausencia de secretos. Fixtures identificados como sintéticos usan example.com; no se consultaron datos personales reales.

## Verificaciones de esta fase

Ejecutadas: status completo/corto, branch -vv, log, remote -v, diff --stat y --name-status; inventarios de nuevos/ignorados; ls-remote y fetch; comparación de divergencias y ancestros; revisión del commit estructural y archivos relevantes de origin/main; diff --check; comparación de los 54 archivos originales contra el inventario actual; hash de conservación; ocho hashes geográficos del manifiesto; UBIGEO, MultiPolygon, provincia HUANCAYO y departamento JUNIN; revisión documental y escaneo por patrones. Sin errores de integridad. diff --check pasó, con avisos normales LF/CRLF.

**No se ejecutaron nuevas pruebas unitarias, E2E, lint, typecheck o builds en esta fase**, porque no se cambió código ni se trasladó la aplicación. No se ejecutó Docker ni se tocó PostgreSQL.

Antecedentes, no nuevas ejecuciones: informe 01 registra frontend 197, backend 181 y E2E 76 con API simulada. El incremento de indicadores del informe 02 registra frontend 214 en suite completa antes del último ajuste, 40 relacionadas revalidadas después, backend 194 y E2E 30 simuladas, con lint/typecheck/build correctos y lectura agregada real. Son ejecuciones distintas; no sumar los E2E como una suite completa actual. Habrá que verificar de nuevo la base reorganizada después de adaptar las mejoras.

## Plan seguro que requiere autorización

1. Mantener este checkout y todos sus archivos, incluidos ignorados, intactos como origen del trabajo.
2. Crear un worktree separado, en C:/Users/HP/Desktop/DistriRapido/.delivery-worktrees/post-sprint1-ui-geocoverage (ruta comprobada como inexistente), con la rama **feature/post-sprint1-ui-geocoverage** basada exactamente en origin/main actualizado. La ruta del worktree debe excluirse localmente del inventario del checkout original, sin cambiar .gitignore publicado. No crear otra rama ni usar prefijo codex/.
3. Trasladar únicamente los cambios inventariados, con frontend → src/frontend y backend → src/backend; conservar los archivos nuevos. Reconciliar por comparación de tres versiones (HEAD 33d6139, archivo local, origin/main) los archivos compartidos. No copiar .env, PostgreSQL local, dependencias, logs ni directorios completos encima de main.
4. Adaptar importaciones/configuración hacia geodata y documentación vigente; conservar scripts, CI, Vite, nginx, Docker y configuración de entorno de main. Cualquier cambio de Docker requerirá alcance autorizado aparte. Si hay conflictos que demandan decisiones funcionales, detenerse y presentar diferencias.
5. Confirmar que el original conserva sus hashes y que cada mejora tiene destino; ejecutar lint, typecheck, pruebas, builds y E2E seguras en la nueva estructura. Regenerar la lista exacta con sus rutas finales y estado de permisos de publicación. Sin commit ni push.

Este plan necesita autorización expresa porque el texto recibido dice: «Si se necesita un rebase, cherry-pick, stash, worktree u otra operación compleja, presentar primero el plan y esperar mi autorización». No se trata de un rechazo automático de herramientas.

## Mensaje de commit sugerido y publicación futura

```text
feat: improve post-sprint1 UI, admin metrics and delivery geocoverage
```

El mensaje incluye indicadores/backend existentes, además de UI y geodata; un mensaje exclusivamente frontend omitiría ese alcance.

Después de autorizar y terminar el plan: resolver redistribución, empaquetado y documentación; aprobar la lista final; hacer staging explícito solo de los archivos aprobados; revisar git diff --cached y checks; autorizar commit y push de feature/post-sprint1-ui-geocoverage por separado. Un PR o merge requiere autorización adicional. Nada de ello se ejecutó en esta preparación.

## Siguiente documento / Siguiente trabajo recomendado

Autorizar la reconciliación en worktree separado sobre origin/main para conservar el checkout original y la reorganización remota. Después elaborar la evidencia de pruebas y selección definitiva de archivos sobre esa base antes de cualquier publicación.
