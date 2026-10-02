# Reprospectiva del sprint

**Nombre del Proyecto:** Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo

**Líder del Proyecto:** Pendiente de confirmación por el equipo

| Campo | Detalle |
|---|---|
| Proyecto | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| Repositorio | DistriRapido / Huancayo GreenRoute Logistics |
| Versión | V_1_0_0 |
| Fecha de elaboración | 02/10/2026 |
| Alcance | Sprint 1: US-001 a US-005 |

Documento de aprendizajes derivados de incidencias, código y documentación. No se atribuyen opiniones a integrantes ni se afirma una reunión de retrospectiva realizada. La versión de Confluence no está disponible como evidencia local.

## ¿Qué aprendimos?

- Las pruebas manuales revelan problemas de interacción y procesos antiguos que las pruebas unitarias no detectan por sí solas.
- Los cambios de requisitos deben reflejarse en software, reglas de negocio y modelo de datos conjuntamente.
- No se debe exigir al operador introducir coordenadas técnicas cuando el flujo puede obtenerlas mediante dirección/mapa.
- Validar cada historia incrementalmente permite detectar regresiones de sesión, navegación y conservación del formulario.
- Una modificación compatible de requisitos requiere nuevas versiones documentales y conservación de la línea base.

## ¿Qué estamos haciendo bien?

- Separación frontend/backend y autorización también en servidor.
- Pruebas de regresión para autenticación, roles, formularios, mapa y consultas.
- Volumen desconocido representado como NULL y creación transaccional sin cliente huérfano por fallo del pedido.
- Documentación versionada con diferencias y límites explícitos; alcance futuro separado del incremento.

## ¿Qué podemos hacer mejor?

### Personas

Identificar formalmente liderazgo y responsables de revisión; mantener evidencias verificables de validación sin atribuir responsabilidades no documentadas.

### Relaciones

Acordar criterios de aceptación con el equipo y registrar acuerdos sobre roles y horarios. Evitar asumir que una validación técnica equivale a aceptación formal de stakeholders.

### Procesos

Mantener una lista de comprobación por historia; actualizar documentación después de refinamientos y registrar fechas reales de impedimentos y resoluciones cuando ocurran.

### Herramientas

Separar entornos de prueba de datos operativos, identificar procesos locales antes de iniciar servicios y distinguir E2E con API real de pruebas con respuestas interceptadas.

### Acciones a realizar

| Acción | Resultado verificable | Responsable / plazo |
|---|---|---|
| Aprobar la revisión documental final contra la estructura oficial proporcionada. | Confirmación del equipo sobre los cuatro documentos y sus evidencias pendientes. | Asignación humana pendiente; plazo no registrado. |
| Aportar acta/evidencia del demo y cierre de Sprint. | Evidencia enlazada y estado Jira corroborado. | Asignación humana pendiente; plazo no registrado. |
| Resolver catálogos de roles y referencias RF/RN. | Decisión escrita y trazabilidad consistente, sin equivalencias implícitas. | Asignación humana pendiente; plazo no registrado. |
| Confirmar política de horarios y destinos de clientes. | Reglas aceptadas con escenarios de almuerzo y ventanas de varios días. | Asignación humana pendiente; plazo no registrado. |
| Adoptar validación incremental por historia. | Checklist con pruebas, resultado manual y regresiones identificadas. | Asignación humana pendiente; plazo no registrado. |
| Organizar E2E respetando límites de login y revisar estabilidad bajo carga. | Ejecución repetible sin HTTP 429 accidental ni timeout; conservar protecciones y distinguir reintentos. | Asignación humana pendiente; plazo no registrado. |
| Registrar impedimentos en el momento de aparición. | Fechas reales, responsable, impacto y evidencia de resolución. | Asignación humana pendiente; plazo no registrado. |

Estas acciones no autorizan cambios de software ni el inicio de Sprint 2.

## Base documental y límites de evidencia

La finalización de las cinco historias corresponde al estado confirmado por el equipo en la solicitud de esta entrega. El código y las pruebas del repositorio permiten verificar el incremento; esa confirmación no acredita una reunión formal, aceptación de stakeholders ni cierre del tablero Jira. Las fechas de ejecución del Sprint y de esas reuniones no están registradas en esta evidencia.

Se conserva literalmente la estructura oficial proporcionada por el equipo en la solicitud de revisión final. La retrospectiva de Confluence no está disponible como evidencia local; no se atribuyen contenidos a ese artefacto.

Fuentes: [Acta de Constitución](../01%20Inicio/02.%20Acta%20de%20Constitución%20V_1_0_0.md), [Artefactos Jira](../02%20Planificación/02%20Artefactos%20Jira%20V_1_0_0.md), [Requisitos refinados](../01%20Inicio/06.%20Requisitos%20funcionales%20V_1_1_0.md), [modelo aplicado](../01%20Inicio/11.%20Base%20de%20datos%20V_1_1_0.md).

## Siguiente trabajo recomendado

Revisión humana de la entrega y de las evidencias pendientes antes de autorizar commit/push. No iniciar Sprint 2 en esta tarea.

[← Volver al README principal](../../README.md)
