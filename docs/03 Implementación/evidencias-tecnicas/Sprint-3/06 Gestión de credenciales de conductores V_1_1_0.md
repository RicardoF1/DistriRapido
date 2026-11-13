# Gestión de credenciales de conductores — etapa 2

Versión: V_1_1_0. Fecha local: 2026-10-29. Estado: código implementado y verificado; **sin migración ni despliegue en desarrollo y sin cambios de contraseñas reales**. Referencia: `03 Diseño de restablecimiento de credenciales V_1_1_0.md` y aprobación de la etapa 2. No forma parte de US-013 ni implementa asignaciones o entregas.

## Funcionalidad y contratos

Administrador: Conductores → ficha/editar → Cuenta de acceso → Restablecer contraseña. Se carga de nuevo correo, estado, usuario vinculado y versión; exige nueva contraseña, confirmación idéntica y confirmación expresa del cierre de sesiones. No requiere contraseña anterior, no cambia cuenta, correo, estado, rol ni vínculo. También admite una cuenta inactiva sin activarla. No sustituye cuentas ni crea conductores.

Conductor: panel → Mi cuenta → Cambiar mi contraseña. Requiere contraseña actual y nueva confirmada; el usuario objetivo se obtiene exclusivamente de la sesión y se verifica su vínculo y ficha activa. Tras el cambio se cierra también su sesión actual y aparece la confirmación en login. No se devuelve otro JWT automáticamente.

| Endpoint | Autorización | Contrato |
|---|---|---|
| GET /drivers/:id/account/credentials | Administrador | usuario_id, email, estado y credentials_version de la cuenta vinculada; sin hash |
| POST /drivers/:id/account/reset-password | Administrador | password, password_confirmation, expected_usuario_id, expected_credentials_version, confirmed=true |
| POST /driver/account/password | Conductor vinculado y activo | current_password, password, password_confirmation; sin usuario_id ni conductor_id suministrados por cliente |

Respuestas de cambio: 200, exclusivamente message, Cache-Control no-store. 400: validación, confirmación o contraseña actual/repetida incorrectas; 401: sesión inválida/revocada; 403: rol u origen prohibidos; 404: ficha/cuenta ausente; 409: versión/vínculo concurrente u obsoleto; 429: límite de intentos. Fallos inesperados se sanitizan mediante el filtro existente. No se devuelven contraseñas, hashes ni tokens en los endpoints nuevos.

## Política y privacidad

12–128 puntos de código Unicode; frases admitidas, sin exigencia de combinaciones de tipos de carácter. Sin trim, truncamiento o normalización silenciosa. Se rechaza el blanco completo, confirmación distinta y reutilización inmediata. Los campos del navegador permiten 256 unidades UTF-16 para admitir hasta 128 caracteres suplementarios; la política efectiva permanece en 128 puntos de código y se valida en backend. Se corrigió también el campo de login para evitar truncar una contraseña admitida por el reset.

Es una contraseña definitiva. No hay contraseña temporal, caducidad temporal ni cambio obligatorio inventado. El Administrador debe comunicarla por un canal seguro acordado con el conductor, sin publicarla en tickets, Git, logs o documentación. El sistema no envía correo ni WhatsApp y no permite recuperar la contraseña anterior. El conductor puede cambiarla desde Mi cuenta.

Los secretos permanecen únicamente en los campos React y en la solicitud protegida; se limpian al cancelar o finalizar un intento de envío. No se guardan en localStorage/sessionStorage, URL o documentación. Tras el cambio propio se usa un indicador no sensible `ecoruta.password.changed.notice=1` en sessionStorage para conservar el mensaje a través de la redirección; login lo consume y elimina. Nunca contiene correo, contraseña, hash ni token. La cookie HttpOnly existente mantiene el transporte de sesión.

No se añadió consulta externa de contraseñas comprometidas ni un nuevo mecanismo persistente de auditoría. Una política adicional o auditoría operativa debe acordarse por separado; no se registran cuerpos de solicitudes, cookies ni secretos.

## Seguridad, atomicidad y sesiones

