# Primer incremento de rutas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline. No commits, worktrees ni publicación.

**Goal:** Preparar pedidos y recursos, calcular secuencias mediante OSRM y consultar resultados persistidos, sin asignaciones ni algoritmo genético.

**Architecture:** Snapshot inmutable de planificación, ejecución idempotente y cierre transaccional corto. Adaptador de routing configurable; lecturas independientes del proveedor. React/Leaflet con confirmación explícita y proyecciones seguras.

**Tech Stack:** Prisma/PostgreSQL, NestJS, TypeScript, React, Leaflet y OSRM. Sin dependencias nuevas previstas.

**Spec:** `docs/superpowers/specs/2026-10-29-routing-osrm-design.md`, aprobado por el usuario.

## Global Constraints

- No modificar datos públicos ni cuentas/panel de Juan. Preservar todos los cambios locales.
- Migración aditiva solo para revisión en desarrollo; aplicar únicamente a esquema de pruebas aislado autorizado.
- Máximo 30 pedidos, un vehículo candidato, origen/orden/modalidad final confirmados; recursos reales del entorno consultado.
- OSRM opcional/configurable; no enviar puntos de clientes a proveedor público implícitamente ni modificar .env existente.
- No algoritmo genético, asignaciones, cambios de estado de pedidos ni resultados inventados.

## Review Focus

- Entradas concurrentemente modificadas: no publicar ruta de un snapshot obsoleto.
- Doble clic/reintento: una clave de idempotencia no puede crear resultados duplicados.
- Errores de proveedor: sin geometría parcial, métricas de relleno o falsos vacíos.
- Formularios: cambiar origen/orden/final invalida confirmaciones; conservar borrador ante errores.
- Cobertura/rol: bloquear nuevas escrituras cuando no son verificables, sin afectar login/lecturas previas.

## Task 1 — Persistencia y dominio

Files: schema.prisma, migración aditiva nueva; planning/dto, planning-domain.ts y pruebas. Inputs: IDs reales, punto, jornada, atención, orden, finales explícitos. Output: PreparedSnapshot + hash estable, reglas de validación.

- [ ] Respaldo verificable del trabajo previo; inventario de recursos protegidos sin mostrar secretos.
- [ ] RED: snapshot/orden/horarios/volumen/huellas/confirmaciones.
- [ ] GREEN: modelos/versiones y dominio; generar cliente Prisma sin ejecutar migraciones en desarrollo.

## Task 2 — Adaptador y API backend

Files: routing/osrm.adapter.ts, planning.service/controller/module/dto, routes.service/controller/dto, app.module.ts y pruebas. Interface: calculate(points)->verified result; prepare/update/calculate/list/get con actor y DTOs.

- [ ] RED: permisos, cobertura, preflight, errores, geometría, idempotencia y transacciones.
- [ ] GREEN: snapshot de datos reales, ejecución acotada con propietario/vigencia, cálculo fuera de transacción y cierre con revalidación/bloqueos.
- [ ] Probar PostgreSQL real en esquema aislado: aplicar migración solo allí, rollback, concurrencia, historial y conservación de datos públicos.

## Task 3 — Interfaz

Files: PlanningPage, RoutesPage, RouteDetailPage, RouteMap, API/tipos, navegación y pruebas React/E2E.

- [ ] RED: selección y tres confirmaciones explícitas, invalidación al editar, carga/error/vacío, roles y responsive.
- [ ] GREEN: formularios con origen Leaflet/Photon y destino explícitos, secuencia editable y atención; cálculo administrativo, mapa persistido solo lectura.
- [ ] E2E mock intercepta todas las escrituras, sin cuentas ni rutas públicas.

## Task 4 — Verificación y entrega

- [ ] Lint/typecheck/unitarias/integración/build y E2E; no atribuir mocks a proveedor real.
- [ ] Revisión independiente del incremento y corrección de hallazgos.
- [ ] Informe con migración pendiente, configuración OSRM, pruebas reales/no ejecutadas, instrucciones navegador y estado Git.
- [ ] diff --check y protección de secretos/recursos geográficos; ninguna publicación.

## Siguiente documento / Siguiente trabajo recomendado

Informe del primer incremento y revisión de la migración pendiente. Solicitar autorización específica antes de aplicarla a desarrollo o generar rutas allí.
