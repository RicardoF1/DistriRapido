# US-021: Registrar información de sostenibilidad

Versión documental: V_1_0_0. Fecha: 2026-11-17, America/Lima. Rama: `feature/us-021-registrar-sostenibilidad`, creada desde `sprint-4` con US-020 ya integrada (`af5af0d`). Estado: implementado y verificado en el entorno local de desarrollo; pendiente de revisión y aceptación del equipo.

## 1. Historia y trazabilidad

| Elemento | Valor |
|---|---|
| Historia | US-021 Registrar información para evaluar sostenibilidad (5 SP, prioridad Media) |
| Épica | EP-05 Sostenibilidad e indicadores |
| Requisito | RF-017 Registrar información para evaluar sostenibilidad |
| Reglas de negocio | RN-009 Factores ambientales del vehículo, RN-017 Indicadores de sostenibilidad |
| Subtarea | ST-022 Implementar registro de sostenibilidad |
| Actor documentado | Supervisor o Planificador |

> Como **Supervisor o Planificador**, quiero **registrar la información necesaria para evaluar la sostenibilidad de una planificación**, para **disponer de datos que permitan analizar sus resultados ambientales**.

| Criterio | Implementación | Evidencia automatizada |
|---|---|---|
| Escenario 1: dada una operación o planificación con datos disponibles, cuando el usuario autorizado registra la información requerida, el sistema la almacena asociada a la operación correspondiente | `POST /routes/:id/sustainability` guarda un registro en `registros_sostenibilidad` asociado a la ruta, a su versión actual, a su vehículo y al usuario que lo registra. Las emisiones las calcula el servidor. La sección «Sostenibilidad» del detalle de la ruta muestra el registro | `route-sustainability.spec.ts`, `routing.integration.ts`, `route-sustainability.test.tsx` |
| Escenario 2: dada información ambiental incompleta, cuando el usuario intenta registrar, el sistema rechaza la operación y señala la información requerida | El backend responde 400 con `code: INFORMACION_INSUFICIENTE`, un mensaje que nombra todo lo que falta y la lista `campos_requeridos`. No guarda nada. La interfaz hace la misma comprobación antes de enviar, marca cada campo con `aria-invalid` y explica el motivo | Mismas pruebas (todos los datos ausentes, cada dato por separado y valores fuera de rango) |

## 2. Decisiones del incremento

La documentación (RF-017, US-021, base de datos V_1_1_0) no fija qué datos concretos se registran. El usuario aprobó esta definición antes de programar:

- **Qué se registra.** Un registro por ruta con:

  | Dato | Obligatorio | Regla |
  |---|---|---|
  | Distancia recorrida (km) | Sí | Mayor que 0 y hasta 10 000, 3 decimales |
  | Combustible consumido (L) | Sí | Entre 0 y 100 000, 3 decimales (0 admite vehículos eléctricos) |
  | Factor de emisión (kg CO₂/km) | Sí | Entre 0 y 100, 5 decimales |
  | Origen de los datos | Sí | `ESTIMADO` (a partir del cálculo) o `MEDIDO` (dato real de la operación) |
  | Costo de combustible (S/) | No | Entre 0 y 1 000 000, 2 decimales |
  | Observaciones | No | Hasta 500 caracteres |

