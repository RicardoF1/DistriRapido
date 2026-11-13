# Panel y acceso preparatorio del conductor V_1_1_0

Fecha: 29/10/2026, America/Lima. Fase preparatoria autorizada; no implementación ni cierre de US-013, US-014, US-015, US-016 o US-017.

## 1. Estado y alcance

Rama local `main`, HEAD `128af98b7021655c39160a92121087023ed3f931`, sin commits adicionales, push ni merge remoto. Se preservaron los avances locales anteriores del login, integración, mapa y pruebas. No se crearon clones ni worktrees.

Se implementó un panel personal en `/acceso/conductor`, con identidad verificada por el servidor, secciones informativas Mi jornada, Mis rutas y Mis entregas, navegación móvil y cierre de sesión existente. No se muestran rutas, paradas, pedidos, disponibilidad ni cantidades ficticias. La ausencia del módulo de asignaciones no se presenta como una consulta real sin rutas.

## 2. Cuenta local autorizada

| Dato | Valor |
|---|---|
| Ficha existente | `25736302-6c05-40e1-b6da-3de477241136` |
| Nombre existente | `juan` |
| Estado de ficha | ACTIVO |
| Correo local | `juan.conductor@ecoruta.test` |
| Cuenta creada | `419e42e5-5f7f-4061-8e89-af0dafd15f14` |
| Rol | Usuario Final / Conductor |
| Estado de cuenta | ACTIVO |
| Vínculo | `Conductor.usuario_id` apunta a esa cuenta |

Antes de escribir se comprobó que Juan era único y activo, sin vínculo, y que no existía una cuenta equivalente. Se reutilizó `UsersService.create` dentro de una transacción Prisma serializable, con contraseña aleatoria y hash Argon2id del servicio existente. La vinculación fue condicional a ficha activa y usuario_id nulo; un fallo habría revertido también la cuenta. Se creó exactamente una cuenta en public y ningún conductor nuevo.

La contraseña no está en este documento, código ni archivos versionados. Se almacena cifrada mediante DPAPI de Windows como PSCredential en `.local/credentials/juan-driver.credential.xml`, recuperable únicamente bajo el mismo usuario de Windows en esta computadora. No se modificaron .env ni contraseñas existentes.

### Uso privado de la contraseña

Ejecutar localmente en PowerShell, sin transcribir el valor de la contraseña:

```powershell
$cred = Import-Clixml -LiteralPath 'C:\Users\HP\Desktop\DistriRapido\.local\credentials\juan-driver.credential.xml'
Set-Clipboard -Value ($cred.GetNetworkCredential().Password)
$cred = $null
```

Pegar en el campo Contraseña del login. Después de pegar, vaciar el portapapeles con `Set-Clipboard -Value ''`. No copiar la credencial a Git ni a documentación compartida. Si el archivo cifrado se pierde, no crear otra cuenta ni restablecer automáticamente: solicitar autorización para cambiar la contraseña de esta misma cuenta.

## 3. Backend y seguridad

Endpoint nuevo: **GET `/driver/me`**, dentro del DriversModule existente.

- JwtAuthGuard valida firma, caducidad, usuario activo y rol actual usando la base de datos.
- DriverProfileService exige el rol técnico de conductor y busca por el usuario_id autenticado, nunca por un identificador del navegador.
- Revalida existencia del vínculo, ficha activa, cuenta activa y rol de la cuenta vinculada.
- Responde únicamente conductor_id, nombre_completo y estado; sin DNI, teléfono, contraseña, hash ni datos de terceros.
- `Cache-Control: no-store`; no admite parámetros de consulta.
- 401: sin sesión, token inválido/expirado o cuenta inactiva.
- 403: rol incorrecto, ficha no vinculada o ficha inactiva; mensajes diferenciados para estos bloqueos.
- 400: parámetros de consulta, incluidos IDs manipulados. No existe un endpoint de perfil por ID ajeno.
- Un fallo del servidor se muestra como error, sin simular identidad ni listas vacías.

Se reutilizan POST `/auth/login`, GET `/auth/me` y POST `/auth/logout`, JWT y cookie HttpOnly. No se modificaron guards de administración ni pedidos generales. Conductor sigue sin acceso a users, roles, drivers administrativos, vehicles, availability, orders y admin/summary. Administrador no obtiene acceso a `/driver/me` con su propio rol.

La limitación de solicitudes permanece activa en producción. Los clientes sintéticos de las pruebas aisladas se distinguen mediante IPs documentales en el harness; no se deshabilitó throttling ni autorización en la aplicación real.

## 4. Interfaz

Ruta exacta protegida `/acceso/conductor`, con AppLayout y cierre de sesión reutilizados. Identidad y estado **administrativo** provienen de la respuesta autorizada; no se equipara ACTIVO con disponibilidad horaria.

