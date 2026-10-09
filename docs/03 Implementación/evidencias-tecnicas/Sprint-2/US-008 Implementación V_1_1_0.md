# US-008 — Implementación provisional y verificación Docker V_1_1_0

La migración pendiente descrita en este informe se aplicó posteriormente con autorización expresa; consultar [la evidencia de migración y pruebas reales](US-008%20Migración%20local%20V_1_1_0.md). Se conserva aquí el estado de la implementación anterior.

## Trazabilidad y alcance

HGR-26 / US-008 / RF-006 / EP-02 / ST-009. Rama feature/us-008-gestion-conductores, checkout original C:\Users\HP\Desktop\DistriRapido. Complementa el diseño previo, sin reemplazarlo.

La instrucción de implementación autoriza decisiones técnicas provisionales: gestión por Administrador y Operador / Técnico; cuenta opcional; ACTIVO/INACTIVO; vinculación solo al rol Usuario Final / Conductor; US-007 y US-009 fuera de alcance. No constituye validación formal del equipo ni cambia unilateralmente los documentos fuente. RF-006, US-008 y la matriz se conservan. El documento de datos propone DISPONIBLE/NO_DISPONIBLE/INACTIVO y horarios/coordenadas iniciales obligatorios; el modelo implementado separa ficha administrativa y omite dichos datos operativos. Esta diferencia requiere ratificación y coordinación con US-009 antes de cerrar la historia.

## Login: diagnóstico comprobado

No se reprodujo el fondo ausente en Docker antes de modificar la aplicación: .login-background calcula la URL /assets/login-landscape-DhUmexbi.png, usa cover/center y altura de pantalla; Nginx responde 200 image/png, 1956444 bytes. SHA-256 del recurso HTTP coincide exactamente con src/frontend/src/assets/login-landscape.png. No había una causa CSS demostrada que justificara alterar AuthLayout, imagen o estilos del login. Se mantuvieron y se añadió regresión E2E del recurso; después de reconstruir la imagen el fondo continúa cargando. Si otra ventana conserva un bundle anterior, recargar sin caché y confirmar que usa localhost:5173 de este Compose; no se afirma que la caché fuese la causa observada por el usuario.

## Archivos creados o reutilizados

Backend:
- prisma/schema.prisma: Conductor y relación opcional uno-a-uno con Usuario.
- prisma/migrations/202610090001_us008_conductores/migration.sql: tabla, índices únicos DNI/cuenta, FK restrictiva, check experiencia/estado. Aditiva, NO aplicada.
- src/drivers/dto/driver-data.dto.ts y su spec: reutilizados los 18 casos previos, sin duplicarlos.
- src/drivers/dto/driver.dto.ts: alta, PATCH parcial y consulta paginada.
- src/drivers/drivers.module.ts, drivers.controller.ts, drivers.service.ts, drivers.guard.ts y drivers.spec.ts.
- src/app.module.ts: registro de DriversModule.

Frontend:
- types/drivers.ts, services/drivers-api.ts, pages/DriversPage.tsx.
- features/drivers/DriverForm.tsx y DriverForm.test.tsx.
- layouts/DriversLayout.tsx, e2e/drivers.spec.ts.
- layouts/AppLayout.tsx, routes/AppRoutes.tsx, routes/ProtectedRoute.tsx: menú y rutas autorizadas.
- services/api.ts: errores propios de conductores, conservando contratos de usuarios/pedidos.
- styles/app.css: estilos específicos de formulario/filtros/detalle responsive.
- La corrección local de espera en features/orders/DeliveryMap.test.tsx es ajena a US-008 y queda fuera del commit de esta historia; no cambia el mapa de producción.

## Funcionalidad y contratos

GET /drivers: page (1..1000000), pageSize (1..100), search nombre/DNI, estado; respuesta items/total/page/pageSize. Total mediante count independiente de la página. GET /drivers/:id consulta ficha. POST /drivers alta; PATCH /drivers/:id edición, cambio ACTIVO/INACTIVO o desvinculación con usuario_id:null. No hay DELETE, vehículos, horarios, rutas ni disponibilidad por jornada.

Datos obligatorios: nombre_completo (150), dni (20), licencia_categoria (20), telefono (30), experiencia entera 0..32767. Normaliza espacios exteriores. No inventa categoría de licencia, DNI de ocho dígitos o vencimientos. Cuenta UUID opcional validada contra rol existente; el usuario se crea/gestiona en US-003, no automáticamente aquí. La interfaz permite introducir el UUID de una cuenta ya existente sin otorgar al Operador acceso al listado administrativo de usuarios.

