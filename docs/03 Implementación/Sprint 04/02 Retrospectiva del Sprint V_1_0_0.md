# Retrospectiva del sprint

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)

**Nombre del Proyecto:** Huancayo GreenRoute Logistics (proyecto HGR en Jira) — sistema DistriRapido de planificación y seguimiento de entregas de última milla

**Líder del Proyecto:** Rupay Chira, Rosalyn Exkra

> Sprint 4 · Versión V_1_0_0 · Fecha: 2026-11-18 (America/Lima).

## ¿Qué aprendimos?

- **Los requisitos dejaban decisiones abiertas que hubo que cerrar antes de programar.** RF-015 no definía el catálogo de tipos de incidencia, RF-016 y RF-019 nombraban actores (Supervisor, Planificador) que el sistema no tiene, y RF-017 no fijaba qué datos ambientales registrar. En cada caso el equipo acordó la definición y la dejó escrita en la sección «Decisiones del incremento» del informe técnico.
- **Un estado explícito es más seguro que un campo suelto.** Al introducir `CONFIRMADA` (US-020), el ciclo de la ruta quedó protegido con restricciones `CHECK` en PostgreSQL, y la asignación de US-015 pasó a exigir confirmación previa.
- **Reutilizar la lógica existente evita inconsistencias.** Las comprobaciones de advertencias (`stopWarnings`, `sourceWarnings`, `calculatedVersion`) se extrajeron a funciones compartidas, así que la consulta de la ruta y su confirmación aplican exactamente las mismas reglas.
- **Los datos derivados se calculan en el servidor.** En US-021 las emisiones de CO₂ las calcula el backend con aritmética decimal y la validación global rechaza que el cliente las envíe.
- **Las migraciones aditivas permiten avanzar sin romper datos.** Las tres migraciones del sprint añaden tablas y columnas sin modificar los registros anteriores.

## ¿Qué estamos haciendo bien?

- Una rama por historia (`feature/us-0XX-…`) que se integra en la rama del sprint (`sprint-4`).
- Informe técnico por historia con trazabilidad RF → US → ST, criterios de aceptación y la prueba automatizada que cubre cada uno.
- Cobertura sostenida por encima del 80 % en branches, tanto en backend (82.46 %) como en frontend (82.95 %), con el número de pruebas creciendo en cada historia (backend de 513 a 609; frontend de 373 a 436).
- Pruebas de integración contra un PostgreSQL aislado (`distrirapido_test`) para cada endpoint nuevo.
- Accesibilidad tratada desde el diseño: etiquetas, `aria-invalid`, `aria-describedby`, gestión del foco y regiones `status` y `alert`.
- Concurrencia controlada: transacciones `Serializable` con `FOR UPDATE` para evitar dobles confirmaciones.

## ¿Qué podemos hacer mejor?

### Personas

- En los Sprints 1 a 3 las historias se repartieron entre varios integrantes, pero en el Sprint 4 la implementación de las cuatro historias recayó en un solo integrante (Flores Toribio, Ricardo Miguel) y la documentación en otro. Esto genera dependencia de personas concretas y riesgo si una de ellas no está disponible.
- Los roles del equipo no estaban registrados en el repositorio: el README indicaba el líder como pendiente.

### Relaciones

- Las decisiones de alcance (catálogo de incidencias, actores, datos de sostenibilidad) se tomaron historia por historia, sin una sesión con el Product Owner que las validara juntas.
- Jira no se actualizó durante el sprint: el «SCRUM Sprint 4» se creó y las historias HGR-37 a HGR-40 se movieron a Finalizada recién el 2026-11-18, por lo que el tablero no reflejó el avance real en el día a día.

### Procesos

- El incremento no llegó a `main`: US-021 sigue en su rama y `sprint-4` no se ha integrado. La entrega depende de varias integraciones en los últimos días.
- US-020 y US-021 se desarrollaron el mismo día que el cierre técnico (2026-11-17); el trabajo se acumuló al final del sprint.
- Las historias HGR-41 (US-022) y HGR-42 (US-023) no se iniciaron y siguen en el backlog sin sprint asignado.

### Herramientas

- La suite E2E de Playwright solo se ejecutaba en el canal `msedge` y no formaba parte de GitHub Actions.
- No existe un flujo de despliegue automático a producción; la demostración depende del entorno local.
- No se ha aplicado todavía una evaluación cuantitativa de usabilidad (SUS) sobre el sistema.

### Acciones a realizar

| # | Acción | Responsable | Fecha límite | Métrica de seguimiento |
|---|---|---|---|---|
| 1 | Hacer merge del PR #21 hacia `sprint-4` y luego de `sprint-4` hacia `main` | Flores Toribio, Ricardo Miguel | 2026-11-19 | `main` contiene `cc3ad8c` y los checks de CI están en verde |
| 2 | Crear cada sprint en Jira al iniciarlo y mover las historias a medida que avanzan, para que el burndown sea real | Rupay Chira, Rosalyn Exkra | Inicio del siguiente sprint | Burndown con actualizaciones al menos cada dos días |
| 3 | Agregar los workflows `tests.yml` (E2E en Chromium, Firefox y WebKit con reporte como artifact) y `deploy-production.yml` | Janampa Navarro, Clinton | 2026-11-20 | 3 workflows en verde en GitHub Actions |
| 4 | Aplicar el cuestionario SUS a 5 usuarios como mínimo y documentar el resultado | Albornoz Quiliano, José Antonio · Veliz De La Cruz, Carlos Adrián | 2026-11-20 | n ≥ 5 y puntaje SUS calculado |
| 5 | Registrar en el README los roles del equipo | Rupay Chira, Rosalyn Exkra | 2026-11-19 | README sin roles pendientes |
| 6 | Corregir el aviso de `picomatch` en una rama propia | Flores Toribio, Ricardo Miguel | Inicio del siguiente sprint | `npm audit --audit-level=high` sin hallazgos |
| 7 | Replanificar HGR-41 (US-022), HGR-42 (US-023) y HGR-43 (US-024) en Jira | Rupay Chira, Rosalyn Exkra | Planificación del siguiente sprint | Las tres historias asignadas a un sprint |
| 8 | Repartir las historias del siguiente sprint entre al menos tres integrantes | Rupay Chira, Rosalyn Exkra | Planificación del siguiente sprint | Commits de al menos tres autores en el sprint |

---

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 2026-11-18 | Versión inicial de la Retrospectiva del Sprint 4. |

[← Volver al README principal](../../../README.md)
