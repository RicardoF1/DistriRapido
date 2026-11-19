# US-022: Consultar indicadores

Versión documental: V_1_0_0. Fecha: 2026-11-19, America/Lima. Rama: `feature/us-022-consultar-indicadores`, creada desde `sprint-4` (`7b03bdc`, con el mismo contenido que `main`). Estado: implementado y verificado en el entorno local de desarrollo; pendiente de revisión y aceptación del equipo.

## 1. Historia y trazabilidad

| Elemento | Valor |
|---|---|
| Historia | HGR-41 · US-022 Consultar indicadores (5 SP, prioridad Media) |
| Épica | EP-05 Sostenibilidad e indicadores |
| Requisito | RF-020 Consultar indicadores de operación |
| Subtarea | ST-023 Implementar indicadores |
| Actor documentado | Supervisor |

> Como **Supervisor**, quiero **consultar indicadores de la operación**, para **evaluar los resultados de las rutas y entregas**.

| Criterio | Implementación | Evidencia automatizada |
|---|---|---|
| Escenario 1: con datos de operación procesados, el módulo muestra los indicadores disponibles | Página «Indicadores» (`/indicadores`) y `GET /operations/indicators`: indicadores de operación, de sostenibilidad e incidencias por tipo | `indicators.spec.ts`, `indicators.integration.ts`, `IndicatorsPage.test.tsx` |
| Escenario 2: al elegir un periodo válido, se muestran los indicadores de ese periodo | Filtro «Desde» y «Hasta» en días de America/Lima, guardado en la URL | Mismas pruebas (periodo de un día, periodo ampliado y valores por defecto) |
| RF-020, ruta infeliz: un periodo sin datos suficientes se informa | Mensaje «No existen datos suficientes para presentar indicadores en este periodo». Cada indicador que no se puede calcular muestra «Sin datos suficientes», nunca 0 | Mismas pruebas |

## 2. Decisiones del incremento

- **Actor Supervisor.** Como en US-019, la consulta la ejercen **Administrador** y **Operador / Técnico** con el mismo `OperationsGuard`. Conductor y Auditor Externo reciben 403. El equipo lo confirmó para esta historia.
- **Qué rutas se miden.** Solo las rutas `COMPLETADA` cuyo fin (`finalizado_en`) cae en el periodo, con su versión vigente. La historia pide «evaluar los resultados», y así cada cifra se puede reproducir. Las rutas en curso siguen en «Seguimiento operativo» (US-019).
- **Periodo.** Días completos en America/Lima (UTC−05:00); «hasta» incluye todo el día. Sin fechas se usan los últimos 30 días hasta hoy; con solo «hasta», los 30 días anteriores. Un periodo invertido, una fecha inexistente o un periodo de más de 366 días responden 400.
- **Indicadores de operación.** Rutas completadas; entregas realizadas, no realizadas y pendientes; tasa de entregas exitosas, calculada como realizadas ÷ (realizadas + no realizadas); incidencias, en total y por tipo; y duración media de la ruta, del inicio al fin.
- **Indicadores de sostenibilidad.** Se calculan a partir de `registros_sostenibilidad` (US-021): cobertura del registro (rutas con registro ÷ rutas completadas); distancia, combustible y CO₂ sumados; CO₂ por entrega exitosa; costo de combustible, solo de los registros que lo informan; y cuántos registros son estimados y cuántos medidos.
- **CO₂ por entrega.** Divide el CO₂ entre las entregas realizadas **de las rutas que tienen registro**. Dividirlo entre todas las entregas mezclaría rutas sin dato ambiental y daría una cifra engañosamente baja.
- **Sin datos suficientes.** Un indicador que no se puede calcular (por ejemplo, la tasa de éxito sin entregas atendidas o el costo sin registros que lo informen) se devuelve como `null` y se muestra «Sin datos suficientes». Nunca se muestra como 0.
- **Solo lectura y sin migraciones.** Se usan las tablas existentes. El periodo máximo de 366 días acota la consulta.

## 3. Cambios

### Backend

