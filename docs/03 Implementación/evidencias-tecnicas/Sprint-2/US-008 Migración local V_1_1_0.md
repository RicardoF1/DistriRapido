# US-008 — Aplicación local de migración y aceptación real V_1_1_0

## Autorización y alcance

Fecha: 2026-10-09. HGR-26 / US-008 / RF-006 / EP-02 / ST-009. Checkout original, rama feature/us-008-gestion-conductores. El usuario autorizó expresamente aplicar la migración aditiva después de revisar seguridad y generar respaldo. No autoriza publicar cambios ni modificar otros proyectos.

## Inspección previa

Contenedor distrirapido-postgres-1, base distrirapido, esquema public. Prisma mostraba tres migraciones históricas finalizadas y una única pendiente: 202610090001_us008_conductores. Conductores no existía y usuarios.usuario_id era UUID. Se revisó SQL: crea únicamente tabla conductores, índices únicos DNI/usuario, índice de estado, checks de experiencia/estado y FK restrictiva. Sin DROP/TRUNCATE/DELETE/UPDATE/ALTER de tablas existentes. Historial comparado con los SQL locales (checksum exacto o normalizado a LF); SQL pendiente en imagen Docker idéntico al revisado. El arranque API no ejecuta migraciones automáticamente.

## Respaldo privado verificable

Ruta: C:\Users\HP\Desktop\DistriRapido\.local\backups\us008-1791544308130\distrirapido-before-us008.dump

Formato pg_dump -Fc; 23657 bytes. SHA-256: 447804136412f5a30628ca4772fd89fadc9768c0f252a0f7abeb2b5cc3dd6f2c.

Se comprobó firma PGDMP, índice con pg_restore --list y decodificación de todas las entradas mediante pg_restore --file=/dev/null dentro del contenedor. No se ejecutó SQL de restauración ni se realizó un ensayo de restauración en otra base. restore-list.txt y backup-verification.json están junto al dump. El hash se volvió a verificar al finalizar. .local está ignorado por Git: el respaldo contiene datos privados y no debe publicarse ni compartirse sin autorización.

## Migración aplicada

Comando ejecutado: docker compose exec -T backend node node_modules/prisma/build/index.js migrate deploy. Solo se aplicó 202610090001_us008_conductores, tras verificar que era la única pendiente. migrate status posterior: Database schema is up to date. No se modificó el SQL aplicado ni su checksum. No hubo reset, down -v, eliminación de volúmenes, reinicios o reconstrucciones: API y frontend existentes admitieron la nueva tabla inmediatamente.

## Pruebas reales ejecutadas

Edge sobre http://localhost:5173/conductores/nuevo, sin mocks de API/Prisma. Sesión temporal JWT de cinco minutos, emitida dentro del backend para un gestor activo existente y validada por /auth/me; cookie HttpOnly aislada en contexto de prueba. No se guardó el token ni se cambió cuenta, contraseña o rol. No constituye prueba de login por contraseña.

- Registro desde el formulario: HTTP 201 y navegación al listado.
- Listado filtrado: total 1 y mismo ID.
- Consulta por ID con datos persistidos.
- Edición de nombre y experiencia: respuesta y lectura posteriores correctas.
- Desactivación INACTIVO, reactivación ACTIVO y lectura final de persistencia.

Ficha ficticia conservada para identificación: conductor_id 90a2ab53-be4d-4964-b393-a06832559ebd; DNI TEST-1791544454416; nombre PRUEBA US-008 EDITADA; teléfono SIN-DATO-PERSONAL; licencia PRUEBA; sin cuenta vinculada; estado final ACTIVO. No se utilizaron datos personales reales en la ficha y no se borraron registros. Los JSON de evidencia están en .local/us008-real-api-result.json y snapshots privados de inspección.

## Integridad posterior

Antes de la migración, después de aplicarla y después de las pruebas se compararon filas ordenadas por PK mediante SHA-256 de sus valores completos, en transacción de lectura RepeatableRead. Usuarios: 2; pedidos: 2; clientes: 2; roles: 4. Conteos y huellas idénticos: los datos existentes permanecen intactos. Solo se añadió la ficha de conductor de prueba y el registro de la migración.

Backend/frontend activos y PostgreSQL saludable. Guard de publicación y git diff --check aprobados. Sin commit/push, cambios de .env, credenciales, geometrías o volúmenes.

## Estado de aceptación y pendientes

El bloqueo por tabla ausente está resuelto; los flujos solicitados se verificaron con PostgreSQL real. Mantener ratificación formal de decisiones provisionales, separación de disponibilidad/horarios/ubicación de US-009 y coordinación con US-003 para cambios posteriores de rol de una cuenta vinculada. No se probó vinculación real de cuenta en esta ejecución; continúa cubierta por pruebas simuladas anteriores. No se declara cerrado el ticket Jira automáticamente.

## Siguiente documento / Siguiente trabajo recomendado

Revisar evidencia HGR-26 y ratificar los acuerdos provisionales. Resolver la invariancia del rol de cuentas vinculadas antes del cierre formal de US-008. Mantener el respaldo privado hasta aceptar la entrega y acordar posteriormente el tratamiento de la ficha ficticia.
