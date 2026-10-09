# 05. Validación backend y empaquetado V_1_1_0

## Control documental

| Campo | Valor |
|---|---|
| Proyecto | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| Repositorio / interfaz | DistriRapido / EcoRuta Huancayo |
| Versión / fecha | V_1_1_0 / 2026-10-09, America/Lima |
| Worktree exclusivo | C:\Users\HP\Desktop\DistriRapido\.delivery-worktrees\post-sprint1-ui-geocoverage |
| Rama | feature/post-sprint1-ui-geocoverage |
| HEAD / base origin/main utilizada | 1aaa7251789ca92e0034b81290ec6eba6f2ab4a8 |
| Estado | Implementación y pruebas locales realizadas; Docker backend e inspección de imágenes pendientes por fallo del motor; revisión y publicación pendientes |

Fase autorizada posterior a la reconciliación y al cierre del Sprint 1. No incorpora historias de Sprint 2. No modifica Prisma, SQL, migraciones, PostgreSQL, JWT, cookies ni RBAC. No se realizaron commits, push, merge ni Pull Requests. Los informes históricos del Sprint 1 y evidencias 01–04 conservan sus bytes.

## Archivos creados o modificados

Comparación con la instantánea previa de los 69 archivos reconciliados y archivos rastreados que antes no tenían cambios. Rutas relativas al worktree exclusivo anterior; no incluye cambios anteriores intactos ni artefactos generados.

- .dockerignore
- .gitignore
- README.md
- docker-compose.migrations.yml
- docker-compose.yml
- docs/03 Implementación/05 Mejoras posteriores al Sprint 1 V_1_1_0.md
- docs/03 Implementación/evidencias-tecnicas/Post-Sprint-1/05 Validación backend y empaquetado V_1_1_0.md
- geodata/FRONTEND-INTEGRATION.md
- geodata/README.md
- geodata/coverage-release.json
- scripts/check-geodata-publication.cjs
- scripts/geodata-tools.test.cjs
- scripts/provision-coverage.cjs
- src/backend/Dockerfile
- src/backend/README.md
- src/backend/eslint.config.mjs
- src/backend/jest.config.cjs
- src/backend/package.json
- src/backend/scripts/prepare-coverage.cjs
- src/backend/src/coverage/coverage.service.spec.ts
- src/backend/src/coverage/coverage.service.ts
- src/backend/src/orders/order-consultation.spec.ts
- src/backend/src/orders/order-coverage.spec.ts
- src/backend/src/orders/orders.controller.ts
- src/backend/src/orders/orders.module.ts
- src/backend/src/orders/orders.service.ts
- src/backend/src/orders/orders.spec.ts
- src/frontend/Dockerfile
- src/frontend/README.md
- src/frontend/src/services/api.test.ts
- src/frontend/src/services/api.ts
- src/frontend/src/services/coverage.test.ts
- src/frontend/src/services/coverage.ts

Artefactos reproducibles ignorados por Git: `src/backend/src/coverage/generated/coverage.ts` y `release.ts`. Los nueve archivos de `geodata/coverage/v1/` permanecen intactos en disco y se excluyen expresamente de Git. No se editaron la política canónica `geodata/coverage.ts`, `prepare_coverage.py`, mapa, Photon, formularios, login ni panel en esta fase. Los ajustes funcionales frontend se limitan al anclaje del manifiesto aprobado y el mensaje HTTP 503.

## Arquitectura de validación

1. `geodata/coverage-release.json` fija versión 1.0.0, cinco UBIGEO y ocho hashes del manifiesto aprobado. No contiene geometrías y expresa `publicReleaseAllowed: false`.
2. `geodata/coverage.ts` es la única implementación mantenida de las reglas geométricas. `src/backend/scripts/prepare-coverage.cjs` copia sus bytes exactos y genera metadatos TypeScript desde el release. Build, typecheck, test, test:coverage, test:integration y start:dev ejecutan esta preparación. No editar artefactos manualmente; si cambia la fuente durante desarrollo, repetir la preparación.
3. `CoverageService` compara versión, distritos y tabla de hashes con metadatos compilados; verifica los ocho recursos, incluida la cobertura combinada, y valida estructura, UBIGEO, distrito, provincia HUANCAYO y departamento JUNIN.
4. Carga un snapshot local al iniciar el módulo. Si falla, registra advertencia y deja cobertura indisponible: login/consulta continúan, pero nuevas altas responden 503. No consulta servicios externos ni descarga datos. Una recarga fallida invalida el snapshot previo.
5. `OrdersService.create` conserva validaciones/horarios y valida las coordenadas **antes de Prisma.$transaction**. Solo un punto aprobado llega a la transacción; se persiste exactamente ese punto. El rechazo no crea clientes/pedidos ni inicia transacción.

