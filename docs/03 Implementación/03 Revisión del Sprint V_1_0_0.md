# Revisión del sprint

**Nombre del Proyecto:** Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo

**Líder del Proyecto:** Pendiente de confirmación por el equipo

| Campo | Detalle |
|---|---|
| Proyecto | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| Repositorio | DistriRapido / Huancayo GreenRoute Logistics |
| Versión | V_1_0_0 |
| Fecha de elaboración | 02/10/2026 |
| Alcance | Sprint 1: US-001 a US-005 |

## Objetivo del Sprint

Entregar acceso autenticado, administración de usuarios y roles, registro y consulta de pedidos correspondientes a US-001 a US-005. Esta descripción refleja el alcance confirmado para esta entrega; las fechas, asistentes y acta de una reunión formal no están registrados.

## Historias de Usuario completadas en este Sprint

| Historia completada | Funcionalidad verificable | Evidencia del repositorio |
|---|---|---|
| US-001 — Iniciar sesión | Autenticación email/contraseña, identidad mediante GET /auth/me y rechazo de credenciales inválidas. | [Auth](../../backend/src/auth/auth.controller.ts), [prueba de login](../../frontend/e2e/login.spec.ts) |
| US-002 — Cerrar sesión | Cookie HttpOnly, restauración tras F5, logout explícito y bloqueo posterior de rutas protegidas. | [Informe US-002](evidencias-tecnicas/Sprint-1/US-002.md), [proveedor de sesión](../../frontend/src/features/auth/AuthProvider.tsx) |
| US-003 — Administrar usuarios y roles | Administrador lista, crea y edita email, rol y estado; contraseña inicial Argon2id; diferenciación 401/403. | [Informe US-003](evidencias-tecnicas/Sprint-1/US-003.md), [integración usuarios](../../backend/test/users.integration.ts) |
| US-004 — Registrar pedidos | Cliente/destino y pedido transaccionales; dirección, mapa y marcador; peso positivo obligatorio; volumen NULL si desconocido; descripción y referencia opcionales; ventana Lima y estado PENDIENTE. | [Formulario](../../frontend/src/features/orders/OrderForm.tsx), [integración pedidos](../../backend/test/orders.integration.ts) |
| US-005 — Consultar pedidos | Consulta con búsqueda, filtros, paginación y detalle de solo lectura para Administrador y Operador / Técnico. | [Controlador](../../backend/src/orders/orders.controller.ts), [prueba de consulta](../../frontend/e2e/order-consultation.spec.ts) |

## Demostración del trabajo completado

1. Iniciar sesión con una cuenta autorizada; comprobar identidad y recargar F5 sin perder sesión vigente.
2. Como Administrador, abrir Usuarios, crear y editar una cuenta de prueba; comprobar email único, rol y estado.
3. Abrir Registrar pedido; seleccionar dirección y punto en el mapa, completar peso, fechas/horas Lima, prioridad y tipo. Volumen, descripción y referencia son opcionales. Guardar y comprobar PENDIENTE.
4. Abrir Consultar pedidos; buscar, filtrar, paginar y abrir detalle. Comprobar que no hay edición/eliminación.
5. Como Operador / Técnico, comprobar registro/consulta sin administración de usuarios. Como roles no autorizados, comprobar restricciones.
6. Cerrar sesión y verificar que una URL protegida conduce al login.

La demostración requiere entorno levantado y cuentas de prueba autorizadas. Registrar pedidos o usuarios crea datos: realizarla en entorno de pruebas. El mapa usa Leaflet/OSM y la dirección Photon; fallos externos deben mostrarse sin inventar coordenadas.

## Evidencia de demostración y aceptación

Existe implementación y pruebas automatizadas para reproducir el incremento. No se afirma que se haya realizado una presentación formal ni que stakeholders hayan aprobado una reunión. Acta, participantes, fecha y aceptación formal: **No registrados** en los artefactos disponibles. El documento Jira consultado es una evidencia histórica, no una consulta del tablero vigente.

## Pendientes

### Decisiones y documentación

- Aportar evidencia formal de la demostración ante stakeholders: fecha, participantes, funcionalidades presentadas y aceptación o comentarios verificables.
- Confirmar el líder por nombre, fechas del Sprint y cierre/aceptación en Jira; la documentación disponible identifica integrantes y responsabilidades, pero no asigna el liderazgo nominal.
- Resolver equivalencias de Planificador/Supervisor con roles implementados y referencias históricas RF/RN; no se asumen equivalencias.
- Confirmar reglas de horario: el código valida extremos y permite intervalos que atraviesan el almuerzo o varios días.
- Revisar reutilización de clientes/destinos y condiciones de disponibilidad/privacidad de Photon.
- Actualizar posteriormente los artefactos de planificación con evidencia del cierre.