- Mi jornada: informa que la consulta de disponibilidad se habilitará después; no consulta el endpoint administrativo.
- Mis rutas: muestra «La consulta de rutas estará disponible cuando se implemente el módulo de asignaciones».
- Mis entregas: indica que consulta y registro estarán disponibles próximamente; no ofrece acciones de actualización.
- Vínculo ausente e inactividad: bloquean el contenido operativo con mensajes propios.
- Error de red/servidor: mensaje y reintento. 401: se descarta la sesión cliente y se regresa al login.
- Navegación por anclas, menú plegable, diseño móvil y tarjetas en dos columnas cuando hay espacio.

No se añadió PWA, modo offline, trazado de rutas ni modelo de entregas; son trabajos futuros.

## 5. Archivos de esta fase

### Creados

```text
src/backend/src/drivers/driver-profile.controller.ts
src/backend/src/drivers/driver-profile.service.ts
src/backend/src/drivers/driver-profile.spec.ts
src/backend/test/driver-profile.integration.ts
src/frontend/src/services/driver-profile-api.ts
src/frontend/src/pages/DriverAccessPage.tsx
src/frontend/src/pages/DriverAccessPage.test.tsx
src/frontend/e2e/driver-panel.spec.ts
src/frontend/e2e/fixtures/driver-profile.ts
docs/otros/superpowers/plans/2026-10-29-driver-access.md
docs/03 Implementación/evidencias-tecnicas/Sprint-3/01 Panel y acceso preparatorio del conductor V_1_1_0.md
```

### Modificados

```text
src/backend/src/drivers/drivers.module.ts
src/frontend/src/routes/AppRoutes.tsx
src/frontend/src/layouts/AppLayout.tsx
src/frontend/src/services/api.ts
src/frontend/src/styles/app.css
src/frontend/src/routes/AppRoutes.test.tsx
src/frontend/src/features/orders/orders.test.tsx
src/frontend/src/features/orders/order-consultation.test.tsx
src/frontend/e2e/admin-summary.spec.ts
src/frontend/e2e/admin-welcome.spec.ts
src/frontend/e2e/availability.spec.ts
src/frontend/e2e/drivers.spec.ts
src/frontend/e2e/order-consultation.spec.ts
src/frontend/e2e/order-navigation.spec.ts
src/frontend/playwright.mock.config.ts
```

Las adaptaciones de regresión esperan el panel del conductor en lugar de la bienvenida genérica y simulan explícitamente la nueva consulta propia. Se conservan los bloqueos a módulos ajenos. Otros archivos que aparezcan modificados en Git corresponden a avances previos preservados, no a descartes o reimplementaciones de esta fase.

## 6. Pruebas y trazabilidad preparatoria

| Requisito preparatorio | Evidencia |
|---|---|
| Resolver identidad desde sesión, sin IDs ajenos | 9 pruebas HTTP backend nuevas; query manipulada 400 y perfil por ID 404 |
| Usuario/ficha/rol habilitados | Pruebas con mocks y con PostgreSQL aislado; token alterado/expirado, ficha ausente/inactiva y cuenta inactiva |
| Panel propio y estados distintos | 5 pruebas frontend nuevas; identidad, secciones, errores, reintento y sesión expirada |
| Responsive y permisos cliente | 8 E2E nuevos con API simulada, cuatro anchos y rutas administrativas bloqueadas |
| Cuenta real de Juan y sesiones | Navegador real contra Docker/PostgreSQL: identidad exacta, login, recarga, cookie HttpOnly, siete endpoints denegados y logout |
| Regresión Sprint 1/2 | Suites completas y perfil mock ampliado; no se relajan permisos ni umbrales |

Resultados ejecutados:

- Backend `typecheck`, `lint`, `test:coverage`, `build`: aprobados; **28 suites / 321 pruebas**. Cobertura global 91,50% statements, 83,65% branches, 91,25% functions y 91,83% lines.
- Backend `test:integration`: **4 suites / 87 pruebas** aprobadas exclusivamente en el esquema `distrirapido_integration_20261029_test`. Incluye datos sintéticos y fixtures independientes de cuentas de desarrollo. La primera corrida detectó rate limit compartido entre clientes de prueba; se corrigió el harness, manteniendo el control real.
- Frontend `typecheck`, `lint`, `test:coverage`, `build`: aprobados; **25 archivos / 255 pruebas**. Cobertura 87,16% statements, 81,86% branches, 86,74% functions y 93,44% lines. Las primeras expectativas de bienvenida genérica fallaron y se adaptaron al nuevo requisito.
- E2E `npm run test:e2e -- --config=playwright.mock.config.ts`: **70 aprobados**, con APIs simuladas, cobertura real local para mapa y Photon simulado. Tras el ajuste final de textos se repitieron las 5 pruebas del panel y sus 8 E2E: aprobadas.
- Verificación real de Juan: aprobada a **390, 768, 1366 y 1440 px**, sin desbordamiento horizontal, con recarga, redirección y logout. Las pruebas de estados inactivos no modifican su cuenta real: se ejecutan en el esquema aislado.
- Administrador original: login HTTP 200; users, drivers, vehicles, availability, orders y resumen HTTP 200; perfil exclusivo de conductor HTTP 403; logout HTTP 204.
- Operador: regresión HTTP con cuentas sintéticas en PostgreSQL aislado y navegación mock; no se alteró su cuenta original ni se supuso conocer su contraseña.
- Docker: imágenes construidas localmente; aplicaciones actualizadas; PostgreSQL y volumen conservados, Compose válido. No se publicaron imágenes que contienen geodata privada.
- `git diff --check` y comprobador de publicación geográfica: aprobados; índice sin recursos privados.
- Auditorías consultadas sin modificar dependencias: backend 10 vulnerabilidades (3 altas), frontend 5 (2 altas). Se mantienen pendientes; no se presentan como aprobadas.

