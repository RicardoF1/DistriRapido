# Cuentas y vinculación de conductores — etapa 1

Versión documental: V_1_1_0. Fecha: 2026-10-29. Proyecto: DistriRapido / EcoRuta Huancayo. Alcance aprobado: administración de cuentas vinculadas; sin restablecimiento de contraseñas ni historias de rutas/entregas.

## Resultado funcional

El listado y la ficha de Conductores muestran si existe cuenta. El Administrador ve también correo y estado; el Operador recibe únicamente la existencia del vínculo. El campo UUID manual se retiró de la ficha, que ahora guarda exclusivamente datos administrativos del conductor.

Una sección independiente permite buscar por correo y seleccionar cuentas activas con rol técnico `Usuario Final / Conductor`, paginadas y sin vínculo con otra ficha. Incluye la cuenta actual cuando es elegible. Una cuenta actual inactiva se conserva y se muestra como actual, sin ofrecerla como nuevo destino elegible. Para sustituir el vínculo hay que seleccionar otra cuenta y marcar expresamente la confirmación; no existe botón de desvinculación.

En una ficha guardada y sin cuenta, el Administrador puede crear una cuenta con correo y contraseña nueva confirmada. El servidor fija rol Conductor y estado ACTIVO. La contraseña no se devuelve ni se persiste en el almacenamiento del navegador; los campos se limpian al cancelar o finalizar. Esta acción nunca restablece una contraseña existente.

Un fallo al consultar opciones no borra el vínculo actual ni desmonta el formulario de datos. Ante un conflicto se puede recargar expresamente la cuenta actual sin perder el borrador ni reenviar automáticamente la escritura.

No se crearon cuentas públicas durante la verificación. La cuenta, estado, vínculo y credenciales de Juan permanecieron idénticos.

## Endpoints y contratos

| Método y ruta | Permisos | Comportamiento |
|---|---|---|
| GET `/drivers`, GET `/drivers/:id` | Administrador y Operador | `cuenta_vinculada`; solo Administrador recibe `cuenta: {usuario_id,email,estado}` o null. Se deja de exponer el UUID bruto al Operador. |
| GET `/drivers/account-options` | Administrador | Parámetros opcionales conductor_id, search, page, pageSize; devuelve items, total y paginación, sin hashes. |
| PUT `/drivers/:id/account` | Administrador | usuario_id destino y expected_usuario_id obligatorio/nullable; confirm_replacement=true para sustituir. No admite destino null. |
| POST `/drivers/:id/account` | Administrador | email y password; crea y vincula únicamente si la ficha sigue sin cuenta. |
| POST `/drivers`, PATCH `/drivers/:id` | Administrador y Operador | Conservan gestión normal. Operador con usuario_id explícito, incluso null: 403. Administrador no puede alterar/desvincular por PATCH antiguo; debe usar acción dedicada. |
| PATCH `/users/:id` | Administrador, control existente | Impide cambiar a otro rol una cuenta vinculada a conductor, también frente a concurrencia. |

Se reutiliza UsersService para validar el rol, generar Argon2id y crear el usuario dentro de la transacción recibida. JWT, cookies HttpOnly y validación vigente de usuarios/roles se mantienen. Se añadió PUT a los métodos CORS para que el navegador pueda ejecutar la nueva operación desde el frontend autorizado.

Errores: 400 DTO/cuenta no elegible o intento de cambiar vínculo por ficha antigua; 401 sesión ausente/inválida; 403 rol/origen no autorizado; 404 conductor ausente; 409 correo o vínculo duplicado, falta de confirmación, versión del vínculo obsoleta o conflicto serializable. Los errores inesperados continúan sanitizados por el filtro existente. No existe endpoint de reset en esta etapa.

## Integridad y seguridad