La integridad se comprueba al cargar, sin leer archivos en cada petición. Después de aprovisionar otra versión aprobada, reiniciar controladamente para verificarla; no hay aceptación automática de paquetes alternativos ni recarga de archivos externos.

### Distritos y reglas compartidas

| UBIGEO | Distrito |
|---|---|
| 120101 | Huancayo |
| 120107 | Chilca |
| 120114 | El Tambo |
| 120119 | Huancán |
| 120125 | Pilcomayo |

Sapallanga, San Agustín de Cajas, Sicaya, Jauja y cualquier punto exterior quedan excluidos. Se preservan límites administrativos completos sin recortes rurales ni simplificación.

Polygon/MultiPolygon y huecos: bordes exteriores y de huecos aceptados, interiores de huecos excluidos, etiqueta del menor UBIGEO en bordes compartidos. Tolerancia numérica existente: 1e-12 grados, sin buffer operativo. Frontend redondea a seis decimales; API exige números finitos, rangos válidos y hasta seis decimales, conforme al DTO existente. Rechaza precisión excesiva en lugar de mover silenciosamente el destino. Geometrías sin redondear.

Hashes SHA-256:

- Cobertura combinada: `ac5f8b3366d5e028e5acf51e74dfcea18ab0a8db1edbcf1cc6236c9634afd33b`.
- Política canónica y copia generada exacta: `f6fa622af14747468e9f37206f83c2f9ee6e12de2e54ccf7a4d3f92edf59f1db`.

Los nueve hashes de la instantánea previa se conservan, incluido manifiesto. Se preservan la fuente INEI, consulta 2026-10-08, etiqueta «Actualizado al 2023», last_change interno de 2026 y limitaciones de redistribución. No se interpreta last_change como vigencia administrativa a 2026. La validación estructural/hash de esta fase no sustituye la comprobación topológica original Shapely/GEOS ni acredita precisión cartográfica adicional.

### Contratos HTTP

| Código | Condición | Efecto |
|---|---|---|
| 201 | Payload, rol y punto válidos | Continúa contrato existente de creación. |
| 400 | Coordenadas inválidas, precisión excesiva, exterior u otras validaciones existentes | Sin transacción de creación. |
| 503 | Cobertura sin cargar, recurso ausente, manifiesto incompatible o hash inválido | Sin transacción; mensaje comprensible. |
| 401 / 403 | Sesión ausente/inválida o rol no autorizado | Guards existentes; sin escritura. |

400/503 se mantienen mediante BadRequestException/ServiceUnavailableException de NestJS. Swagger los documenta. Sin endpoints nuevos ni campos adicionales. Frontend muestra mensaje específico para 503; 400 conserva el mensaje general de revisión de campos. Formato de error NestJS, sin nuevo código de aplicación ni exposición de rutas privadas.

## Aprovisionamiento privado y redistribución

No se equipara acceso institucional gratuito con permiso de republicación. No se publican derivados ni imágenes que los incorporen. Un clon público sin recursos privados no puede construir/desplegar completamente esta funcionalidad.

Desde raíz:

```sh
node scripts/provision-coverage.cjs --source "/directorio/privado/autorizado/v1"
node scripts/provision-coverage.cjs
node scripts/check-geodata-publication.cjs
```

Origen: paquete aprobado de nueve archivos obtenido bajo acceso privado/autorizado. El script verifica manifiesto y ocho hashes; comprueba todas las colisiones antes de escribir, copia únicamente recursos ausentes y no sobrescribe bytes distintos. Sin --source solo verifica. No descarga ni transforma geometrías. Para reconstrucción institucional, seguir `geodata/tools/prepare_coverage.py` en copia temporal según geodata/README y comparar hashes; una descarga diferente no se adopta automáticamente.

El guard inspecciona archivos rastreados/en el índice y bloquea coverage/v1 y extensiones geográficas conocidas mientras no exista autorización documentada. Ejecutarlo después de cualquier selección manual de archivos. Sus pruebas preparan índices Git temporales aislados: no hacen git add sobre este worktree ni crean commits. No impide una publicación manual de imágenes fuera de Git ni sustituye revisión de licencia.

Excluir de publicación `geodata/coverage/v1/*`, RAR/GPKG originales e imágenes privadas. No seleccionar .env, node_modules, dist, informes de cobertura, artefactos generados ni temporales. Metadatos y política sin polígonos son separables del paquete privado; esto no resuelve la autorización pendiente del conjunto.

## Docker y procedimiento de migraciones

Contexto raíz para src/frontend y src/backend. `.dockerignore` permite solo entradas necesarias, excluyendo Git, worktrees, .env, dependencias locales y archivos ajenos. COPY selectivo, sin copiar indiscriminadamente el repositorio. Backend genera Prisma Client y compila sin migrar/conectar a PostgreSQL; frontend emite GeoJSON estático y mantiene nginx. Puertos, credenciales y volumen no cambian. Secretos únicamente externos en ejecución.