- JWT, AdministratorGuard y RequestOriginGuard protegen el reset en backend. Operador y Auditor no acceden a los metadatos sensibles ni al reset; Conductor solo al cambio propio. Los permisos de pedidos/rutas permanecen intactos.
- El reset deriva la cuenta desde el conductor, exige usuario/versión esperados y rol Conductor. No permite actuar sobre otro usuario mediante un identificador arbitrario.
- Argon2id reutiliza PasswordService y los valores predeterminados existentes. Se comprueba diferencia con la contraseña actual antes del hash nuevo.
- La transacción Serializable vuelve a leer vínculo, rol, hash y versión; un UPDATE condicional cambia hash e incrementa versión juntos. Incluye condición de vínculo y rol. Los conflictos revierten con 409; no hay reintento automático que sobrescriba otro reset.
- El throttling global por IP continúa; un guard adicional limita a cinco intentos/minuto por actor y por destinatario, incluyendo los fallidos. Su memoria tiene limpieza por vencimiento y límite de tamaño. Es una primera implementación mono-instancia: antes de múltiples réplicas deberá compartirse el presupuesto. No se ha desactivado throttling para aprobar pruebas.
- Login firma cv de la misma lectura cuyo hash verificó. Cada authenticate compara cv con PostgreSQL, tanto por Bearer como por cookie y transporte heredado. Un JWT sin cv equivale a cero solo mientras la cuenta conserve cero; cv presente nulo, cadena, negativo, fraccionario o inseguro se rechaza.
- El primer cambio incrementa versión y revoca todas las sesiones anteriores de esa cuenta; otras cuentas mantienen acceso. No se promete cancelar retroactivamente solicitudes ya autorizadas/en curso.

## Migración y despliegue pendiente

Archivo independiente: `src/backend/prisma/migrations/202610300001_driver_credentials_version/migration.sql`. Añade únicamente `usuarios.credentials_version INTEGER NOT NULL DEFAULT 0` y CHECK no negativo. No modifica hashes, datos del conductor, roles o vínculos. No se modificaron migraciones aplicadas previamente.

Es independiente de las siete tablas de rutas. Se verificó toda la cadena, incluida `202610290001_planificacion_rutas`, en el esquema aislado `distrirapido_credentials_20261030_test`. Las ocho migraciones se aplicaron allí correctamente. En desarrollo public siguen las seis migraciones anteriores: **rutas y credenciales están pendientes**.

No ejecutar indiscriminadamente migrate deploy en desarrollo para habilitar solo contraseñas: también aplicaría rutas. Debe aprobarse un procedimiento dirigido después de respaldo actualizado y revisión: ejecutar exclusivamente el SQL de credenciales con control transaccional y tiempo de bloqueo, comprobar columna/constraint/default e invariantes, y registrar esa aplicación con `prisma migrate resolve --applied 202610300001_driver_credentials_version`. Son dos pasos operativos a revisar: si el registro de historial falla después del DDL, detenerse y reconciliar el estado comprobado; no repetir el ALTER ni falsear el historial. Estos comandos **no se ejecutaron contra desarrollo**. La alternativa es autorizar explícitamente toda la cadena pendiente; no está autorizada en esta fase.

Solo después de migrar debe desplegarse el backend que lee la columna y el frontend nuevo. El Prisma Client generado aquí no sirve para desplegar el código nuevo sobre public sin esa columna. Los contenedores actuales conservan la versión anterior.

Una reversión a backend que ignore cv reaceptaría JWT revocados: queda prohibida como rollback normal. Mantener backend compatible o cerrar el acceso mientras se corrige. No eliminar la columna ni resetear la base. El respaldo debe verificarse antes de una aplicación futura; una restauración requeriría autorización separada.

## Pruebas ejecutadas y resultados