- **Emisiones calculadas por el servidor.** `emisiones_co2_kg = distancia_km × factor_emision_kg_co2_km`, con aritmética decimal y 4 decimales (RN-009). El cliente no puede enviarlas: la validación global rechaza campos no declarados.
- **Se reutilizan los datos que el sistema ya conoce.** `GET /routes/:id` devuelve la distancia de la versión vigente (`distancia_m`) y el vehículo de esa versión con su `consumo_km_l` y su `factor_emision_kg_co2_km`. El formulario se abre ya relleno con la distancia en km, el combustible estimado (distancia ÷ rendimiento km/L) y el factor de emisión del vehículo. El usuario solo los cambia si tiene datos medidos. El origen siempre se elige a mano, para que nadie registre como medido un dato estimado.
- **Coherencia entre el origen y el estado de la ruta.** Un dato `MEDIDO` solo existe cuando la operación terminó, así que exige una ruta `COMPLETADA`. En cualquier otro estado el backend responde 409: «Los datos medidos solo se pueden registrar cuando la ruta está completada. Registra datos estimados o espera a que la ruta termine.». Los datos `ESTIMADO` se pueden registrar desde `CONFIRMADA`. La interfaz aplica la misma regla antes de enviar y avisa junto al campo mientras la ruta no esté completada.
- **Por ruta y no por planificación.** La historia habla de «planificación», pero una planificación puede producir varias alternativas y rutas, cada una con su vehículo, su distancia y su consumo. Solo la ruta tiene un vehículo y una distancia concretos, así que el dato ambiental se registra ahí. Registrarlo por planificación obligaría a mezclar vehículos distintos en un solo valor. US-022 puede sumar los registros por planificación a través de `rutas → alternativas_ruta → ejecuciones_calculo → planificaciones_versiones`.
- **Asociación.** El registro guarda la ruta, el número de su versión actual, el vehículo y el usuario. Así US-022 (indicadores) y US-023 (historial) pueden agregar por fecha, vehículo o planificación sin recalcular.
- **Cuándo se puede registrar.** Solo en la versión actual de una ruta `CONFIRMADA`, `ASIGNADA`, `EN_CURSO` o `COMPLETADA`. Una ruta `GENERADA` responde 409 «Confirma la ruta antes de registrar su información de sostenibilidad.».
- **Un solo registro por ruta.** Un segundo intento responde 409 «La ruta ya tiene información de sostenibilidad registrada.». Evita contar dos veces la misma ruta en los indicadores. Corregir un registro queda fuera de alcance.
- **Actores.** No existen roles «Supervisor» ni «Planificador». Como en US-019 y US-020, registran **Administrador** y **Operador / Técnico** a través del `PlanningGuard` del controlador de rutas. Conductor y Auditor Externo reciben 403.
- **Diferencia con el diseño de base de datos.** El diseño V_1_1_0 prevé `indicadores_sostenibilidad` con métricas que dependen del algoritmo genético (`ahorro_vs_secuencial_pct`, `cumplimiento_ventanas_pct`), que todavía no existe. Se creó una tabla nueva, `registros_sostenibilidad`, con los datos de entrada. Los indicadores se derivarán de ella en US-022 (RN-017).

## 3. Cambios

### Base de datos

Migración aditiva `202611170002_us021_registrar_sostenibilidad`:

- Tabla `registros_sostenibilidad` con clave única en `ruta_id` y claves foráneas a `rutas`, `vehiculos` y `usuarios` (`ON DELETE RESTRICT`).
- `chk_sostenibilidad_origen`: solo `ESTIMADO` o `MEDIDO`.
- `chk_sostenibilidad_valores`: versión ≥ 1, distancia > 0 y el resto de valores no negativos.
- `chk_sostenibilidad_observaciones`: observaciones nulas o con texto real.
- Índices por fecha de registro (descendente), vehículo y usuario, pensados para las consultas de US-022 y US-023.

### Backend

- `RegisterSustainabilityDto` valida formato y rangos con mensajes en español. Los cuatro datos obligatorios se comprueban en el servicio para devolver la lista completa de lo que falta en una sola respuesta.
- `RouteSustainabilityService.register` trabaja en una transacción `Serializable` con bloqueo `FOR UPDATE` sobre la ruta, igual que la confirmación. Si dos registros llegan a la vez, la clave única convierte el segundo en el mismo 409.
- `GET /routes/:id` devuelve además `sostenibilidad` y, en cada versión, los datos ambientales del vehículo (`placa`, `consumo_km_l`, `factor_emision_kg_co2_km`) para la precarga.
- `HttpExceptionFilter` deja pasar en `/routes` el código `INFORMACION_INSUFICIENTE` y `campos_requeridos`. Solo admite una lista corta de nombres de campo, nunca texto libre.