- `GET /operations/indicators?desde&hasta`, en el módulo `operations` de US-019, con `JwtAuthGuard`, `OperationsGuard`, `RequestOriginGuard` y `Cache-Control: no-store`.
- `IndicatorsQueryDto` admite solo `desde` y `hasta` (AAAA-MM-DD); cualquier otro parámetro se rechaza.
- `indicators.service.ts`: `indicatorsPeriod` (periodo con valores por defecto y límites) y `computeIndicators` (cálculo puro con `Prisma.Decimal` para las sumas ambientales).
- `operations.service.ts` exporta `limaDay`, `LIMA_OFFSET_MS` y `DAY_MS` para compartir la misma regla de fechas que US-019.

### Frontend

- Página `IndicatorsPage` en `/indicadores`, cargada con `lazyPage` (fragmento propio de 6,3 kB), con enlace «Indicadores» en el menú de los roles autorizados y protección en `ProtectedRoute`.
- El periodo se refleja en la URL, así que se puede compartir y funciona con Atrás y Adelante. Las fechas mal formadas de la URL se ignoran. La validación local evita consultar un rango invertido.
- Tarjetas «Operación» y «Sostenibilidad», reutilizando los estilos del resumen de US-019, y tabla de incidencias por tipo. Las tarjetas se pintan desde el inicio con «…» para reservar su espacio y evitar desplazamientos (CLS).
- Accesibilidad: etiquetas en las fechas, `aria-invalid` y mensaje con `role="alert"` en el error de rango, estado anunciado con `role="status"`, `aria-busy` durante el cálculo y tabla con cabeceras `scope="col"` en una región desplazable con nombre propio.

## 4. Verificaciones ejecutadas

| Comando o verificación | Resultado |
|---|---|
| Backend `npm run typecheck` | Aprobado |
| Backend `npm run lint` | Aprobado |
| Backend `npm run test:coverage` | 622 pruebas aprobadas en 49 suites; statements 91.73 %, branches 83.07 %, functions 87.4 %, lines 94.83 % |
| Backend `npm run test:integration` (PostgreSQL aislado `distrirapido_test`) | 151 pruebas aprobadas en 10 suites, incluida la nueva `indicators.integration.ts` (9 pruebas: roles, escenario 1 con valores exactos, periodo ampliado, periodo sin datos y periodos rechazados) |
| Backend `npm run build` | Aprobado |
| Frontend `npm run typecheck` | Aprobado |
| Frontend `npm run lint` | Aprobado |
| Frontend `vitest run --coverage --pool=forks --maxWorkers=1` | 449 pruebas aprobadas en 46 archivos; statements 89.54 %, branches 83.44 %, functions 87.08 %, lines 94.04 % |
| Frontend `npm run build` | Aprobado; `IndicatorsPage` se genera como fragmento propio de 6,32 kB (2,55 kB gzip) |
| `npm audit --audit-level=high` (backend y frontend) | **No aprobado, sin relación con US-022.** Persiste el aviso alto de `picomatch` (GHSA-fc5q-39xc-vjpf), todavía sin parche. Los lockfiles no cambian en esta rama |
| Prueba manual en navegador (base local de desarrollo) | La página abre con los últimos 30 días (21/10/2026 al 19/11/2026). Como la base local no tiene rutas completadas, informa que no hay datos suficientes y muestra «Sin datos suficientes» en los indicadores que no se pueden calcular, sin ceros engañosos. La API rechaza un periodo de más de 366 días con 400 y responde con `no-store`. Sin desbordamiento horizontal a 375 px. El escenario 1 con valores reales queda cubierto por la prueba de integración contra PostgreSQL |

**Nota del entorno local:** con Node 26 las pruebas del frontend se ejecutaron con `NODE_OPTIONS=--no-experimental-webstorage`. La CI usa Node 24.

## 5. Pendientes

- Revisión del equipo y aceptación de la historia en Jira (HGR-41).
- Resolver el aviso de `picomatch` cuando se publique una versión corregida.

[← Volver al README principal](../../../README.md)