### Trabajo de sprints posteriores

Edición/cancelación de pedidos (US-006), vehículos, conductores, rutas, OSRM, Algoritmo Genético, dashboard operativo y PWA de conductor no forman parte del incremento implementado. Son alcance futuro, no defectos pendientes de Sprint 1.

## Base documental y límites de evidencia

La finalización de las cinco historias corresponde al estado confirmado por el equipo en la solicitud de esta entrega. El código y las pruebas del repositorio permiten verificar el incremento; esa confirmación no acredita una reunión formal, aceptación de stakeholders ni cierre del tablero Jira. Las fechas de ejecución del Sprint y de esas reuniones no están registradas en esta evidencia.

Se conserva literalmente la estructura oficial proporcionada por el equipo en la solicitud de revisión final. La retrospectiva de Confluence no está disponible como evidencia local; no se atribuyen contenidos a ese artefacto.

Fuentes: [Acta de Constitución](../01%20Inicio/02.%20Acta%20de%20Constitución%20V_1_0_0.md), [Artefactos Jira](../02%20Planificación/02%20Artefactos%20Jira%20V_1_0_0.md), [Requisitos refinados](../01%20Inicio/06.%20Requisitos%20funcionales%20V_1_1_0.md), [modelo aplicado](../01%20Inicio/11.%20Base%20de%20datos%20V_1_1_0.md).

## Verificaciones ejecutadas el 02/10/2026

| Verificación | Resultado |
|---|---|
| Backend test:coverage | 17 suites, 181 pruebas aprobadas. Cobertura: sentencias, ramas, funciones y líneas 100% en el alcance configurado. |
| Frontend test:coverage -- --maxWorkers=1 | 12 archivos, 168 pruebas aprobadas. Cobertura: sentencias 97,57%; ramas 91,62%; funciones 99,45%; líneas 99,75%. |
| Backend y frontend typecheck | Aprobados. |
| Backend y frontend lint | Aprobados. |
| Backend y frontend build | Aprobados. |
| Backend test:integration | 3 suites, 71 pruebas aprobadas en el esquema aislado existente de DistriRapido. |
| E2E de navegación, dirección, horario y consulta | 18 pruebas aprobadas, móvil/desktop, con contratos API interceptados. |
| E2E de login, logout, usuarios y registro con API/PostgreSQL reales | Los cinco casos móvil aprobaron en el primer intento; los cinco desktop aprobaron al repetirlos en una instancia nueva de pruebas. |

Observaciones de ejecución:

- El comando npm del PATH apunta a una instalación inexistente. Se invocaron los mismos scripts mediante node y C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js; no se modificó la instalación.
- El sandbox bloqueó inicialmente la carga de configuración frontend por esbuild. Cobertura y build se repitieron con permisos adecuados.
- La primera suite frontend con cobertura terminó con 167 pruebas aprobadas y una vencida por timeout de 5 segundos, en el escenario de búsqueda con debounce. La repetición completa con un worker aprobó sin cambiar código, timeout ni pruebas. No se atribuye una causa definitiva; se recomienda vigilar estabilidad bajo carga.
- La primera ejecución de diez E2E reales obtuvo ocho aprobados y dos fallos desktop al iniciar sesión. Ambos contextos muestran «Demasiados intentos»: la suite acumuló más de diez logins por minuto desde la misma IP, activando el límite de AppModule. La repetición desktop en una nueva instancia aprobó cinco de cinco. No se desactivó ni modificó el límite.
- Los E2E reales usaron procesos temporales en 3100/5174 y el esquema aislado de pruebas ya existente en PostgreSQL 5433. No cambiaron configuraciones ni servicios operativos 3000/5173. Se retiraron exclusivamente los registros añadidos por esos E2E y se detuvieron los procesos temporales. No se ejecutaron migraciones, bootstrap ni reset.

La cobertura corresponde al conjunto configurado por las herramientas, no acredita aceptación formal de stakeholders.

## Siguiente trabajo recomendado

Revisión humana de la entrega y de las evidencias pendientes antes de autorizar commit/push. No iniciar Sprint 2 en esta tarea.

[← Volver al README principal](../../README.md)
