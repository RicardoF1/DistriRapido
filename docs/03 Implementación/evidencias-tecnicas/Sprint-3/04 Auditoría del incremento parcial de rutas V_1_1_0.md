# Auditoría del incremento parcial de planificación, OSRM y US-013

Versión: V_1_1_0. Fecha: 2026-10-29. Estado: diagnóstico previo a continuar implementación. No acredita cierre de US-010/011/012/013 ni disponibilidad operativa de rutas reales.

## 1. Alcance y conservación

Se revisó el trabajo interrumpido contra `docs/superpowers/specs/2026-10-29-routing-osrm-design.md` y el respaldo preincremento `.local/routing-increment-20261029-175242/`. Se identificaron exactamente **47 archivos de implementación** nuevos/modificados desde ese respaldo: el inventario al final los enumera individualmente. El plan del incremento es un documento adicional. Los documentos anteriores de integración, Juan y cuentas no se atribuyen a este incremento.

Al comenzar: 40 archivos rastreados modificados y 163 archivos no rastreados, incluyendo trabajos anteriores y carpetas antiguas. Esos 203 archivos no equivalen a 203 cambios de rutas. Se conservaron todos. La rama permanece `main`, HEAD `128af98b7021655c39160a92121087023ed3f931`. No se cambió de rama, hizo staging, commit, push, merge ni se revirtieron archivos.

Durante esta auditoría no se corrigió código, SQL, configuración ni pruebas del producto. Se creó este informe y un arnés/evidencias privados en `.local/routing-audit-20261029/`; los comandos de verificación generaron únicamente sus artefactos habituales ignorados. El preview temporal en 127.0.0.1:5174 se detuvo al terminar; los contenedores existentes permanecieron en ejecución.

## 2. Qué existe y qué falta

| Componente | Estado comprobado |
|---|---|
| Preparación de pedidos y recursos | Código implementado; pruebas unitarias e integración aislada aprobadas. Selecciona pedidos pendientes, vehículo candidato, conductores con disponibilidad y snapshot de datos. No comprobado con flujo operativo real en desarrollo. |
| Origen, orden y finalización | Interfaz y DTO exigen confirmaciones explícitas. E2E simulado del flujo aprobado. No se toma automáticamente la ubicación de Juan. |
| Adaptador OSRM | Implementado con validaciones, timeout, límite de respuesta y sin proveedor público por defecto. Unitarias aprobadas. **No existe prueba con OSRM real configurado.** |
| Persistencia | Siete tablas nuevas con versiones, FK/UNIQUE, ejecución idempotente y cierre transaccional. Integración con PostgreSQL real aprobada en esquema aislado, con cobertura y proveedor sintéticos. |
| US-013 lista/detalle/historial | Implementados y probados con datos sintéticos; GET no genera recorridos. Quedan defectos de versión cero y advertencias incompletas. |
| Leaflet de solo lectura | Implementado y responsive simulado aprobado. Queda inconsistencia al mostrar error de geometría corrupta. |
| Reintento de cálculo | La nueva clave y recuperación de error funcionan en el escenario E2E probado. Otro flujo EN_CURSO→consulta COMPLETADA→edición mantiene un draft incorrecto. |
| Autenticación/Juan | Conservados; acceso real verificado nuevamente. |
| Algoritmo genético/asignaciones | No implementados, según el alcance autorizado. No llamar optimizado al cálculo secuencial. |
| Restablecimiento de contraseñas, etapa 2 | Solo diseño previo; no se implementó ni se añadió su migración. Se mantiene separado. |

## 3. Verificaciones ejecutadas en esta auditoría

Los resultados siguientes proceden de ejecuciones nuevas, no de la sesión interrumpida.