### Frontend

- `RouteSustainabilityPanel`: formulario con etiquetas, campos obligatorios marcados con «*», vista previa de las emisiones en un `<output>`, bloqueo de doble envío y errores con `role="alert"`. En los 409 ofrece «Recargar ruta».
- `route-sustainability.ts`: precarga, comprobación de datos y mensajes, con los mismos nombres y reglas que el backend.
- La sección «Sostenibilidad» del detalle de la ruta muestra el registro, el formulario o el motivo por el que todavía no se puede registrar.

## 4. Verificaciones ejecutadas

| Comando o verificación | Resultado |
|---|---|
| Backend `npm ci` | Aprobado |
| Backend `npm run typecheck` | Aprobado |
| Backend `npm run lint` | Aprobado |
| Backend `npm run test:coverage` | 609 pruebas aprobadas en 48 suites; statements 91.65 %, branches 82.46 %, functions 87.34 %, lines 94.82 % |
| Backend `npm run test:integration` (PostgreSQL aislado `distrirapido_test`) | 141 pruebas aprobadas en 9 suites. La nueva prueba de `routing.integration.ts` cubre la ruta sin confirmar, la información incompleta (toda y por campo), el valor fuera de rango, el campo no permitido, el registro, el duplicado y las restricciones `CHECK` |
| Backend `npm run build` | Aprobado |
| `prisma migrate diff` (base de prueba frente a `schema.prisma`) | Sin diferencias en `registros_sostenibilidad`; solo aparecen diferencias previas de `actualizado_en` en otras tablas |
| Frontend `npm run typecheck` | Aprobado |
| Frontend `npm run lint` | Aprobado |
| Frontend `vitest run --coverage --pool=forks --maxWorkers=1` | 436 pruebas aprobadas en 45 archivos; statements 89.3 %, branches 82.95 %, functions 86.74 %, lines 93.87 % |
| Frontend `npm run build` | Aprobado |
| Frontend `npm ci` | **No ejecutado localmente.** Un servidor de desarrollo de otra sesión estaba usando `src/frontend/node_modules`. `package.json` y `package-lock.json` no cambian respecto de `sprint-4`, así que la CI lo ejecutará sobre el mismo lockfile |
| `npm audit --audit-level=high` (backend y frontend) | **No aprobado, sin relación con US-021.** Persiste el aviso alto de `picomatch` (GHSA-fc5q-39xc-vjpf), todavía sin parche. Los lockfiles no cambian en esta rama |
| Prueba manual en navegador (ruta `CONFIRMADA` de prueba, base local) | Aprobada. El formulario se abrió precargado con 2.08 km, 0.208 L y 0.2 kg CO₂/km (distancia de la ruta y datos del vehículo), con una vista previa de 0.416 kg CO₂. Escenario 2: sin origen de los datos, la interfaz marcó el campo e indicó «Falta información requerida: origen de los datos»; la API respondió 400 `INFORMACION_INSUFICIENTE` con los cuatro campos cuando el cuerpo llegó vacío, y 409 a un dato `MEDIDO` sobre una ruta no completada. Escenario 1: con origen «Estimado» el registro se guardó y el detalle mostró emisiones, vehículo, versión, fecha y usuario. Un segundo registro respondió 409 |

**Nota del entorno local:** con Node 26 las pruebas del frontend se ejecutaron con `NODE_OPTIONS=--no-experimental-webstorage`. La CI usa Node 24. La integración se ejecutó contra la base aislada `distrirapido_test`, con `JWT_SECRET` aleatorio como en la CI.

## 5. Pendientes

- Revisión del equipo y aceptación de la historia en Jira.
- US-022 debe calcular sus indicadores a partir de `registros_sostenibilidad`.
- Si se necesita corregir un registro, hará falta una historia propia (con trazabilidad del cambio).
- Si el equipo crea los roles «Supervisor» o «Planificador», basta con añadirlos a `PlanningGuard`.

[← Volver al README principal](../../../README.md)