Construcción privada después de verificar cobertura:

```sh
node scripts/provision-coverage.cjs
docker compose config --quiet
docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance config --quiet
docker build -f src/backend/Dockerfile -t distrirapido-postsprint1-backend:private-v1-20261009 .
docker build -f src/frontend/Dockerfile -t distrirapido-postsprint1-frontend:private-v1-20261009 .
```

No realizar push. Frontend construido localmente; backend compiló en la etapa build pero falló durante empaquetado. No se acredita una imagen backend completa ni inspección final del contenido de imágenes.

### Sustitución del deploy automático

Se comprobó que Compose arrancaba mediante `prisma migrate deploy && node dist/main.js`. Ahora arranca con Node; la alternativa operativa existe en `docker-compose.migrations.yml`, perfil optativo maintenance, con Prisma CLI y las mismas migraciones/variables de conexión. No se eliminó la posibilidad de aplicar migraciones ni se alteró su SQL.

Procedimiento futuro para entorno nuevo, privado y autorizado:

1. Configurar secretos externos; revisar proyecto Compose y base de destino. Para un entorno separado elegir proyecto distinto conscientemente; no reutilizar accidentalmente volumen ajeno ni cambiar el proyecto que identifica una base existente.
2. Aprovisionar/verificar cobertura, validar Compose y construir imágenes privadas.
3. Iniciar únicamente PostgreSQL de ese entorno nuevo: `docker compose up -d postgres`; esperar healthy. No ejecutar como recreación de la base existente.
4. Aplicar explícitamente `docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance run --rm migrate`.
5. Comprobar éxito; para estado: `docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance run --rm migrate node node_modules/prisma/build/index.js migrate status`.
6. Arrancar backend/frontend solo después del éxito. Bootstrap de administrador únicamente si realmente no existe y se autoriza, según README backend; no automático.

Actualización de entorno existente: revisar pendientes, respaldo y destino antes del paso 4 con autorización específica. No usar reset, db push, recreación ni bootstrap como sustituto. Ninguno de estos comandos up/run/migrate/bootstrap se ejecutó sobre servicios existentes durante esta fase.

## Resultados de verificaciones ejecutadas

| Verificación | Resultado | Alcance |
|---|---|---|
| Backend lint, typecheck, build | Correctos | Política generada y tsc; sin migraciones. |
| Jest backend | 20 suites, 241 pruebas aprobadas | Unidad y HTTP Nest/Supertest; Prisma/Auth simulados, GeoJSON real local. |
| Cobertura backend | 100% en cuatro métricas configuradas | Excluye main, módulos y artefactos generados; no cobertura total del repositorio. |
| Frontend lint, typecheck, build | Correctos | Vite 97 módulos; GeoJSON emitido. |
| Vitest frontend | 17 archivos, 216 pruebas aprobadas | Incluye manifiesto fijado y error 503. |
| Cobertura frontend | Statements 97.13%; branches 91.59%; functions 98.68%; lines 99.62% | Alcance configurado. |
| Herramientas / ESLint | 4 pruebas aprobadas; lint correcto | Índices temporales, corrupción, idempotencia y colisiones. |
| E2E Edge, API simulada | 92 aprobadas; 4.1 minutos | Dos proyectos; sin POST reales. |
| Responsive | 390, 768, 1366 y 1440; 767/768 y 1023/1024 | Login, panel, formulario montado, cobertura y marcador. |
| Integridad/provisión/guard local | Correctos | Nueve recursos preservados; índice real sin derivados. |
| Servicio compilado con Node | Correcto | dist carga paquete y acepta punto cubierto; sin AppModule/Prisma. |
| Compose normal + maintenance | Ambos config --quiet correctos | Valores temporales de validación; sin cambios de credenciales ni arranque. |
| Docker frontend | Build completo, salida 0 | Imagen privada local; config SHA f237ffcb9a5fee3c45be69ada87e7d584e6d4d368996c625d451efba2e6bddec. |
| Docker backend | Fallido; no aprobado | npm ci/generación/compilación correctos, RPC Unavailable / EOF al empaquetar. |
| Reintento / lectura Docker final | No disponibles | docker version sin respuesta; reintento cancelado; lectura limitada a 20 s terminó ETIMEDOUT. |
| PostgreSQL real / migraciones | No ejecutadas | Sin altas, reinicios, migraciones ni modificación de registros. |
| git diff --check | Correcto | Advertencias LF/CRLF, sin errores de espacios. |