| Verificación | Resultado |
|---|---|
| Backend `npm run typecheck` | Aprobado |
| Backend `npm run lint` | Aprobado |
| Backend `npm run test:coverage` | **393/393 pruebas**, 35 suites aprobadas; statements 90.94%, branches 81.37%, functions 89.60%, lines 94.17%; umbrales existentes cumplidos |
| Backend `npm run build` | Aprobado |
| Frontend `npm run typecheck` | Aprobado |
| Frontend `npm run lint` | Aprobado |
| Frontend `npm run test:coverage -- --pool=forks --maxWorkers=1` | **284 aprobadas, 1 fallida de 285**, 30 archivos de pruebas aprobados y 1 fallido. La ejecución terminó con error; no se declara validada su cobertura final. |
| Frontend `npm run build` | Aprobado. Advertencia: bundle principal 523.81 kB, superior a 500 kB. |
| `prisma validate` | Schema válido |
| `prisma migrate status`, schema public | Detecta correctamente una migración pendiente; exit 1 esperado por ese estado, sin aplicarla |
| `npm run test:integration` | **104/104 pruebas**, 6 suites aprobadas; esquema aislado existente `distrirapido_routing_20261029_test` |
| E2E seleccionados | **25/25 aprobados**, sobre build preview, API simulada: routes, driver-panel, driver-accounts y login-email |
| Permisos con JWT/cookies reales | Cuatro roles comprobados mediante cuentas sintéticas temporales en el esquema aislado; retiradas al terminar |
| Juan en Docker existente | Login real, perfil propio, restauración, cookie HttpOnly, denegación de siete endpoints administrativos y logout aprobados; vistas 390/768/1366/1440 |
| Integridad PostgreSQL público | Las ocho tablas públicas tienen exactamente los mismos conteos y hashes de filas que al inicio del incremento |
| `git diff --check` | Sin errores; aviso previo LF/CRLF en DeliveryMap.test.tsx |
| `node scripts/check-geodata-publication.cjs` | Índice sin derivados geográficos privados |

Los E2E de rutas comprobaron lista/detalle y mapa a 390/768/1366/1440, denegación para Conductor/Auditor, error de migración ausente y flujo de confirmaciones con fallo/reintento simulado de OSRM. No sustituyen una comprobación con un proveedor de recorridos real.

### Fallo unitario frontend identificado

`src/frontend/src/services/routing-api.test.ts`, prueba «conserva semántica de consulta y edición versionada»: `TypeError: Body is unusable: Body has already been read`. El beforeEach entrega el mismo `new Response('{}')` a varias llamadas fetch del mismo test. La primera lectura consume el cuerpo; la siguiente falla. No se observó ese fallo en el transporte real: es un defecto del mock de la prueba. Queda corregirlo tras aprobación para producir una Response nueva por llamada, sin eliminar assertions ni bajar umbrales. **No se corrigió en esta auditoría.**

## 4. Prisma, migración y datos existentes

Archivo nuevo: `src/backend/prisma/migrations/202610290001_planificacion_rutas/migration.sql`. Crea planificaciones, planificaciones_versiones, ejecuciones_calculo, alternativas_ruta, rutas, rutas_versiones y paradas_ruta. Añade FK con RESTRICT y restricciones UNIQUE. La revisión no encontró DELETE, TRUNCATE, DROP de tablas ni escrituras de actualización de registros existentes en ese archivo.

Su carácter aditivo no sustituye la autorización para aplicarla a desarrollo. **No se aplicó ninguna migración durante esta auditoría.**

| Entorno | Estado leído |
|---|---|
| PostgreSQL schema public | 6 migraciones previas aplicadas; `202610290001_planificacion_rutas` pendiente; no existe public.rutas |
| Schema `distrirapido_routing_20261029_test` | 15 tablas, incluyendo las siete nuevas; ya aprovisionado antes de la auditoría, usado exclusivamente para las pruebas |
| Schema `distrirapido_integration_20261029_test` | 8 tablas; conservado |

Public conserva: 4 usuarios, 2 conductores, 2 pedidos, 2 clientes, 4 roles, 0 vehículos, 0 disponibilidades y 6 registros de migración. Se compararon SHA-256 del contenido completo de las ocho tablas antes/después, no solo los conteos. Esto incluye hashes de contraseña y vínculo de Juan sin exponerlos.

El respaldo preincremento `before-routing.dump` permanece privado bajo `.local/routing-increment-20261029-175242/`. `.env` y la credencial cifrada de Juan coinciden con sus hashes protegidos anteriores. No se tocaron volúmenes, bases de otros proyectos, ni recursos INEI.

## 5. Seguridad, autenticación y permisos

No hay cambios del incremento en `src/backend/src/auth`. LoginForm, sus pruebas, DriverAccessPage y DriverProfileService coinciden por hash con el respaldo anterior al incremento. Las modificaciones visibles de login/cuentas en el diff general pertenecen a trabajos anteriores preservados.

En código nuevo: PlanningGuard permite únicamente Administrador y Operador / Técnico. Los controladores de planning/routes usan JwtAuthGuard; las mutaciones de planificación también RequestOriginGuard. CORS conserva origen explícito y agrega Idempotency-Key como cabecera permitida. No se implementó autenticación paralela.

Se ejecutó un arnés de auditoría con Nest/Prisma reales, JWT/cookies reales y cuatro usuarios sintéticos temporales, únicamente en schema de pruebas. Cada rol usó un cookie jar independiente:

| Rol | Login | GET /routes | POST /planning sin DTO válido |
|---|---:|---:|---:|
| Administrador | 200 | 200 | 400 por validación |
| Operador / Técnico | 200 | 200 | 400 por validación |
| Usuario Final / Conductor | 200 | 403 | 403 |
| Auditor Externo | 200 | 403 | 403 |

El 400 para Administrador/Operador no representa una creación exitosa: demuestra que se permitió el rol y después se rechazó el DTO vacío. Las escrituras de las pruebas de integración y del arnés no afectaron public. Juan no participó en altas o cambios; solo login/lecturas/logout sobre su cuenta existente.

## 6. Sesiones y prueba de dos roles

La sesión usa `distrirapido_session_v2`, cookie HttpOnly, SameSite=Lax, path=/; la marca Secure depende de HTTPS. El frontend usa `credentials: include`. Las pestañas del mismo perfil comparten la cookie del mismo host; los puertos 5173/3000 no crean sesiones separadas por pestaña.

Iniciar sesión como otro usuario en el mismo perfil reemplaza la cookie compartida. Cerrar sesión elimina esa cookie y afecta a las demás pestañas. La memoria React puede mostrar momentáneamente información previa hasta revalidar; AuthProvider ya revalida al foco/visibilidad y el backend autoriza cada petición con la sesión actual. No se propone separar sesiones por pestaña.

El correo recordado en sessionStorage es solo un borrador de login, no una sesión ni una contraseña. No debe usarse para decidir permisos. No se guardaron contraseñas ni JWT en localStorage para esta auditoría.

Procedimiento manual recomendado:

1. Perfil de navegador A: iniciar como Administrador y abrir gestión/rutas.
2. Perfil B distinto, o navegador distinto: iniciar con la cuenta existente de Juan; comprobar su panel y denegación de funciones administrativas.
3. Mantener cookies y sesiones separadas por perfil. Dos ventanas de incógnito del mismo contexto pueden compartir cookies; no asumir que equivalen a perfiles independientes.
4. En Playwright, crear dos browser.newContext separados, no dos page del mismo context. Mantener las credenciales en memoria y sin incluirlas en capturas, trazas o informes.

## 7. Hallazgos y pendientes priorizados

### P1 — verificación/CI bloqueados

1. **Prueba frontend fallida:** mock de Response consumida, descrito en sección 3. Impide afirmar todas las pruebas/CI aprobadas.
2. **Prueba de integración incompatible con configuración CI actual:** `src/backend/test/routing.integration.ts` exige un schema con patrón `distrirapido_*_test`. El workflow `.github/workflows/ci.yml` utiliza una base `distrirapido_test` sin parámetro schema. Esa configuración válida para otras suites sería rechazada por la nueva antes de inicializar Prisma. Debe armonizarse el criterio de aislamiento o el entorno de CI sin permitir public de desarrollo. Hallazgo estático; no se ejecutó GitHub Actions ni se publicó nada.

### P2 — defectos funcionales que deben corregirse antes de aceptar el incremento

3. **Versión cero devuelve la versión más reciente:** `src/backend/src/routes/routes.controller.ts`, endpoint versions con ParseIntPipe, acepta 0. `routes.service.ts` usa `version ? filtro : undefined`; 0 omite filtro y devuelve otra versión. Debe rechazarse explícitamente una versión no positiva.
4. **Draft obsoleto tras completar mediante consulta de estado:** `PlanningPage.tsx`, refresh actualiza result pero no limpia draft. Tras EN_CURSO→GET COMPLETADA, editar/preparar intenta PATCH de planificación con alternativa persistida, que el backend rechaza. Debe iniciar otra planificación cuando corresponde y preservar el historial.
5. **Advertencias de histórico incompletas:** `routes.service.ts` compara estado del pedido y dirección/coordenadas. No identifica cambios posteriores de peso/volumen/ventanas, cliente inactivo, vehículo o disponibilidad del conductor previstos en el diseño. La revalidación al generar sí existe; esta carencia afecta a la información posterior mostrada.
6. **Geometría corrupta sin aviso:** `RouteMap.tsx` retorna al detectar coordenadas inválidas, pero el booleano que decide mostrar el error solo comprueba tipo y longitud. Una LineString con dos puntos inválidos puede dejar mapa vacío sin mensaje. Debe existir una única validación compartida entre render y efecto.
7. **Plazo total de operación incompleto:** se comprueba el deadline de 20 segundos antes del cierre transaccional, pero el cierre permite 10 segundos adicionales y solo verifica lease de 60 segundos. Existe una ruta de publicación posterior al presupuesto; falta verificar plazo restante dentro del cierre. No se simuló una transacción lenta para medirlo en esta auditoría.