- Se reutilizan Usuario y Conductor y la restricción UNIQUE existente de usuario_id: ninguna migración nueva.
- Creación + vínculo en una transacción Serializable, con actualización condicional del vínculo; fallo implica rollback del usuario insertado.
- Vinculación verifica cuenta activa, rol técnico y ausencia de otro conductor. UNIQUE y Serializable protegen contra carreras entre fichas.
- expected_usuario_id evita sobrescribir una decisión administrativa tomada desde otra pantalla. Sin reintento automático en conflictos.
- Los cambios de rol en Usuarios verifican el vínculo en una transacción Serializable para no crear asociaciones incompatibles concurrentemente.
- Guards del backend son la autoridad; ocultar controles en React es adicional. Auditor y Conductor no obtienen acceso administrativo nuevo.
- Proyecciones explícitas y Cache-Control no-store; no se devuelven contraseñas ni hashes ni información de cuenta al Operador.
- No eliminación de cuentas, desvinculación automática, modificación de contraseñas, ni escrituras sobre rutas/entregas.

## Archivos de esta etapa

Las siguientes rutas son relativas a la raíz. Otros cambios locales anteriores del login, mapa, integración y panel del conductor se conservaron y no se atribuyen a esta etapa.

Backend modificados:

- `src/backend/src/common/configure-app.ts`
- `src/backend/src/drivers/drivers.controller.ts`
- `src/backend/src/drivers/drivers.module.ts`
- `src/backend/src/drivers/drivers.service.ts`
- `src/backend/src/drivers/drivers.spec.ts`
- `src/backend/src/users/users.service.ts`
- `src/backend/src/users/users-admin.spec.ts`

Backend nuevos:

- `src/backend/src/drivers/driver-accounts.controller.ts`
- `src/backend/src/drivers/driver-accounts.service.ts`
- `src/backend/src/drivers/driver-accounts.spec.ts`
- `src/backend/src/drivers/driver-view.ts`
- `src/backend/src/drivers/dto/driver-account.dto.ts`
- `src/backend/test/driver-accounts.integration.ts`

Frontend modificados:

- `src/frontend/src/features/drivers/DriverForm.tsx`
- `src/frontend/src/features/drivers/DriverForm.test.tsx`
- `src/frontend/src/pages/DriversPage.tsx`
- `src/frontend/src/services/api.ts`
- `src/frontend/src/services/drivers-api.ts`
- `src/frontend/src/styles/app.css`
- `src/frontend/src/types/drivers.ts`
- `src/frontend/playwright.mock.config.ts`

Frontend nuevos:

- `src/frontend/src/features/drivers/DriverAccountsPanel.tsx`
- `src/frontend/src/features/drivers/DriverAccountsPanel.test.tsx`
- `src/frontend/e2e/driver-accounts.spec.ts`

Documentación nueva:

- `docs/otros/superpowers/plans/2026-10-29-driver-account-management.md`
- Este informe.
- `docs/03 Implementación/evidencias-tecnicas/Sprint-3/03 Diseño de restablecimiento de credenciales V_1_1_0.md`

Se guardaron utilidades y evidencias privadas bajo `.local/driver-accounts-20261029-171102/`; no son archivos para publicar.

## Verificación ejecutada

Se siguió TDD con especificación del comportamiento y plan previos. Los 17 casos iniciales HTTP y los cinco iniciales de interfaz fallaron antes de la implementación; después aprobaron. Se añadieron regresiones que reprodujeron el bloqueo de POST normal del Operador por un campo DTO undefined, la falta de PUT en CORS y la recuperación de vínculo obsoleto; se corrigieron y verificaron con las suites completas. La revisión independiente de código no dejó hallazgos materiales pendientes.

| Verificación final | Resultado real |
|---|---|
| Backend `npm run typecheck` y `npm run lint` | Aprobados |
| Backend `npm run test:coverage` | 339 pruebas, 29 suites aprobadas; 92.35% líneas |
| Backend `npm run build` | Aprobado |
| Backend `npm run test:integration` | 97 pruebas, 5 suites aprobadas con PostgreSQL real aislado |
| Frontend `npm run typecheck` y `npm run lint` | Aprobados |
| Frontend `npm run test:coverage -- --pool=forks --maxWorkers=1` | 261 pruebas, 26 archivos aprobados; 93.34% líneas |
| Frontend `npm run build` | Aprobado; advertencia de bundle >500 kB |
| Frontend `npm run test:e2e -- --config playwright.mock.config.ts` | 78 aprobadas, API simulada, sin mutaciones públicas |
| Docker build backend/frontend y actualización solo aplicaciones | Aprobados; PostgreSQL no se recreó |
| Navegador con Administrador real | Login, contrato de cuenta, selector real y vínculo actual; 390/768/1366/1440 px sin desbordamiento |
| Navegador con Juan real | Login, restauración, cookie HttpOnly, perfil propio, 7 endpoints administrativos denegados, logout; cuatro anchuras aprobadas |
| Datos públicos antes/después | Conteos y SHA-256 de las filas de las 8 tablas idénticos |
| Respaldo | 148 archivos verificados por hash; dump de 57137 bytes, listado y decodificación pg_restore sin restaurar aprobados |
| `git diff --check` | Sin errores; aviso de conversión LF/CRLF en una prueba del mapa anterior |
| `node scripts/check-geodata-publication.cjs` | Índice sin derivados privados |

