# Retrospectiva del sprint

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)

**Nombre del Proyecto:** Huancayo GreenRoute Logistics (proyecto HGR en Jira) — sistema DistriRapido de planificación y seguimiento de entregas de última milla

**Líder del Proyecto:** Rupay Chira, Rosalyn Exkra

> Sprint 4 · Versión V_1_1_0 · Fecha: 2026-11-19 (America/Lima). El Sprint 4 es el último sprint del proyecto.

## ¿Qué aprendimos?

- **Los requisitos dejaban decisiones abiertas que hubo que cerrar antes de programar.** RF-015 no definía el catálogo de tipos de incidencia, RF-016, RF-019, RF-020 y RF-021 nombraban actores (Supervisor, Planificador) que el sistema no tiene, RF-017 no fijaba qué datos ambientales registrar y RF-020 no enumeraba los indicadores. En cada caso el equipo acordó la definición y la dejó escrita en la sección «Decisiones del incremento» del informe técnico.
- **Un estado explícito es más seguro que un campo suelto.** Al introducir `CONFIRMADA` (US-020), el ciclo de la ruta quedó protegido con restricciones `CHECK` en PostgreSQL, y la asignación de US-015 pasó a exigir confirmación previa.
- **Reutilizar la lógica existente evita inconsistencias.** Las comprobaciones de advertencias (`stopWarnings`, `sourceWarnings`, `calculatedVersion`) se extrajeron a funciones compartidas, así que la consulta de la ruta y su confirmación aplican exactamente las mismas reglas. Del mismo modo, US-022 y US-023 reutilizan la regla de fechas en hora de Lima y el filtro de entregas de US-019 (`routesMatchingDeliveries`).
- **Los datos derivados se calculan en el servidor.** En US-021 las emisiones de CO₂ las calcula el backend con aritmética decimal y la validación global rechaza que el cliente las envíe.
- **Un indicador sin datos no es un cero.** En US-022 un indicador que no se puede calcular se devuelve como `null` y se muestra «Sin datos suficientes», para no presentar cifras engañosas.
- **Las migraciones aditivas permiten avanzar sin romper datos.** Las tres migraciones del sprint añaden tablas y columnas sin modificar los registros anteriores; US-022 y US-023 no necesitaron ninguna.

## ¿Qué estamos haciendo bien?

- Una rama por historia (`feature/us-0XX-…`) que se integra en la rama del sprint (`sprint-4`) mediante un PR.
- Informe técnico por historia con trazabilidad RF → US → ST, criterios de aceptación y la prueba automatizada que cubre cada uno.
- Cobertura sostenida por encima del 80 % en branches, tanto en backend (83.39 %) como en frontend (83.78 %), con el número de pruebas creciendo en cada historia (backend de 513 a 635; frontend de 373 a 467).
- Pruebas de integración contra un PostgreSQL aislado (`distrirapido_test`) para cada endpoint nuevo.
- Accesibilidad tratada desde el diseño: etiquetas, `aria-invalid`, `aria-describedby`, gestión del foco y regiones `status` y `alert`.
- Concurrencia controlada: transacciones `Serializable` con `FOR UPDATE` para evitar dobles confirmaciones.
- Páginas nuevas cargadas de forma diferida y con espacio reservado, de acuerdo con los criterios Green IT.

## ¿Qué podemos hacer mejor?

### Personas

- En los Sprints 1 a 3 las historias se repartieron entre varios integrantes, pero en el Sprint 4 la implementación de las seis historias recayó en un solo integrante (Flores Toribio, Ricardo Miguel) y la documentación de cierre en otro. Esto genera dependencia de personas concretas y riesgo si una de ellas no está disponible.
- Los roles del equipo no estaban registrados en el repositorio: el README indicaba el líder como pendiente.

### Relaciones

- Las decisiones de alcance (catálogo de incidencias, actores, datos de sostenibilidad, indicadores) se tomaron historia por historia, sin una sesión con el Product Owner que las validara juntas.
- Jira no se actualizó durante el sprint: el «SCRUM Sprint 4» se creó y las historias HGR-37 a HGR-40 se movieron a Finalizada recién el 2026-11-18, por lo que el tablero no reflejó el avance real en el día a día.