### Pendientes contractuales/de despliegue

8. La exclusión de cálculos concurrentes es local a una instancia; el primer despliegue debe mantenerse mono-instancia como exige el diseño. No desplegar varias réplicas prometiendo cupo global.
9. La limitación vigente es por IP, no el límite específico por usuario propuesto. Definir pruebas sin desactivar protección existente.
10. Timeout de 10 s y snapping de 100 m están fijados en el módulo; no se guardan todos los parámetros de ajuste en la procedencia. La URL se valida al calcular, sin allowlist explícita de hosts autorizados. No hay URL controlada por el navegador ni redirecciones habilitadas, pero falta cerrar esa parte del contrato y la autorización del proveedor.
11. El Compose actual no transmite OSRM_BASE_URL/PROFILE/DATA_REVISION al backend. No se modificó Compose en esta auditoría. Falta el procedimiento/configuración de despliegue aprobado del proveedor.
12. Falta el informe final de implementación y actualizar el checklist del plan con resultados verificados. Los documentos históricos y el diseño de reset no deben reescribirse como parte de ese cierre.

## 8. Bloqueos para recorrido real en navegador

- **Migración de desarrollo pendiente:** no hay tablas de rutas en public, y no existe autorización para aplicarla ahora.
- **Proveedor real ausente:** no hay OSRM_BASE_URL local configurado; no se envió información de clientes a un demo ni se levantó un servicio nuevo.
- **Recursos reales insuficientes:** desarrollo contiene 0 vehículos y 0 disponibilidades; ser ACTIVO no hace disponible a Juan. No se crearán esos recursos sin autorización.
- **Servicios Docker ejecutan la versión anterior:** no se reconstruyeron durante esta auditoría. GET /routes del backend actualmente desplegado devuelve 404; los permisos de la fuente nueva se probaron en Nest aislado, no se confunden con el contenedor anterior.

Por tanto, el incremento **no está terminado ni habilitado de extremo a extremo con recorridos reales**. La persistencia probada usa PostgreSQL real, pero el proveedor/cobertura de esas pruebas son sintéticos e inyectados solo allí. No afirmar prueba real de OSRM, optimización genética ni asignaciones disponibles.

## 9. Propuesta para continuar, todavía no ejecutada

1. Corregir la prueba Response y compatibilidad CI, manteniendo umbrales y aislamiento.
2. Añadir pruebas RED para versión cero, draft tras refresh, geometría corrupta, advertencias y plazo de cierre; corregir los casos aprobados.
3. Completar configuración/procedencia y documentación de OSRM, con servidor privado/autorizado y despliegue mono-instancia inicial.
4. Repetir suites/cobertura y revisión; preparar revisión específica de SQL. Solo con autorización adicional aplicar migración a desarrollo con respaldo verificable.
5. Acordar cómo disponer de recursos/pedidos operativos válidos sin alterar registros actuales automáticamente. Probar OSRM real con puntos autorizados y después, con permiso de escritura, un flujo real de aplicación.

El restablecimiento de contraseñas de conductores sigue en su etapa 2 independiente: diseño previo pendiente de autorización, sin endpoint, versión de credenciales o migración implementados. No mezclarlo en estos cambios.

## 10. Inventario individual de los 47 archivos

Estados: **base** = implementado, con los límites/hallazgos de este informe; **prueba** = ejecutada según sección 3; **pendiente** = requiere corrección o habilitación. Ningún estado significa aprobación funcional final.

