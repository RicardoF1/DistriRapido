# Frontend

React + TypeScript + Vite + React Router. Alcance: login, sesión persistente, logout y administración básica de cuentas por Administrador. El dashboard operativo y la PWA quedan pendientes.

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

US-002 conserva el JWT en cookie HttpOnly del backend. F5 restaura identidad con GET /auth/me. No se usan localStorage/sessionStorage para credenciales ni tokens. “Cerrar sesión” llama POST /auth/logout, elimina la cookie y vuelve a login; si falla la conexión, se muestra error y se permite reintentar. Consulta [US-002](../implementation/US-002.md).

US-003 añade /usuarios, /usuarios/nuevo y /usuarios/:id/editar. El Administrador accede desde “Usuarios y roles”; el resto de roles mantiene su página de acceso. Se editan email, rol y estado; la contraseña se proporciona solo al crear. El logout permanece visible. La tabla móvil permite desplazamiento horizontal. Consulta [US-003](../implementation/US-003.md).
