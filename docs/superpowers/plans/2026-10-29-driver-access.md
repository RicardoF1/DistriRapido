# Acceso preparatorio del conductor — plan de implementación

> Implementación inline con superpowers:executing-plans y TDD; revisión independiente final de solo lectura, sin delegar implementación, commits ni publicación.

**Objetivo:** preparar identidad operativa y panel de Juan, sin implementar US-013 a US-017.

**Arquitectura:** ampliar DriversModule con un endpoint propio de lectura, derivado exclusivamente del usuario autenticado. Reutilizar JWT, cookie, AppLayout, validaciones y UsersService. No modificar Prisma ni crear migraciones.

**Especificación:** solicitud autorizada del 29/10/2026, adjunto de fase preparatoria; US-016/US-017 solo como dependencias futuras.

## Restricciones

Conservar cambios locales y recursos privados. Una sola cuenta local para Juan; ningún conductor nuevo. Contraseña cifrada con DPAPI fuera de Git. No modificar otras cuentas, pedidos, disponibilidad ni rutas. No ampliar pedidos generales ni inventar asignaciones. Sin dependencias nuevas ni trabajo de rutas.

## Tareas

- [x] Protección: verificar rama/HEAD, inventariar cambios, respaldar archivos y PostgreSQL; identificar Juan único y ausencia de cuenta equivalente.
- [x] Backend RED/GREEN: tests en `src/backend/src/drivers/driver-profile.spec.ts`; implementar servicio/controlador propios en DriversModule. GET `/driver/me`, 401 sin sesión/cuenta inactiva; 403 para rol incorrecto, sin ficha o ficha inactiva; no aceptar ID ajeno.
- [x] Frontend RED/GREEN: `DriverAccessPage.test.tsx` y `driver-profile-api.test.ts`; página específica, datos mínimos, carga/error/bloqueo/sesión expirada y mensajes exactos de funciones pendientes. Ruta exacta protegida y navegación por anclas usando AppLayout.
- [x] Cuenta local: UsersService dentro de una transacción, creación única y vínculo condicional a Juan; credencial cifrada fuera de Git. Verificar que no cambian otras filas.
- [x] Integración: HTTP con PostgreSQL en esquema aislado, E2E mock y login real de Juan sin escrituras adicionales. Regresión, tipos, lint, cobertura y build; actualizar solo aplicaciones Docker necesarias.
- [x] Informe: resultados verificables, límites, ubicación del respaldo y forma privada de consultar credencial; sin afirmar cierre de US-016/US-017.

## Riesgos que deben comprobarse

Rol o estado cambiado con JWT aún vigente; conductor desvinculado/inactivo; manipulación de IDs; fallo de red confundido con ausencia de rutas; conflictos entre perfiles de otros roles y el nuevo panel. No revocar globalmente sesiones ni revelar datos de terceros.

## Siguiente documento / Siguiente trabajo recomendado

Informe de preparación del panel con evidencias y revisión humana antes de implementar rutas/asignaciones.