| Verificación | Resultado |
|---|---|
| Backend unitarias/HTTP simulado con cobertura | 443 pruebas, 39 suites aprobadas |
| PostgreSQL aislado, suites completas | 120 pruebas, 7 suites aprobadas; incluye 14 nuevas de credenciales |
| Frontend con cobertura | 294 pruebas, 33 archivos aprobados |
| E2E API simulada en Edge, preview 5174 | 94 aprobadas; 7 nuevas de credenciales |
| Typecheck y lint backend/frontend | Aprobados |
| Builds backend/frontend | Aprobados; advertencia frontend de bundle mayor de 500 kB |
| Prisma validate | Aprobado |
| git diff --check | Aprobado; aviso previo LF/CRLF en DeliveryMap.test.tsx |
| check-geodata-publication.cjs | Índice sin derivados geográficos privados; no autoriza publicación |
| Login real Administrador, contenedor vigente | Login HTTP200 y /auth/me HTTP200 |
| Login real Juan, contenedores vigentes | Aprobado, cookie HttpOnly, recarga, logout y siete endpoints administrativos denegados |

Cobertura backend: statements 90.81%, branches 82.76%, functions 88.59%, lines 93.94%. Frontend: statements 87.28%, branches 81.62%, functions 84.72%, lines 92.57%. Se conservan los umbrales existentes de 80%, sin reducciones.

PostgreSQL prueba Argon2id real, contraseña anterior rechazada/nueva aceptada, revocación cookie/Bearer/JWT legado, persistencia hash+versión, conservación de ficha y cuenta, permisos de los cuatro roles, confirmaciones, identificadores manipulados, origen ajeno, límite HTTP, dos resets simultáneos, vínculo cambiado durante el hash y rollback posterior a UPDATE real. Datos exclusivamente sintéticos; limpieza restringida a sus identificadores dentro del esquema de prueba.

Las pruebas de navegador cubren 390, 768, 1366 y 1440 px, ausencia de desbordamiento, confirmación, cancelación/carga fallida, borrador de ficha conservado, ausencia de contraseñas en almacenamiento y cambio propio con retorno a login. La suite general conserva regresiones de autenticación, conductores, disponibilidad, pedidos y rutas.

Fallos observados y resueltos, sin ocultarlos: RED inicial de siete casos JWT; componente nuevo ausente durante preparación de tests; restricción EACCES de sockets y EPERM de caché en sandbox (repetición con permisos adecuados); dos pruebas frontend bajo saturación temporal (suite completa con dos workers aprobada); el harness aislado inicialmente compartía IP y presupuestos entre casos (ahora actores/clientes sintéticos independientes, más test explícito 429); E2E detectó pérdida de confirmación en redirección (corregida); revisión detectó truncamiento Unicode (test RED de pegado de 65 caracteres suplementarios y corrección). Ninguna aserción se eliminó ni se bajó cobertura. La prueba antigua que esperaba 404 para el endpoint aún inexistente ahora exige 400 para cuerpo vacío, pues etapa 2 incorpora ese endpoint.

Las comprobaciones reales de Juan/Administrador ejercitan los contenedores anteriores, no un despliegue nuevo: la funcionalidad nueva se verificó con PostgreSQL aislado y navegador con API simulada. No se afirma haber restablecido ninguna cuenta real.

## Conservación del entorno y Git

Rama main; HEAD `128af98b7021655c39160a92121087023ed3f931` sin cambios de rama. No commits, staging, push ni merge. Se preservan todos los cambios anteriores. Respaldo recuperable de 380 archivos en `.local/credential-stage2-*`, identificado por `.local/current-credential-stage2.txt`, con manifest SHA-256 y diff previo; permanece privado.

Se compararon las ocho tablas public con el snapshot anterior: mismos conteos y SHA de todas las filas, incluidos hash de contraseña y vínculo de Juan sin exponerlos. Cuatro usuarios, dos conductores, dos pedidos, dos clientes, cuatro roles, cero vehículos, cero disponibilidades y seis filas de migración. Las escrituras se limitaron al esquema de pruebas. No se reconstruyó Docker, no se descargó OSRM, no se liberó espacio ni se modificaron .env/credenciales privadas/geodata.

## Archivos de esta fase

Backend: schema.prisma; migración nueva; auth.service.ts y spec; auth.module.ts; password.service.ts; drivers.module.ts; driver-credentials.service.ts, controller.ts y spec; credential-attempts.guard.ts y spec; dto/driver-credentials.dto.ts; test/driver-credentials.integration.ts; adaptación de la aserción en test/driver-accounts.integration.ts.

