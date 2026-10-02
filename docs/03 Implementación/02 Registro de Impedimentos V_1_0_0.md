# Registro de impedimentos

**Nombre del Proyecto:** Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo

**Líder del Proyecto:** Pendiente de confirmación por el equipo

| Campo | Detalle |
|---|---|
| Proyecto | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| Repositorio | DistriRapido / Huancayo GreenRoute Logistics |
| Versión | V_1_0_0 |
| Fecha de elaboración | 02/10/2026 |
| Alcance | Sprint 1: US-001 a US-005 |

## Registro

Reconstrucción de problemas y restricciones verificables; no equivale a un registro contemporáneo de reuniones. Las prioridades son una clasificación de impacto para esta entrega, no una prioridad recuperada de Jira. No se inventan responsables ni fechas. Para I-01 a I-04, la fecha de resolución técnica corresponde a la incorporación verificable en Git el 02/10/2026, no a una fecha de aceptación manual. Los commits no identifican cuándo se reportó cada impedimento ni un plazo acordado.

| Impedimento # | Fecha de Registro | Descripción del Impedimento así como el Impacto en el Proyecto | Prioridad | Reportado por | Fecha tope de Resolución | Estado | Fecha de Resolución | Resolución/Comentarios |
|---|---|---|---|---|---|---|---|---|
| I-01 | No registrada | Ingreso manual inicial de latitud/longitud exponía datos técnicos al operador y dificultaba el registro. | Alta: afectaba el flujo principal. | No registrado documentalmente | No registrada | Resuelto en código | 02/10/2026 | La interfaz usa dirección, mapa y marcador; mantiene coordenadas internas. Evidencia: OrderForm y DeliveryMap; informe histórico US-004-navegacion.  Evidencia de incorporación: commit 9063c8c, 02/10/2026. |
| I-02 | No registrada | Volumen inicialmente obligatorio impedía expresar una carga de volumen desconocido. | Alta: podía impedir registros válidos. | No registrado documentalmente | No registrada | Resuelto en código y documentación | 02/10/2026 | Prisma/migración admiten NULL; DTO y formulario mantienen peso obligatorio. RN-002/RN-004 refinadas.  Evidencia de incorporación: commit 9063c8c, 02/10/2026. |
| I-03 | No registrada | Selector datetime-local nativo poco claro en Chrome/Windows para fecha y hora. | Media: usabilidad del formulario. | No registrado documentalmente | No registrada | Resuelto en código | 02/10/2026 | Fecha separada y hora actual de 12 horas con AM/PM; timestamps -05:00. Pruebas order-delivery-time y store-hours.  Evidencia de incorporación: commit 9063c8c, 02/10/2026. |
| I-04 | No registrada | El flujo inicial carecía de búsqueda de dirección y consulta inversa integradas con el marcador; obligaba a completar dirección y punto por separado, limitando el registro del destino. | Media: dificultaba completar el destino. | No registrado documentalmente | No registrada | Integración implementada | 02/10/2026 | Commit 36f3ff9 (02/10/2026): Photon, consulta inversa y sincronización del marcador; pruebas técnicas verificadas. No se afirma un incidente de coordenadas erróneas ni validación semántica garantizada por backend. |
| I-05 | No registrada | Documentos históricos asignan pedidos a Planificador/Supervisor; código autoriza Administrador y Operador / Técnico. | Alta: ambigüedad de autorización y trazabilidad. | No registrado documentalmente | No registrada | Pendiente de decisión humana | No registrada | RF-003 refleja permisos actuales; no existe equivalencia formal entre catálogos. |
| I-06 | No registrada | Refinamientos de US-004 dejaron requisitos, reglas y modelo inicial desalineados con el código. | Alta: incoherencia de la entrega. | No registrado documentalmente | No registrada | Actualizado; revisión humana pendiente | No registrada | Seis V_1_1_0 creadas sin alterar originales. Pendientes de roles y planificación registrados. |
| I-07 | 02/10/2026 | La ejecución conjunta de E2E reales superó diez logins por minuto desde una misma IP y bloqueó dos casos desktop. | Media: impedía completar la verificación conjunta. | Verificación automatizada de esta entrega; persona no registrada. | No registrada | Reintento aprobado; mejora de ejecución pendiente | 02/10/2026 | Contextos Playwright mostraron «Demasiados intentos». Cinco casos desktop aprobaron en una instancia nueva, sin alterar la protección. Evidencia y resultados en el Informe de estado. |

## Evidencias

- [Informe histórico US-004](evidencias-tecnicas/Sprint-1/US-004.md) y [verificación de navegación](evidencias-tecnicas/Sprint-1/US-004-navegacion.md): flujo inicial y refinamientos posteriores.
- [Modelo Prisma](../../backend/prisma/schema.prisma) y [migraciones](../../backend/prisma/migrations/202610010003_us004_ubicacion_carga/migration.sql): volumen nullable y descripción.
- [Formulario](../../frontend/src/features/orders/OrderForm.tsx), [dirección](../../frontend/src/features/orders/useDeliveryAddress.ts), [mapa](../../frontend/src/features/orders/DeliveryMap.tsx) y [pruebas de hora](../../frontend/e2e/order-delivery-time.spec.ts).
- [Reglas refinadas](../01%20Inicio/09.%20Reglas%20de%20negocio%20V_1_1_0.md): contradicciones y decisiones pendientes.

## Base documental y límites de evidencia

La finalización de las cinco historias corresponde al estado confirmado por el equipo en la solicitud de esta entrega. El código y las pruebas del repositorio permiten verificar el incremento; esa confirmación no acredita una reunión formal, aceptación de stakeholders ni cierre del tablero Jira. Las fechas de ejecución del Sprint y de esas reuniones no están registradas en esta evidencia.

Se conserva literalmente la estructura oficial proporcionada por el equipo en la solicitud de revisión final. La retrospectiva de Confluence no está disponible como evidencia local; no se atribuyen contenidos a ese artefacto.

Fuentes: [Acta de Constitución](../01%20Inicio/02.%20Acta%20de%20Constitución%20V_1_0_0.md), [Artefactos Jira](../02%20Planificación/02%20Artefactos%20Jira%20V_1_0_0.md), [Requisitos refinados](../01%20Inicio/06.%20Requisitos%20funcionales%20V_1_1_0.md), [modelo aplicado](../01%20Inicio/11.%20Base%20de%20datos%20V_1_1_0.md).

## Siguiente trabajo recomendado

Revisión humana de la entrega y de las evidencias pendientes antes de autorizar commit/push. No iniciar Sprint 2 en esta tarea.

[← Volver al README principal](../../README.md)
