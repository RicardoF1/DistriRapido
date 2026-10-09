# Frontend

React + TypeScript + Vite + React Router. Alcance implementado: login, sesión persistente, logout, usuarios/roles, registro y consulta de pedidos; layout responsive y panel de bienvenida del Administrador. Incluye indicadores administrativos reales; la PWA queda pendiente.

Configura `VITE_API_URL` en `.env` de la raíz. Desde esta carpeta:

```sh
npm ci
npm run dev
```

Abre `http://localhost:5173`. El backend debe estar disponible y `FRONTEND_ORIGIN` debe coincidir con ese origen.

```sh
npm run typecheck
npm run lint
npm run test:coverage
npm run build
```

Pruebas reales de navegador: inicia frontend/backend, configura `E2E_LOGIN_EMAIL`, `E2E_LOGIN_PASSWORD` de un administrador de pruebas y `JWT_SECRET` del backend de pruebas (para comprobar expiración real); ejecuta `npm run test:e2e`. Por defecto usa Edge instalado; `PLAYWRIGHT_CHANNEL` permite elegir otro canal instalado. Nunca publiques estas variables. `E2E_BASE_URL` y `E2E_API_URL` permiten servidores de prueba separados; VITE_API_URL y FRONTEND_ORIGIN deben coincidir con ellos.

US-002 conserva el JWT en cookie HttpOnly del backend. F5 restaura identidad con GET /auth/me. No se usan localStorage/sessionStorage para credenciales ni tokens. “Cerrar sesión” llama POST /auth/logout, elimina la cookie y vuelve a login; si falla la conexión, se muestra error y se permite reintentar. Consulta [US-002](../../docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-002.md).

US-003 añade /usuarios, /usuarios/nuevo y /usuarios/:id/editar. El Administrador accede desde “Usuarios y roles”; el resto de roles mantiene su página de acceso. Se editan email, rol y estado; la contraseña se proporciona solo al crear. El logout permanece visible. La tabla móvil permite desplazamiento horizontal. Consulta [US-003](../../docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-003.md).

## Estado actual posterior al Sprint 1

`AppLayout` mantiene el contenido montado al plegar el menú. El escritorio usa sidebar desde 1024 px; tablet/móvil usan encabezado y menú plegable. El login conserva la imagen aportada por el usuario, `background-size: cover`, marca y formulario sin duplicados, y tarjeta blanca para leer los campos.

`/acceso/administrador` muestra «Panel de administración» y tres tarjetas blancas con iconos SVG verdes y foco accesible. Antes de los accesos muestra «Resumen general»: totales de pedidos, pendientes y usuarios, y distribución por estados almacenados. Usa una sola solicitud GET /admin/summary, con carga, error/reintento y vacío explícitos. Si la identidad de la página y el rol vigente difieren durante una revalidación, oculta accesos obsoletos; las protecciones de rutas permanecen.

`/pedidos/nuevo` mantiene todos los campos, permisos, horarios de Lima y validaciones en un formulario único. Cliente/carga y programación se muestran en dos columnas de escritorio; debajo aparece la ubicación a todo el ancho. El mapa mide 560–640 px en escritorio, 480 px en tablet y 400–460 px en móvil. La confirmación está junto al buscador, la leyenda es compacta y el botón final se alinea a la derecha en escritorio.

Leaflet muestra teselas OpenStreetMap y los cinco distritos INEI. Photon se consulta directamente desde el navegador, con `countrycode=PE`, foco Huancayo, bbox derivado del GeoJSON y hasta 15 resultados previos al filtro por polígonos. Se mantienen debounce de 700 ms, caché de 50 consultas, timeout de 10 s y cancelación.

Elegir una sugerencia confirma el punto y centra el marcador magenta a zoom 17, incluso al volver a elegir el mismo destino después de «Ver cobertura». Escribir o editar no confirma. Clic, Enter y arrastre esperan una respuesta inversa vigente; si falla, no permiten enviar con una confirmación anterior. Los bordes se aceptan después de redondear el punto a seis decimales. Véanse [cobertura](../../geodata/README.md) y [sincronización](../../geodata/MARKER-SYNC.md).

**El backend también valida pertenencia a los polígonos antes de persistir.** Responde 400 ante un punto exterior/invalidado y 503 cuando no puede verificar los recursos. El cliente muestra un mensaje específico de indisponibilidad, sin presentar el registro como exitoso. Tampoco están implementados cambios de estado operativos, flota, optimización, OSRM ni PWA.

## Verificación sin modificar datos reales

Las suites siguientes simulan sesión y API; los POST de pedidos se interceptan. No requieren contraseñas reales:

```sh
npm run lint
npm run typecheck
npm run test -- --maxWorkers=1
npm run build
npm run test:e2e -- e2e/login-background.spec.ts e2e/responsive.spec.ts e2e/admin-welcome.spec.ts e2e/admin-summary.spec.ts e2e/order-address.spec.ts e2e/order-coverage.spec.ts e2e/order-marker-sync.spec.ts e2e/order-navigation.spec.ts e2e/order-delivery-time.spec.ts e2e/order-consultation.spec.ts --project=desktop --project=mobile
```

Inicia Vite en 5173 antes del E2E. Si el lanzador `npm` local está roto, los mismos CLI instalados pueden ejecutarse con Node: `node node_modules/eslint/bin/eslint.js .`, `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/vitest/vitest.mjs run --maxWorkers=1`, `node node_modules/vite/bin/vite.js build` y `node node_modules/@playwright/test/cli.js test ...`.

Las suites `login.spec.ts`, `users.spec.ts` y `orders.spec.ts` requieren servicios/cuentas exclusivos de prueba; algunas crean datos. No ejecutarlas contra producción. Las pruebas simuladas no acreditan disponibilidad de Photon/OSM ni persistencia PostgreSQL. Las evidencias anteriores conservan sus conteos de fase. Resultados de la nueva estructura en el [informe de reconciliación](../../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/04%20Reconciliación%20sobre%20main%20V_1_1_0.md).

## Recursos de cobertura y distribución

Vite importa el GeoJSON y manifiesto desde `../../geodata/coverage/v1/`, sin duplicarlos manualmente. La carga contrasta el manifiesto con `geodata/coverage-release.json` y verifica SHA-256 y estructura, y requiere Web Crypto en HTTPS o localhost; falla cerrada si no puede verificarlos. La publicación pública del recurso está pendiente de aclarar los permisos INEI.

El Dockerfile compila con contexto raíz y copia selectivamente frontend, política, metadatos y paquete privado. `.dockerignore` excluye secretos, dependencias locales y archivos ajenos al build. Antes de construir, ejecutar `node scripts/provision-coverage.cjs` desde la raíz. La imagen resultante incorpora el GeoJSON: su publicación sigue bloqueada por permisos INEI no confirmados.

## Verificación de la fase backend

La evidencia vigente separa pruebas HTTP con Prisma simulado, E2E con API simulada y comprobaciones de empaquetado de cualquier persistencia real: [informe 05](../../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/05%20Validación%20backend%20y%20empaquetado%20V_1_1_0.md). No se ejecutaron altas contra PostgreSQL.

## Siguiente documento / Siguiente trabajo recomendado

Resolver y documentar los permisos de redistribución INEI antes de publicar datos o imágenes. Revisar la evidencia técnica 05 y verificar persistencia en una base exclusivamente de pruebas, sin utilizar los registros existentes.