Casos: punto por distrito, tres reservados y Jauja, valores no finitos, rangos/precisión, Polygon/MultiPolygon, huecos/bordes, archivos ausentes, manifiesto incompatible, hash incorrecto y generación exacta. OrdersService/HTTP verifican que los rechazos no llaman a transacción, Cliente.create ni Pedido.create. Permite Administrador/Operador, deniega otros roles, conserva 401 y consulta disponible ante fallo de cobertura. Login y consulta fueron verificados mediante suites locales/simuladas, no con sesión contra datos reales. Photon/OSM externos no se acreditan por E2E simulados.

### Comandos locales reproducibles

El lanzador npm de Windows estaba defectuoso; se ejecutaron los mismos CLI instalados mediante Node. Sin dependencias nuevas ni cambios de lockfiles.

Backend, desde src/backend:

```sh
node scripts/prepare-coverage.cjs
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/jest/bin/jest.js --runInBand --coverage
node node_modules/typescript/bin/tsc -p tsconfig.build.json
```

Frontend, desde src/frontend:

```sh
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --coverage --maxWorkers=1
node node_modules/vite/bin/vite.js build
```

Herramientas desde raíz:

```sh
node --test scripts/geodata-tools.test.cjs
node src/backend/node_modules/eslint/bin/eslint.js --config src/backend/eslint.config.mjs scripts/*.cjs
```

E2E desde src/frontend, con Vite separado en 127.0.0.1:5174 y E2E_BASE_URL apuntando allí, sin interferir con 5173 del checkout original:

```sh
node node_modules/@playwright/test/cli.js test e2e/login-background.spec.ts e2e/responsive.spec.ts e2e/admin-welcome.spec.ts e2e/admin-summary.spec.ts e2e/order-address.spec.ts e2e/order-coverage.spec.ts e2e/order-marker-sync.spec.ts e2e/order-navigation.spec.ts e2e/order-delivery-time.spec.ts e2e/order-consultation.spec.ts
```

No se ejecutó test:integration contra PostgreSQL: exige base aislada y puede escribir. La integración HTTP requerida está dentro de Jest y no necesita esa base.

### Aviso de dependencias durante empaquetado

npm ci backend informó 21 vulnerabilidades: 20 moderadas y una crítica. npm audit --json y npm audit --omit=dev --json se ejecutaron en lectura, sin audit fix ni cambios de paquetes. El análisis completo identifica handlebars transitivo de desarrollo, avisos GHSA-8r5x-fm3f-whwj y GHSA-p8wg-vrv2-v86f. El análisis excluyendo desarrollo devuelve cero avisos en esta consulta. No acredita seguridad general: Docker conserva herramientas de desarrollo, incluido Prisma CLI para migraciones. Revisar separación segura de herramientas/actualización antes de publicar; no se actualizan paquetes ajenos al alcance automáticamente. npm ci frontend informó cero vulnerabilidades en su build.

## Preservación y Git

SHA-256 de los 67 archivos inventariados del checkout original: cero diferencias; su status conserva 67 pendientes. Nueve recursos geográficos y política canónica intactos; reportes 01–04 y cambios previos fuera de alcance preservados. HEAD/branch anteriores, índice sin cambios preparados, sin carpetas frontend/backend duplicadas en raíz. Estado final: 85 archivos pendientes de revisión, incluidos los cambios anteriores; nueve recursos privados y dos artefactos generados excluidos de Git.

Antes del fallo Docker mostraba el contenedor existente b9412bfd92d5, distrirapido-postgres-1, healthy. No se ejecutaron reinicios/eliminaciones/recreaciones; su estado final no pudo confirmarse por falta de respuesta del motor. No se accedió a PostgreSQL ni Optica_Banglor; no se publicaron imágenes ni derivados.

## Pendientes antes de publicación

1. Resolver permisos INEI y su alcance documentado; paquete e imágenes privados mientras tanto.
2. Recuperar Docker mediante intervención autorizada; repetir build backend e inspeccionar recursos/hashes de ambas imágenes en contenedores aislados sin red/base. No declararlos verificados antes de ejecutarlo.
3. Revisar vulnerabilidad crítica de herramientas de desarrollo y presencia en imagen; sin actualización automática.
4. Verificar persistencia/rollback en una base dedicada de pruebas, incluido rechazo sin creación de clientes/pedidos.
5. Revisión del usuario de esta fase, migraciones y selección explícita futura; repetir guard después de staging. No incluir paquete ni artefactos.
6. Conservar pendientes anteriores de licencia visual y aceptación formal. Esta fase no autoriza publicación ni Sprint 2.

## Siguiente documento / Siguiente trabajo recomendado

Revisión del usuario de la fase y limitaciones. Después, resolver permisos INEI, completar Docker y revisar herramientas; finalmente verificar persistencia aislada. Es necesario antes de autorizar publicación o migraciones en otro entorno.
