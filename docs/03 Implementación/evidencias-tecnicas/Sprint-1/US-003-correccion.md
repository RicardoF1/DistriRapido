# Corrección de la prueba manual de US-003 — 2026-10-01

> **Evidencia técnica histórica del Sprint 1.**
> Este documento registra el estado y las decisiones existentes en el momento de implementación de la historia. Puede contener comportamientos posteriormente refinados. Para el estado vigente del Sprint 1, consultar la [documentación oficial en docs/03 Implementación/](../../).

## Causa comprobada

El proceso real de backend en localhost:3000 seguía ejecutando US-002 mediante `ts-node src/main.ts`, sin observar cambios. Aunque el código fuente ya importaba UsersModule/RolesModule, el proceso no había cargado US-003. GET /users devolvía 404 `Cannot GET /users`; GET /roles devolvía 404 `Cannot GET /roles`. Su OpenAPI solo incluía /auth/login, /auth/logout y /auth/me.

El frontend convertía indiscriminadamente cualquier 404 en «Usuario no encontrado.». /usuarios fallaba al consultar /users; /usuarios/nuevo fallaba al consultar /roles. «nuevo» no se interpretaba como ID: la ruta estática de creación no consulta /users/nuevo. No había un usuario principal ausente ni un error de permisos.

## Corrección

- Se reinició exclusivamente el proceso obsoleto de backend DistriRapido y se dejó actualizado en localhost:3000, usando el mismo .env y PostgreSQL Docker en localhost:5433. No se ejecutó bootstrap ni se recreó base/contenedor/volumen.
- backend/package.json: start:dev usa Node watch sobre src con ts-node/register. Sin dependencias nuevas. Cambios de .env todavía requieren reinicio manual.
- frontend/src/services/api.ts: 404 de colección/catálogo se informa como ruta de servidor no disponible; se conserva «Usuario no encontrado» para un recurso /users/:id. Esto acompaña la solución real del proceso obsoleto.
- frontend/src/services/api.test.ts: tres regresiones sobre ambos endpoints y un usuario inexistente.
- frontend/src/features/users/users.test.tsx: regresión que verifica que /usuarios/nuevo carga roles y no consulta un usuario con ID nuevo.
- backend/test/auth.integration.ts y users.integration.ts: las pruebas admiten un esquema aislado distrirapido_*_test, además de una base _test. Así se ejecutaron sin recrear ninguna base existente.
- README.md e implementation/US-003.md: instrucciones actualizadas; este informe registra el incidente.

No se cambiaron controladores, servicios de dominio, guards, cookies, secretos, Prisma ni migraciones. Se mantienen cuatro roles de línea base, Argon2id, DTO restrictivos y 401/403. Cookie distrirapido_session_v2: Path=/, HttpOnly, SameSite=Lax, expiración y Secure en producción/HTTPS. Sin localStorage/sessionStorage.

## Verificación ejecutada

| Comprobación | Resultado |
|---|---|
| Backend unitarias + cobertura | 89 pruebas, 15 suites; todas pasaron |
| Frontend unitarias + cobertura | 58 pruebas, 5 archivos; todas pasaron |
| Integración PostgreSQL localhost:5433 | 28 pruebas, 2 suites; todas pasaron en esquema temporal aislado |
| E2E Edge móvil y desktop | 6 pruebas US-001/002/003; todas pasaron |
| TypeScript backend/frontend | Ambos pasaron |
| Lint backend/frontend | Ambos pasaron |
| Build backend/frontend | Ambos pasaron |
| Servidor real localhost:3000/5173 | Flujo adicional automatizado con administrador existente: login, listado, formulario, crear, editar, F5, logout y protección pasaron |
| Swagger real | Incluye GET/POST /users, GET/PATCH /users/{id}, GET /roles y autenticación |

Cobertura backend: 100% statements, branches, functions y lines; excluye main.ts y módulos de wiring. Frontend: 97.48% statements, 91.81% branches, 100% functions y lines, según alcance configurado. Antes de esta corrección frontend: 97.47% statements y 91.74% branches.

Integración incluye email inválido/duplicado, contraseña corta, rol inexistente, estado inválido/null, Argon2id, ausencia de password_hash, PATCH inválido, 401 sin sesión, 403 para rol no Administrador, CSRF y regresión login/me/cookie/F5/logout. E2E incluye credenciales incorrectas, cookie inválida y JWT expirado. En servidor real: GET /users, /users/:id, /roles y /auth/me = 200; POST /users = 201; PATCH /users/:id = 200; GET /users tras logout = 401. El listado mostró admin@distrirapido.local.

La cuenta creada por la prueba adicional se retiró por su UUID y email propios. Los E2E generales e integración utilizaron un esquema temporal propio, retirado al finalizar. Scripts y entorno temporal estuvieron bajo backend/.local, ignorado por Git; no se incorporaron secretos ni archivos temporales al código. El administrador principal se comprobó íntegro mediante digest antes/después. No se modificaron /docs, /prototypes, .env, configuración Docker ni recursos de otros proyectos.

No se repitió auditoría de dependencias: no hubo cambios de dependencias o lockfiles. No se probó despliegue HTTPS ni builds Docker. La validación manual del usuario permanece pendiente; las comprobaciones anteriores fueron automatizadas.

## Repetir manualmente

1. Mantener PostgreSQL Docker de DistriRapido en localhost:5433. No ejecutar bootstrap ni migraciones para esta corrección.
2. El backend actualizado quedó iniciado en localhost:3000 y el frontend existente se conserva en localhost:5173. Si las terminales ya se cerraron, desde backend ejecutar `npm run start:dev`; desde frontend ejecutar `npm run dev`. Si npm global falla, usar en cada carpeta `node "$env:ProgramFiles\nodejs\node_modules\npm\bin\npm-cli.js" run start:dev` o `run dev`, respectivamente. No iniciar un segundo backend sobre 3000.
3. Abrir http://localhost:3000/api/docs y confirmar que aparecen Usuarios y Roles. Abrir http://localhost:5173/login e iniciar sesión con admin@distrirapido.local y su contraseña actual.
4. Pulsar «Usuarios y roles»: /usuarios debe mostrar el administrador existente, email, rol, estado, Editar, Crear usuario y Cerrar sesión. En Network, GET /users debe devolver 200.
5. Pulsar «Crear usuario»: /usuarios/nuevo debe mostrar el formulario. GET /roles = 200 y no debe existir GET /users/nuevo.
6. Enviar vacío y comprobar validaciones. Crear una cuenta con un correo nuevo válido, contraseña de 12–128 caracteres, Operador / Técnico y ACTIVO. Guardar: POST /users = 201 y la cuenta aparece en listado.
7. Intentar crear otra cuenta con el mismo email: 409 y aviso de duplicado. Cancelar. Una contraseña corta/email inválido se rechazan; no modificar el administrador principal.
8. Editar únicamente la cuenta nueva: cambiar email, rol a Auditor Externo y estado a INACTIVO. Guardar: PATCH /users/:id = 200; listado refleja cambios. No hay campo de contraseña al editar.
9. Presionar F5: conserva sesión y cambios. Pulsar Cerrar sesión: vuelve a login; cookie v2 desaparece. Acceder directamente a /usuarios y /acceso/administrador, y recargar: permanece en login.
10. Con una cuenta ACTIVO no Administrador, /users y /roles devuelven 403; sin sesión devuelven 401. Para probarlo, usar una cuenta secundaria, sin alterar el administrador principal.

US-004 y US-005 no se iniciaron.