| # | Archivo | Estado y observación |
|---:|---|---|
| 1 | src/backend/prisma/schema.prisma | Base válida; siete modelos nuevos, sin cambios de credenciales. |
| 2 | src/backend/src/app.module.ts | Base; registra PlanningModule. |
| 3 | src/backend/src/common/configure-app.ts | Base; CORS con Idempotency-Key. |
| 4 | src/backend/src/common/http-exception.filter.ts | Base; conserva code/ejecución sanitizados para routing. |
| 5 | src/backend/src/coverage/coverage.service.ts | Base; assertAvailable reutilizable, regresiones aprobadas. |
| 6 | src/frontend/playwright.mock.config.ts | Base; allowlist de E2E nuevas. |
| 7 | src/frontend/src/layouts/AppLayout.tsx | Base; navegación administrativa de rutas. |
| 8 | src/frontend/src/routes/AppRoutes.tsx | Base; rutas nuevas sin reemplazar el panel de Juan. |
| 9 | src/frontend/src/routes/ProtectedRoute.tsx | Base; restricción a roles operativos. |
| 10 | src/frontend/src/services/api.ts | Base; errores routing y ejecución, cookies existentes. |
| 11 | src/frontend/src/styles/app.css | Base; responsive y marcadores de consulta. |
| 12 | src/backend/prisma/migrations/202610290001_planificacion_rutas/migration.sql | Pendiente en desarrollo; aplicada previamente solo en pruebas. |
| 13 | src/backend/src/planning/dto/planning.dto.ts | Base; IDs, límites y tres confirmaciones. |
| 14 | src/backend/src/planning/planning-data.spec.ts | Prueba aprobada. |
| 15 | src/backend/src/planning/planning-data.ts | Base; fuentes/cobertura/bloqueos/volúmenes. |
| 16 | src/backend/src/planning/planning-domain.spec.ts | Prueba aprobada. |
| 17 | src/backend/src/planning/planning-domain.ts | Base; huella, evaluación de jornada/atención/capacidad. |
| 18 | src/backend/src/planning/planning.controller.ts | Base; DTO, rol, origen e idempotencia. |
| 19 | src/backend/src/planning/planning.guard.ts | Base; roles comprobados con JWT real aislado. |
| 20 | src/backend/src/planning/planning.http.spec.ts | Prueba aprobada con identidad simulada. |
| 21 | src/backend/src/planning/planning.module.ts | Pendiente configurar/procedencia de proveedor. |
| 22 | src/backend/src/planning/planning.service.spec.ts | Prueba aprobada; ampliar casos de auditoría. |
| 23 | src/backend/src/planning/planning.service.ts | Base; pendiente plazo total/límite por usuario. |
| 24 | src/backend/src/routes/dto/route-query.dto.ts | Base; filtros y paginación. |
| 25 | src/backend/src/routes/routes.controller.ts | Pendiente validación positiva de versión. |
| 26 | src/backend/src/routes/routes.service.spec.ts | Prueba aprobada; faltan casos detectados. |
| 27 | src/backend/src/routes/routes.service.ts | Pendiente versión cero/avisos históricos. |
| 28 | src/backend/src/routing/osrm.adapter.spec.ts | Prueba aprobada con respuestas sintéticas. |
| 29 | src/backend/src/routing/osrm.adapter.ts | Base; sin verificación contra OSRM real. |
| 30 | src/backend/test/routing.integration.ts | Prueba local aislada aprobada; pendiente compatibilidad CI. |
| 31 | src/frontend/e2e/routes.spec.ts | Ocho E2E simulados aprobados. |
| 32 | src/frontend/src/features/routes/OriginPicker.test.tsx | Prueba aprobada. |
| 33 | src/frontend/src/features/routes/OriginPicker.tsx | Base; reutiliza Photon/mapa sin alterar pedidos. |
| 34 | src/frontend/src/features/routes/RouteMap.test.tsx | Prueba aprobada; ampliar geometrías corruptas. |
| 35 | src/frontend/src/features/routes/RouteMap.tsx | Pendiente unificar validación y mensaje de geometría. |
| 36 | src/frontend/src/layouts/RoutesLayout.tsx | Base; encabezado y navegación de rutas. |
| 37 | src/frontend/src/pages/PlanningPage.test.tsx | Prueba aprobada; ampliar refresh→completada. |
| 38 | src/frontend/src/pages/PlanningPage.tsx | Base; pendiente draft tras consulta de estado. |
| 39 | src/frontend/src/pages/RouteDetailPage.tsx | Base; historial/métricas/avisos de solo lectura. |
| 40 | src/frontend/src/pages/RoutesPage.tsx | Base; lista, búsqueda, estados y paginación. |
| 41 | src/frontend/src/pages/routes.test.tsx | Prueba aprobada. |
| 42 | src/frontend/src/services/planning-api.ts | Base; prepare/update/calculate/estado. |
| 43 | src/frontend/src/services/routes-api.ts | Base; consultas e historial. |
| 44 | src/frontend/src/services/routing-api.test.ts | Pendiente: una prueba falla por Response reutilizada. |
| 45 | src/frontend/src/test/route-fixture.ts | Fixture sintético, solo pruebas. |
| 46 | src/frontend/src/types/planning.ts | Base; contratos frontend compilados. |
| 47 | src/frontend/src/types/routes.ts | Base; contratos frontend compilados. |

## Siguiente documento / Siguiente trabajo recomendado

Revisar este diagnóstico y aprobar por separado la corrección del incremento parcial. Hasta entonces no continuar implementación ni aplicar migraciones. Mantener el reset de contraseñas como trabajo independiente con su autorización propia.
