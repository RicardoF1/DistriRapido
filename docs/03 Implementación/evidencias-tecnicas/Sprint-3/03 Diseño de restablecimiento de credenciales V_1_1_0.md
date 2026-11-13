# Diseño de restablecimiento de credenciales — etapa 2

Versión documental: V_1_1_0. Fecha: 2026-10-29. Estado actualizado: diseño aprobado para implementación de etapa 2; código y migración independiente preparados y probados únicamente en PostgreSQL aislado. Desarrollo no migrado y credenciales reales sin cambios. El texto siguiente conserva la formulación del diseño original; los resultados y la ampliación de cambio propio se registran en `06 Gestión de credenciales de conductores V_1_1_0.md`.

## Situación y alcance

La etapa 1 permite crear y vincular una cuenta Conductor. No permite consultar contraseñas, restablecerlas, borrar cuentas ni desvincularlas automáticamente. La autenticación existente firma JWT HS256 con `sub`, emisor y audiencia; comprueba usuario activo y rol en cada petición. La cookie HttpOnly conserva el token. Actualmente no existe una versión persistida de credenciales que revoque todos los tokens de una cuenta tras un cambio de contraseña.

El restablecimiento debe limitarse al Administrador y a la cuenta actualmente vinculada al conductor seleccionado. No cambiará roles, vínculos, estado del usuario ni asignaciones. La cuenta de Juan solo podrá cambiarse mediante una acción futura explícita y autorizada; no se ejecutará como parte del despliegue o de un seed.

## Contrato propuesto

`POST /drivers/:id/account/reset-password`, protegido por JWT, AdministratorGuard, RequestOriginGuard y limitación de frecuencia. DTO: nueva contraseña, `expected_usuario_id` y `expected_credentials_version`, más confirmación explícita. El servidor comprobará que el vínculo sigue siendo el esperado y que el rol es Conductor. No se aceptará un usuario objetivo arbitrario, correo ni rol impuestos por el cliente.

La pantalla mostrará correo/estado para confirmar el destinatario, dos campos de nueva contraseña y una advertencia de cierre de sesiones anteriores. La confirmación se reiniciará al cambiar de destinatario. No se mostrará ni recuperará la contraseña existente. Los campos nuevos no se guardarán en localStorage/sessionStorage, URL, logs, capturas ni documentación; se limpiarán al cancelar o terminar. No se enviarán correos automáticamente sin un canal y autorización definidos.

Validación servidor y navegador: cadena de 12 a 128 caracteres, sin truncamiento ni recorte silencioso; confirmación idéntica en la interfaz. Reutilizar Argon2id y los parámetros existentes, probar hashes reales sin exponerlos. Rechazar una nueva contraseña idéntica a la actual mediante verificación Argon2id. Una política adicional de contraseñas comprometidas quedaría sujeta a aprobación; no introducir una consulta externa obligatoria.

Respuesta 200 con confirmación y proyección mínima de cuenta; nunca contraseña, hash ni JWT. Errores: 400 datos/rol inválidos, 401 sesión revocada, 403 rol/origen no autorizado, 404 conductor/cuenta ausente, 409 vínculo o versión obsoletos y 429 límite de solicitudes. Mantener el filtro de excepciones sanitizado.

## Prisma y atomicidad propuestos

Añadir a `Usuario` un entero `credentials_version` no nulo con valor predeterminado 0 mediante migración SQL aditiva revisada, respaldada y autorizada por separado. Sin borrar registros ni modificar hashes existentes. No generar esta migración durante la etapa 1.

Calcular Argon2id, y en una transacción Serializable volver a comprobar conductor, vínculo, rol y versión. Actualizar contraseña e incrementar versión de forma condicional en la misma escritura. Si la condición falla o hay conflicto serializable: rollback y 409, sin reintentar automáticamente ni sobrescribir otra solicitud administrativa. Registrar solo actor, objetivo, fecha y resultado en el mecanismo de auditoría que se acuerde, sin registrar cuerpos, cookies, contraseñas o hashes.

## JWT y compatibilidad

Login firmará `cv` con la versión usada al comprobar la contraseña. `authenticate` comparará `cv` con la versión actual de PostgreSQL además de los controles actuales. Una versión distinta devolverá 401 tanto por cookie como por Bearer. No se devolverá `cv` como autoridad suministrada por el navegador.

Compatibilidad de transición: un JWT firmado anterior sin `cv` se interpretará como versión 0 exclusivamente cuando la cuenta conserve versión 0. Un claim presente debe ser entero seguro, no negativo y del tipo correcto; no convertir cadenas ni valores nulos a 0. El primer restablecimiento incrementará la cuenta a 1 y rechazará todos sus tokens anteriores, incluidos los que carezcan del claim. Las sesiones de otras cuentas seguirán activas. La compatibilidad con la cookie heredada se conservará, pero la misma comparación de versión se aplicará a cualquier transporte de token.

Carrera login/reset: el login debe firmar la versión del registro cuya contraseña verificó; si hubo un reset durante el hash, ese token antiguo fallará en la siguiente petición. No volver a leer solo la versión después de verificar una contraseña anterior. Una petición ya autorizada/en curso antes del reset no se cancela retroactivamente; una nueva petición con el token anterior debe fallar. No prometer revocación retroactiva de operaciones en curso.

Orden de despliegue: respaldo y revisión, migración aditiva compatible, backend que emite/verifica `cv`, frontend de reset, habilitación de la operación tras verificación. Un rollback a un backend que ignore `cv` reaceptaría tokens revocados: se debe impedir ese rollback o mantener deshabilitado el acceso hasta desplegar un backend compatible. No rotar el secreto global como solución habitual, pues cerraría las sesiones de todos.

## Archivos previstos y pruebas

- Prisma: `src/backend/prisma/schema.prisma` y nueva migración aditiva, todavía sin nombre/archivo creado.
- Backend: `src/backend/src/auth/auth.service.ts`, pruebas de autenticación, DTO de reset y servicio/controlador de cuentas; extraer el hash reutilizable del servicio de usuarios a PasswordService si se aprueba para evitar divergencias.
- Frontend: `DriverAccountsPanel.tsx`, `drivers-api.ts` y sus pruebas; solo el Administrador verá el control de reset.
- Pruebas unitarias/HTTP: permisos de los cuatro roles, origen, validaciones, no exposición de secretos, cookies/Bearer y JWT con versión ausente/válida/inválida/obsoleta.
- PostgreSQL aislado: cambio atómico hash/versión, rollback, dos resets simultáneos, vínculo cambiado durante operación y conservación de cuentas ajenas.
- Navegador: confirmación explícita, errores, borrado de campos, ausencia de persistencia, sesión anterior 401 y nuevo login válido. Regresión de login/logout y conservación de otras sesiones.

## Siguiente documento / Siguiente trabajo recomendado

Revisar y aprobar este diseño y su política de contraseñas con el equipo. Solo después preparar la migración aditiva y solicitar autorización específica para aplicarla al entorno elegido con respaldo verificable.

[← Volver al README principal](../../../../README.md)
