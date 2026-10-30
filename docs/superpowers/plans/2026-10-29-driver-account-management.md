# Gestión de cuentas de conductores — etapa 1

> Implementación inline mediante executing-plans, TDD y especificación aprobada; revisión final independiente. Sin commits ni publicación.

## Objetivo y límites

Administrador consulta correo/estado y gestiona vínculos mediante selector o creación transaccional; Operador solo ficha y existencia de vínculo. Mantener Juan y sus credenciales, todas las funciones previas y recursos privados. No ejecutar la etapa 2, cambiar contraseñas, crear migraciones, desvincular automáticamente ni tocar rutas/entregas. Las escrituras de pruebas se ejecutan en esquema aislado.

## Plan ejecutable

- [x] Protección: respaldo verificable de archivos y PostgreSQL, hashes de todas las tablas public y credencial DPAPI.
- [x] RED: pruebas HTTP de permisos en endpoints nuevos y antiguos, opciones elegibles, privacidad y confirmación de reemplazo; pruebas de selector y estado de carga sin perder vínculo.
- [x] GREEN backend: AccountController/Service/DTO dentro de DriversModule; proyección por rol, transacciones serializables, actualización condicional y UNIQUE; reutilizar UsersService con TransactionClient. Proteger cambios de rol incompatibles.
- [x] GREEN frontend: ficha sin UUID, sección administrativa separada con correo/estado, selector paginado, creación explícita, confirmación y gestión de conflictos sin mostrar secretos.
- [x] Pruebas PostgreSQL aisladas: duplicados, rollback por fallo del vínculo, vínculos concurrentes, sustitución confirmada/obsoleta, cuenta inactiva/rol incorrecto y regresión de autenticación.
- [x] Regresión: tipos, lint, suites, builds, E2E mock sobre Docker; Juan solo login/lecturas/logout, hashes de public y credencial sin cambios.
- [x] Informe de etapa 1 y diseño final de etapa 2, sin implementar endpoint de reset, versión JWT ni migración.

## Decisiones

GET `/drivers/account-options`, PUT `/drivers/:id/account`, POST `/drivers/:id/account`, solo Administrador. PUT exige expected_usuario_id nullable y confirm_replacement=true si se cambia un vínculo existente. POST solo admite ficha sin cuenta. No hay DELETE. Los endpoints antiguos no modifican vínculos: Operador recibe 403 si envía usuario_id; Administrador recibe error si intenta cambiarlo fuera de la acción dedicada. No se devuelven contraseñas ni hashes. Conflictos de escritura se devuelven como 409 para recargar, sin reintentos que eludan confirmaciones.

## Siguiente documento / Siguiente trabajo recomendado

Informe de cuentas/vinculación y diseño de restablecimiento con revocación de sesiones para aprobación específica posterior.