JWT/cookie HttpOnly y guard de origen existentes; guard propio de roles y rutas frontend. 400 datos/rol de vinculación inválidos, 401 sin sesión, 403 rol/origen prohibido, 404 inexistente, 409 duplicado DNI/cuenta. 503 si falta tabla/columna por migración pendiente. Respuestas de fichas no incluyen cuentas completas, contraseñas o hashes. DNI/teléfono se muestran únicamente a los gestores autorizados. Los datos sintéticos pertenecen exclusivamente a pruebas.

Un riesgo restante es cambiar posteriormente el rol de una cuenta vinculada desde US-003: alta/edición de ficha verifica el rol actual, pero esta implementación no cambia UsuariosService para impedir todos los cambios posteriores. Hay que acordar esa invariancia entre módulos y añadir su prueba antes de cierre. Un índice único resuelve colisiones de DNI/cuenta en base; el catálogo de categorías y reglas de transición adicionales siguen sin definirse.

## Pruebas ejecutadas

- Backend: 22 suites, 284 pruebas aprobadas; incluye 41 de conductores (18 previas y 23 nuevas), DTO/servicio/HTTP/guard y Prisma simulado. Lint completo, tsc --noEmit y build aprobados.
- Frontend: 19 suites, 226 pruebas aprobadas; tres pruebas nuevas del formulario. Lint, typecheck y build aprobados.
- E2E Conductores/login: 16 aprobadas contra frontend Docker, API simulada, 390/768/1366/1440 px, registro/consulta/edición/estado, roles permitidos y denegados, recurso PNG real. No prueban persistencia real.
- Primer montaje HTTP de pruebas carecía de ConfigModule global; se corrigió. El rol con tilde debía codificarse en el header ficticio. Primera E2E buscaba el enlace móvil sin abrir menú; se corrigió. Una pasada Vitest falló al iniciar un worker forks; repetición con threads aprobó la suite completa. No se ocultaron fallos ni se desactivaron pruebas.
- Regresión Docker: 28 E2E adicionales aprobadas (login/fondo en cuatro tamaños, panel administrativo, navegación/logout y consulta/filtros/detalle de pedidos) con API simulada. Total E2E ejecutadas y aprobadas: 44. No se ejecutó integración con escritura en PostgreSQL real ni login con credenciales reales.

## Docker y base existente

Compose validado con config --quiet. Dockerfiles ya usan src/backend y src/frontend, contexto raíz selectivo y .dockerignore; no se cambiaron Dockerfiles/Compose. Ambos builds Docker aprobados. Actualización únicamente de backend/frontend con up -d --no-deps; comando API node dist/main.js sin migrate deploy. No se ejecutaron migraciones ni bootstrap/reset/down/volúmenes.

Backend 3000 y frontend 5173 activos; PostgreSQL 5433 del host permanece saludable, con el mismo ID b9412bfd92d508d4a7fd393857bd826d549e0561bd83b938cb118e21c5c18415. GET /auth/me, /drivers y /orders sin sesión devuelven 401. Una consulta de lectura mediante Prisma confirma P2021: la tabla conductores todavía no existe. No hay persistencia real de US-008 disponible hasta aplicar migración con autorización.

Las imágenes se construyeron solo localmente y contienen recursos geográficos privados; no publicar imágenes, dist o geometrías mientras no se acrediten permisos INEI. Guard de Git aprobado. No hubo staging/commit/push ni cambios en carpetas antiguas backend/frontend, .env, credenciales, US-007/US-009 o proyecto Óptica Bangalore.

## Verificación local y migración pendiente

Abrir http://localhost:5173/login y recargar sin caché. Iniciar sesión con cuenta propia Administrador u Operador; abrir Conductores en el menú (Abrir menú en móvil) o http://localhost:5173/conductores. Antes de migrar se mostrará el error de habilitación pendiente; no se presentará una lista vacía ficticia. El formulario nuevo puede abrirse, pero guardar no persistirá hasta habilitar la tabla.

Revisar el SQL en prisma/migrations/202610090001_us008_conductores/migration.sql y obtener autorización expresa antes de aplicarlo. El borrador SQL inicial en docs es histórico, bloqueado y no debe ejecutarse. Probar primero una base aislada, revisar restricciones y registrar pruebas de persistencia/duplicados. La aprobación de implementación no autoriza ejecutar esta migración. Los criterios de registro/edición persistidos aún no están verificados y US-008 no está cerrada.

## Siguiente documento / Siguiente trabajo recomendado

Ratificar acuerdos provisionales y alcance de coordenadas; definir coordinación del rol de cuentas vinculadas con US-003. Autorizar por separado la migración tras revisión, verificar persistencia y aceptación en entorno aislado y adjuntar evidencia HGR-26 antes de cerrar US-008.