Las pruebas nuevas de integración cubren alta y login de cuenta, duplicados, dos fichas compitiendo por una cuenta, dos altas compitiendo por una ficha, rollback real tras INSERT y fallo de actualización condicional, sustitución confirmada, vínculo obsoleto, cuentas ocupadas/inactivas, restricciones del Operador, conservación de hash y concurrencia rol/vínculo. El rollback forzado utiliza PostgreSQL real con una actualización condicional controlada por el arnés de pruebas; no altera el servicio de producción.

Las escrituras de integración se limitaron al esquema `distrirapido_integration_20261029_test`. Los registros sintéticos se crearon y retiraron en ese esquema, nunca en public. La primera ejecución no pudo conectar por localhost; se corrigió el destino del arnés a 127.0.0.1 y la ejecución completa posterior aprobó. No se modificó `.env` para ello.

## PostgreSQL, respaldo y Git

El respaldo recuperable queda en `.local/driver-accounts-20261029-171102/`: archivos previos, manifiesto, patch, `before-driver-accounts.dump` y snapshots de integridad. Es privado y está ignorado por Git. Se verificó el dump sin ejecutar restauración. Una comprobación adicional inicial de pg_restore recibió stdin vacío; se repitió correctamente enviando el dump binario, cuyo listado y decodificación aprobaron.

Public conserva: 4 usuarios, 2 conductores, 2 clientes, 2 pedidos, 4 roles, 0 vehículos y 0 disponibilidades; 6 migraciones sin cambios. Comparación completa de las ocho tablas, no solo de conteos. `.env` y el archivo de credencial cifrada de Juan mantienen sus hashes. Los datos geográficos no se modificaron ni publicaron. Las imágenes construidas son locales y no deben publicarse mientras incluyan recursos restringidos.

Rama conservada: `main`; HEAD `128af98b7021655c39160a92121087023ed3f931`, igual al inicio. El árbol sigue con cambios locales anteriores y los nuevos de esta etapa; no hay staging, commit, push ni merge remoto. No se cambió de rama ni se creó worktree. Se conservaron las carpetas antiguas backend/frontend.

## Uso local y pendientes

Abrir `http://localhost:5173/conductores` con la cuenta Administrador existente. Entrar a Consultar o Editar para ver Cuenta de acceso. Para una ficha sin cuenta, elegir Vincular cuenta existente o Crear cuenta de conductor. La creación requiere una ficha previamente guardada. Para reemplazar, revisar el correo y confirmar explícitamente. Cancelar conserva el vínculo. El Operador verá solo la existencia de cuenta y seguirá editando los datos habituales.

No se necesita migración para la etapa 1. Las pruebas con mutación real no validaron nuevos registros en public deliberadamente: su atomicidad y persistencia se comprobaron con Prisma real en el esquema aislado. La revocación global de sesiones tras un restablecimiento todavía no existe; se detalla en el diseño de etapa 2. No se implementaron indicadores nuevos, rutas, asignaciones ni entregas. Las advertencias previas de auditoría de dependencias quedan fuera de esta modificación y no se resolvieron con actualizaciones masivas.

## Siguiente documento / Siguiente trabajo recomendado

Revisar esta etapa en la interfaz local y aprobar separadamente el diseño `03 Diseño de restablecimiento de credenciales V_1_1_0.md`. No implementar el reset, la versión de credenciales JWT ni su migración hasta recibir esa aprobación adicional.

[← Volver al README principal](../../../../README.md)
