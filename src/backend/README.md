# Backend

API NestJS + TypeScript, PostgreSQL y Prisma. Alcance: US-001, US-002 y US-003. Administración de cuentas y asignación de roles existentes; sin eliminación física.

Desde la raíz, copia `.env.example` a `.env`, configura valores propios y aprovisiona la cobertura privada con `node scripts/provision-coverage.cjs --source "/directorio/privado/autorizado/v1"`. El procedimiento siguiente de migración y bootstrap corresponde exclusivamente a un entorno nuevo autorizado; no repetirlo sobre la base existente. Desde esta carpeta:

```sh
npm ci
npm run prisma:generate
npm run db:migrate
npm run db:bootstrap
npm run start:dev
```

`db:bootstrap` requiere `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` (12–128 caracteres). Crea los cuatro roles documentados y un administrador ACTIVO con Argon2id; rechaza cuentas existentes. Elimina esas dos variables después de crearlo. Nunca publiques `.env`.

API: `http://localhost:3000`; Swagger: `http://localhost:3000/api/docs`. `POST /auth/login` recibe email/password y emite JWT/cookie HttpOnly. `GET /auth/me` admite cookie o Bearer y devuelve identidad/caducidad. `POST /auth/logout` elimina la cookie con respuesta 204, incluso si la sesión ya expiró. CORS con credenciales y origen explícito; login/logout verifican Origin y Fetch Metadata. Secure para HTTPS o NODE_ENV=production; desarrollo localhost HTTP sin Secure. Más detalles en [US-002](../../docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-002.md).

```sh
npm run typecheck
npm run lint
npm run test:coverage
npm run build
```

Integración: proporciona `TEST_DATABASE_URL` de una base aislada cuyo nombre termine en `_test`, aplica la migración allí usando `DATABASE_URL` y ejecuta `npm run test:integration`. Las pruebas crean y eliminan su propio usuario.

US-003: GET /users, GET /users/:id, POST /users, PATCH /users/:id y GET /roles requieren Administrador. La cookie `distrirapido_session_v2` usa Path=/; /auth/me migra la cookie anterior sin renovar el JWT. No se requiere nueva migración ni repetir bootstrap sobre la base validada. PostgreSQL mantiene localhost:5433. Detalles y prueba manual en [US-003](../../docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-003.md).


## Cobertura antes de persistencia

`CoverageService` carga el paquete canónico v1.0.0 al iniciar, verifica manifiesto y ocho hashes contra metadatos compilados y valida los cinco UBIGEO de Huancayo/Junín. Si falla, mantiene disponibles login y consulta, pero rechaza nuevas altas con HTTP 503. Una ubicación exterior o coordenadas inválidas generan HTTP 400 antes de `Prisma.$transaction`; no se crean clientes ni pedidos rechazados. No cambian el payload, JWT, cookies ni RBAC.

La política geométrica procede exclusivamente de `geodata/coverage.ts`; `node scripts/prepare-coverage.cjs` genera una copia exacta y metadatos TypeScript ignorados por Git. Los scripts de build, typecheck, tests y desarrollo ejecutan esta preparación. Después de editar la política canónica durante desarrollo, repetir la preparación; no editar los archivos generados.

Polygon/MultiPolygon y huecos están soportados. Bordes exteriores y de huecos se aceptan; interiores de huecos se excluyen. El frontend redondea a seis decimales; la API exige coordenadas finitas, dentro de rango y con hasta seis decimales, evitando cambiar silenciosamente el destino recibido. Bordes compartidos: etiqueta del menor UBIGEO.

## Docker y migraciones explícitas

El build parte de la raíz del repositorio: `docker build -f src/backend/Dockerfile -t distrirapido-backend:private .`. Copia solo recursos necesarios, genera Prisma Client y compila; no ejecuta migraciones ni accede a PostgreSQL. La imagen es privada por contener recursos INEI sin licencia de redistribución confirmada.

El arranque normal ejecuta `node dist/main.js`. Para un entorno nuevo autorizado, configurar secretos externos, verificar cobertura, construir, iniciar únicamente su PostgreSQL y aplicar explícitamente:

```sh
docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance run --rm migrate
```

Revisar proyecto Compose y base de destino antes de hacerlo. En una actualización, revisar migraciones pendientes y disponer de respaldo primero. Arrancar API/frontend solo tras una migración correcta. La operación se ofrece como procedimiento y no se ejecutó durante esta fase. `prisma migrate deploy` continúa disponible en el perfil; no se sustituyó por reset, recreación o bootstrap.

Pruebas de esta fase: Jest ejecuta HTTP Nest/Supertest con Prisma simulado y paquete GeoJSON real. Las pruebas de integración contra una base aislada siguen siendo un procedimiento independiente, no un resultado acreditado aquí. Véase [informe 05](../../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/05%20Validación%20backend%20y%20empaquetado%20V_1_1_0.md).

## Inyección de datos solo en pruebas

El loader acepta una referencia explícita de integridad para probar paquetes sintéticos. Los tests la suministran; el arranque de producción no recibe esa referencia y mantiene el release aprobado v1.0.0 por defecto. Una prueba verifica que el paquete sintético sea rechazado por la configuración de producción. `prepare-coverage.cjs` solo requiere política y metadatos públicos; no lee GeoJSON, manifiesto privado ni test-points.

## Siguiente documento / Siguiente trabajo recomendado

Resolver y documentar los permisos de redistribución INEI antes de publicar datos o imágenes. Revisar la evidencia técnica 05 y verificar persistencia en una base exclusivamente de pruebas, sin utilizar los registros existentes.