Frontend: DriverCredentialsPanel.tsx y test; DriverAccountsPanel.tsx; DriverAccessPage.tsx; AppLayout.tsx; LoginPage.tsx; PasswordField.tsx y test; services/driver-credentials-api.ts; services/api.ts; e2e/driver-credentials.spec.ts; playwright.mock.config.ts.

Documentos: este informe, actualización de estado en el diseño 03 y plan `docs/otros/superpowers/plans/2026-10-29-driver-credentials-stage2.md`. Inventario exacto local comparado con el respaldo en `.local/credential-stage2-changed-files.json`. Ningún archivo de implementación de planning/routes/routing/orders/vehicles/availability se modificó en esta fase.

### Inventario exacto (30 archivos)

- `docs/03 Implementación/evidencias-tecnicas/Sprint-3/03 Diseño de restablecimiento de credenciales V_1_1_0.md`
- `docs/03 Implementación/evidencias-tecnicas/Sprint-3/06 Gestión de credenciales de conductores V_1_1_0.md`
- `docs/otros/superpowers/plans/2026-10-29-driver-credentials-stage2.md`
- `src/backend/prisma/migrations/202610300001_driver_credentials_version/migration.sql`
- `src/backend/prisma/schema.prisma`
- `src/backend/src/auth/auth.module.ts`
- `src/backend/src/auth/auth.service.spec.ts`
- `src/backend/src/auth/auth.service.ts`
- `src/backend/src/auth/password.service.ts`
- `src/backend/src/drivers/credential-attempts.guard.spec.ts`
- `src/backend/src/drivers/credential-attempts.guard.ts`
- `src/backend/src/drivers/driver-credentials.controller.ts`
- `src/backend/src/drivers/driver-credentials.service.ts`
- `src/backend/src/drivers/driver-credentials.spec.ts`
- `src/backend/src/drivers/drivers.module.ts`
- `src/backend/src/drivers/dto/driver-credentials.dto.ts`
- `src/backend/test/driver-accounts.integration.ts`
- `src/backend/test/driver-credentials.integration.ts`
- `src/frontend/e2e/driver-credentials.spec.ts`
- `src/frontend/playwright.mock.config.ts`
- `src/frontend/src/components/ui/PasswordField.test.tsx`
- `src/frontend/src/components/ui/PasswordField.tsx`
- `src/frontend/src/features/drivers/DriverAccountsPanel.tsx`
- `src/frontend/src/features/drivers/DriverCredentialsPanel.test.tsx`
- `src/frontend/src/features/drivers/DriverCredentialsPanel.tsx`
- `src/frontend/src/layouts/AppLayout.tsx`
- `src/frontend/src/pages/DriverAccessPage.tsx`
- `src/frontend/src/pages/LoginPage.tsx`
- `src/frontend/src/services/api.ts`
- `src/frontend/src/services/driver-credentials-api.ts`

## Procedimiento futuro para restablecer la contraseña de Juan

Después de autorización específica de migración/despliegue y del cambio real de su contraseña: Administrador → Conductores → ficha de Juan → Cuenta de acceso. Confirmar que el correo y estado corresponden a la cuenta esperada; abrir Restablecer contraseña, ingresar una nueva frase de contraseña en ambos campos y marcar el cierre de sesiones. Confirmar una sola vez. Si aparece conflicto, recargar primero; no reenviar ciegamente.

Comunicar la contraseña por el canal seguro acordado, sin pegarla en este informe o Git. Juan iniciará sesión de nuevo con su mismo correo y podrá cambiarla en Mi cuenta usando la que recibió como actual. Verificar que sus sesiones antiguas reciban 401 y que correo/rol/estado/vínculo sigan iguales. No se ejecutó este procedimiento con Juan.

## Siguiente documento / Siguiente trabajo recomendado

Revisar esta entrega y aprobar por separado el procedimiento de migración exclusiva y despliegue compatible con cv. Solo después autorizar, si corresponde, el primer restablecimiento real de Juan. Mantener US-013/OSRM en su estado previo, sin nuevas operaciones de infraestructura.

[← Volver al README principal](../../../../README.md)