Estos resultados acreditan esta fase preparatoria, no la aceptación de US-016/US-017 ni la existencia de consultas de asignaciones.

Revisión independiente final: lectura estática del endpoint, servicio, pruebas, panel y protección de rutas; sin hallazgos críticos, importantes o menores accionables. No reejecutó las pruebas ni accedió a credenciales o PostgreSQL. Valoración: apto para revisión humana.

## 7. PostgreSQL, respaldo y privacidad

Sin cambios en schema.prisma ni migraciones; se conservan las seis aplicadas. El único cambio en public es la nueva cuenta y usuario_id de Juan. Verificación final mediante hashes por fila:

- Usuarios: 3 originales intactos y 1 nuevo autorizado.
- Conductores: los mismos 2; Juan solo cambia usuario_id, todos sus demás campos y el otro conductor permanecen intactos.
- Roles 4, clientes 2, pedidos 2, vehículos 0 y disponibilidad 0: sin cambios.
- Historial de migraciones: 6 filas intactas.

Respaldo privado `.local/driver-panel-20261029-164120/`, con 123 archivos copiados/verificados, parche de cambios y `before-driver-panel.dump`. SHA-256 del dump: `f7164a35f25baefc36de73f41efe936c05491934aea7c3626c5f509556416c04`; listado y decodificación completa con pg_restore aprobados, sin restauración ni reinicialización. Se verificó además la conservación por hash de 106 recursos y avances previos protegidos, incluidos .env, geodata, login, test del mapa, Nginx y carpetas antiguas.

Las capturas de 390/768/1366/1440 y los auxiliares de verificación están en ese respaldo local. No contienen capturas del campo de contraseña; no deben confundirse con recursos para publicar. La credencial DPAPI permanece en `.local/credentials/` ignorada por Git.

## 8. Verificación manual

1. Abrir `http://localhost:5173/login` y usar `juan.conductor@ecoruta.test` con la contraseña copiada localmente mediante DPAPI.
2. Comprobar la redirección a `/acceso/conductor`, identidad Juan y estado administrativo ACTIVO.
3. Revisar Mi jornada, Mis rutas y Mis entregas; deben indicar disponibilidad futura, no rutas vacías supuestamente consultadas.
4. Probar menú móvil, recarga y cierre de sesión. El correo se conserva; la contraseña no se persiste.
5. Intentar acceder a `/usuarios`, `/vehiculos`, `/conductores`, `/disponibilidad` o `/pedidos`: debe regresar al espacio propio sin mostrar módulos administrativos.

No usar la base de desarrollo para pruebas que desactiven o desvinculen conductores. No ejecutar el bootstrap para recrear esta cuenta.

## 9. Riesgos y pendientes

Faltan modelos/servicios de rutas y asignaciones, consulta de disponibilidad propia, datos de entregas y transiciones por pertenencia. El futuro contrato debe diferenciar servicio no disponible, error y consulta vacía confirmada. No ampliar el endpoint administrativo de pedidos para habilitarlo.

Persisten los pendientes anteriores de auditoría de dependencias, filtros de estados de pedidos, concurrencia y permisos de redistribución INEI. No se resolvieron dentro de esta fase. Logout elimina la cookie y sesión del navegador; la infraestructura existente no revoca copias de JWT Bearer antes de su expiración.

Estado Git: cambios locales anteriores y nuevos sin commit; índice vacío; ramas y HEAD conservados. No hay push, merge remoto ni cierre automático de tickets.

## Siguiente documento / Siguiente trabajo recomendado

Revisión humana de esta interfaz y cuenta local. Después de aprobarla, acordar los contratos de rutas/asignaciones y los criterios de pertenencia y estados antes de desarrollar US-013 a US-017. No iniciar esas historias como continuación automática de esta fase.

[← Volver al README principal](../../../../README.md)