### Procesos

- El incremento llegó a `main` en dos tramos: US-018 a US-021 con el PR #22 (2026-11-18), y US-022 y US-023, integradas en `sprint-4` con los PR #23 y #24 (2026-11-19), quedan pendientes del PR final hacia `main`. La entrega dependió de varias integraciones en los últimos días.
- El trabajo se acumuló al final del sprint: US-020 y US-021 se desarrollaron el 2026-11-17, y US-022 y US-023 el 2026-11-19, un día antes del cierre del 2026-11-20.
- La versión V_1_0_0 de esta retrospectiva y de la Revisión dio por aplazadas HGR-41 (US-022) y HGR-42 (US-023) a un sprint siguiente que no existe. Como el Sprint 4 es el último del proyecto, ambas se implementaron dentro de él. Antes de cerrar un documento de sprint conviene confirmar el calendario del proyecto.

### Herramientas

- La suite E2E de Playwright solo se ejecutaba en el canal `msedge` y no formaba parte de GitHub Actions.
- No existe un flujo de despliegue automático a producción; la demostración depende del entorno local.
- No se ha aplicado todavía una evaluación cuantitativa de usabilidad (SUS) sobre el sistema.
- `npm audit` queda en rojo por un aviso de `picomatch` que todavía no tiene versión corregida; no depende del equipo resolverlo hasta que se publique.

### Acciones a realizar

| # | Acción | Responsable | Fecha límite | Métrica de seguimiento |
|---|---|---|---|---|
| 1 | Hacer merge de `sprint-4` (US-018 a US-023) hacia `main` | Flores Toribio, Ricardo Miguel | 2026-11-20 | `main` contiene `d2224e2` |
| 2 | Incorporar HGR-41 y HGR-42 al «SCRUM Sprint 4» y moverlas a Finalizada con su PR de cierre; en cualquier trabajo posterior, mover las historias en Jira a medida que avanzan | Rupay Chira, Rosalyn Exkra | 2026-11-20 | HGR-37 a HGR-42 en Finalizada dentro del «SCRUM Sprint 4» |
| 3 | Agregar los workflows `tests.yml` (E2E en Chromium, Firefox y WebKit con reporte como artifact) y `deploy-production.yml` | Janampa Navarro, Clinton | 2026-11-20 | 3 workflows en verde en GitHub Actions |
| 4 | Aplicar el cuestionario SUS a 5 usuarios como mínimo y documentar el resultado | Albornoz Quiliano, José Antonio · Veliz De La Cruz, Carlos Adrián | 2026-11-20 | n ≥ 5 y puntaje SUS calculado |
| 5 | Registrar en el README los roles del equipo | Rupay Chira, Rosalyn Exkra | 2026-11-19 | README sin roles pendientes |
| 6 | Aplicar la versión corregida de `picomatch` con `overrides` cuando se publique | Flores Toribio, Ricardo Miguel | Antes del cierre del proyecto, sujeto a que exista la corrección | `npm audit --audit-level=high` sin hallazgos |
| 7 | Decidir el tratamiento de la deuda HGR-43 (US-024), que queda fuera del Sprint 4 | Rupay Chira, Rosalyn Exkra | Antes del cierre del proyecto | Decisión registrada en Jira y en el README |
| 8 | Repartir el trabajo restante (deuda y correcciones) entre al menos tres integrantes | Rupay Chira, Rosalyn Exkra | Antes del cierre del proyecto | Commits de al menos tres autores en el trabajo restante |

---

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 2026-11-18 | Versión inicial de la Retrospectiva del Sprint 4. |
| V_1_1_0 | 2026-11-19 | Se reflejan US-022 y US-023, implementadas dentro del Sprint 4 por ser el último del proyecto. Se actualizan los aprendizajes, las cifras de pruebas y cobertura, y el estado de la integración. Las acciones que remitían al «siguiente sprint» pasan a plazos antes del cierre del proyecto, y la acción de replanificar HGR-41 y HGR-42 se sustituye por su actualización en Jira y la decisión sobre HGR-43. |

[← Volver al README principal](../../../README.md)
