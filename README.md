# DistriRapido

Sistema de Gestión de Distribución y Entregas Rápidas (PFA).

## Fase 02: Planificación del Proyecto

En esta fase se realiza la transformación ágil, configuración de herramientas ALM, gestión de riesgos y presupuesto del proyecto.

- [01 Transformando a ágil V_1_0_0](./docs/02%20Planificación/01%20Transformando%20a%20ágil%20V_1_0_0.md)
- [02 Artefactos Jira V_1_0_0](./docs/02%20Planificación/02%20Artefactos%20Jira%20V_1_0_0.md)
- [03 Registro de riesgos V_1_0_0](./docs/02%20Planificación/03%20Registro%20de%20riesgos%20V_1_0_0.md)
- [04 Presupuesto del proyecto V_1_0_0](./docs/02%20Planificación/04%20Presupuesto%20del%20proyecto%20V_1_0_0.md)

## Fase 03: Implementación — Sprint 1

- [01 Informe de estado del proyecto V_1_0_0](./docs/03%20Implementación/01%20Informe%20de%20estado%20del%20proyecto%20V_1_0_0.md)
- [02 Registro de Impedimentos V_1_0_0](./docs/03%20Implementación/02%20Registro%20de%20Impedimentos%20V_1_0_0.md)
- [03 Revisión del Sprint V_1_0_0](./docs/03%20Implementación/03%20Revisión%20del%20Sprint%20V_1_0_0.md)
- [04 Retrospectiva del Sprint V_1_0_0](./docs/03%20Implementación/04%20Retrospectiva%20del%20Sprint%20V_1_0_0.md)

## Estructura de implementación

```text
prototypes/  → referencias visuales de Stitch
src/frontend/ → aplicación React + TypeScript
src/backend/ → API NestJS + TypeScript
docs/        → documentación académica del proyecto
```

## Incremento US-001

Implementados infraestructura y login email/contraseña. Instrucciones completas, decisiones y verificación en [US-001.md](docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-001.md).

Inicio local: copia `.env.example` a `.env`, configura secretos propios y ejecuta `docker compose up -d postgres`. Sigue después los README de backend y frontend. Para el conjunto en contenedores: `docker compose up --build -d`.

## Incremento US-002

Persistencia mediante cookie HttpOnly, restauración con `/auth/me` y cierre explícito mediante `/auth/logout`. PostgreSQL de DistriRapido conserva el puerto configurado 5433. Decisiones, pruebas y pasos manuales en [US-002.md](docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-002.md). `start:dev` observa los cambios en `backend/src` y reinicia el backend automáticamente; los cambios en `.env` requieren reinicio manual.

## Incremento US-003

RF-002 → US-003: listado, creación y edición de cuentas, con asignación de roles de la línea base y estados documentados; acceso exclusivo de Administrador. Sin nuevas migraciones. Informe y pasos manuales en [US-003.md](docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-003.md). La cookie anterior se migra al comprobar sesión para permitir los endpoints de administración.

## Incremento US-004

RF-003 → US-004: registrar un pedido con sus datos documentados y el cliente/destino mínimo relacionado, dentro de una transacción. Acceso de Administrador y Operador / Técnico por decisión explícita del incremento; sin equivalencia con Planificador. El registro utiliza POST /orders y /pedidos/nuevo; la consulta posterior corresponde a US-005. Nueva migración aditiva, sin bootstrap. Informe, discrepancias documentales y prueba manual en [US-004.md](docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-004.md).

Estado del Sprint 1: US-001 a US-005 completadas según confirmación del equipo. El código incorpora registro y consulta de pedidos; los informes de incrementos anteriores conservan su contexto histórico. La aceptación formal y las evidencias académicas se revisan en los entregables de implementación.


## Sprint 1 — Implementación

- [01 Informe de estado del proyecto V_1_0_0](./docs/03%20Implementación/01%20Informe%20de%20estado%20del%20proyecto%20V_1_0_0.md)
- [02 Registro de Impedimentos V_1_0_0](./docs/03%20Implementación/02%20Registro%20de%20Impedimentos%20V_1_0_0.md)
- [03 Revisión del Sprint V_1_0_0](./docs/03%20Implementación/03%20Revisi%C3%B3n%20del%20Sprint%20V_1_0_0.md)
- [04 Retrospectiva del Sprint V_1_0_0](./docs/03%20Implementación/04%20Retrospectiva%20del%20Sprint%20V_1_0_0.md)

US-005 incorpora GET /orders y GET /orders/:id, búsqueda, filtros, paginación y detalle de solo lectura. Edición y eliminación de pedidos no forman parte de este incremento.
