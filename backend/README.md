# Backend

API NestJS + TypeScript, PostgreSQL y Prisma. Alcance: US-001, US-002 y US-003. Administración de cuentas y asignación de roles existentes; sin eliminación física.

Desde la raíz, copia `.env.example` a `.env` y configura valores propios. Desde esta carpeta:

```sh
npm ci
npm run prisma:generate
npm run db:migrate
npm run db:bootstrap
npm run start:dev
```

`db:bootstrap` requiere `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` (12–128 caracteres). Crea los cuatro roles documentados y un administrador ACTIVO con Argon2id; rechaza cuentas existentes. Elimina esas dos variables después de crearlo. Nunca publiques `.env`.

API: `http://localhost:3000`; Swagger: `http://localhost:3000/api/docs`. `POST /auth/login` recibe email/password y emite JWT/cookie HttpOnly. `GET /auth/me` admite cookie o Bearer y devuelve identidad/caducidad. `POST /auth/logout` elimina la cookie con respuesta 204, incluso si la sesión ya expiró. CORS con credenciales y origen explícito; login/logout verifican Origin y Fetch Metadata. Secure para HTTPS o NODE_ENV=production; desarrollo localhost HTTP sin Secure. Más detalles en [US-002](../docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-002.md).

```sh
npm run typecheck
npm run lint
npm run test:coverage
npm run build
```

Integración: proporciona `TEST_DATABASE_URL` de una base aislada cuyo nombre termine en `_test`, aplica la migración allí usando `DATABASE_URL` y ejecuta `npm run test:integration`. Las pruebas crean y eliminan su propio usuario.

US-003: GET /users, GET /users/:id, POST /users, PATCH /users/:id y GET /roles requieren Administrador. La cookie `distrirapido_session_v2` usa Path=/; /auth/me migra la cookie anterior sin renovar el JWT. No se requiere nueva migración ni repetir bootstrap sobre la base validada. PostgreSQL mantiene localhost:5433. Detalles y prueba manual en [US-003](../docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-003.md).
