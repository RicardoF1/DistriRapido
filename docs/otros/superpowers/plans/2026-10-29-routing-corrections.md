# Correcciones del incremento de rutas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Ejecución inline con TDD y revisión final independiente; sin commits ni migraciones en desarrollo.

**Goal:** Resolver los pendientes del informe 04 y verificar el incremento antes de habilitar datos públicos.

**Architecture:** Conservar snapshots/versiones y adaptador OSRM; corregir validación, advertencias y límite transaccional. Preparar configuración privada opcional, sin cambiar recursos existentes.

**Tech Stack:** NestJS/Prisma/PostgreSQL, React/Leaflet, OSRM configurable; sin nuevas dependencias.

**Spec:** `docs/otros/superpowers/specs/2026-10-29-routing-osrm-design.md` y `docs/03 Implementación/evidencias-tecnicas/Sprint-3/04 Auditoría del incremento parcial de rutas V_1_1_0.md`.

## Global Constraints

- Preservar todos los cambios locales y las credenciales/vínculo/panel de Juan.
- No aplicar migraciones ni modificar datos públicos; escrituras de pruebas únicamente aisladas.
- No US-014/015/016/017, algoritmo genético o restablecimiento de contraseñas.
- No publicar recursos INEI, secretos, commits, push o merge.

## Review Focus

- Un historial solicitado no puede devolver otra versión por un entero inválido.
- Un resultado completado obtenido mediante GET debe liberar el draft igual que un POST completado.
- Geometría inválida produce error visible, sin mapa sustitutivo ni excepción de Leaflet.
- La transacción debe abortar si el plazo total vence, incluso tras insertar el resultado antes del commit.
- Los snapshots siguen inmutables; los cambios actuales se comunican como advertencias sin recalcular.

## Pasos

- [x] Respaldo y evidencia de estado inicial; comprobar datos públicos por hash.
- [x] RED: mock Response, versión no positiva/no entera, refresh completado, geometría corrupta y deadline de cierre.
- [x] GREEN frontend: fábrica Response por petición, estado de draft y validación compartida del mapa.
- [x] GREEN backend: versión estricta, comparación histórica completa, presupuesto restante en transacciones y publicación.
- [x] Compatibilidad CI: guard común de aislamiento para base terminada en _test o schema autorizado; prueba de rechazo de public/desarrollo.
- [x] Revisión de idempotencia, permisos y errores; pruebas PostgreSQL real aislado de rollback, historial y límite de tiempo.
- [x] Configuración privada OSRM opcional y documentación de datos viales/recursos/migración/reversión; no iniciar infraestructura ni migrar desarrollo.
- [x] Lint/tipos/build, suites backend/frontend/integración/E2E, regresión real de Juan y revisión independiente.
- [x] Informe final, archivos modificados, hashes públicos idénticos y aprobación pendiente para habilitación.

## Siguiente documento / Siguiente trabajo recomendado

Informe de correcciones y preparación de infraestructura con resultados reales y autorización específica pendiente antes de aplicar la migración o escribir datos de desarrollo.

[← Volver al README principal](../../../../README.md)
