# Versionamiento y evidencias de gestión

Inspección de solo lectura del 2026-11-12. Repositorio público [RicardoF1/DistriRapido](https://github.com/RicardoF1/DistriRapido), rama main, HEAD `7cdde3b765aa4898ef61789640900bad4910d386`.

## Flujo observado

Git conserva `main`, `desarrollo`, `develop`, `sprint-4` y ramas `feature/*` o `codex/*`. El historial y la API muestran integración mediante pull requests; no se presupone un único GitFlow uniforme en toda la historia.

| PR | Integración observada | Estado consultado |
|---|---|---|
| [#2](https://github.com/RicardoF1/DistriRapido/pull/2) | Sprint 1: codex/sprint-1-auth-users-orders → main | Fusionado |
| [#4](https://github.com/RicardoF1/DistriRapido/pull/4) | Mejoras posteriores Sprint 1 → main | Fusionado |
| [#5](https://github.com/RicardoF1/DistriRapido/pull/5), [#6](https://github.com/RicardoF1/DistriRapido/pull/6), [#7](https://github.com/RicardoF1/DistriRapido/pull/7) | Sprint 2: US-009 → rama US-008; US-008 y HGR-22/HGR-24 → main | Fusionados |
| [#8](https://github.com/RicardoF1/DistriRapido/pull/8) | Avance parcial Sprint 3 | Cerrado sin fusión; no contarlo como entrega integrada |
| [#10](https://github.com/RicardoF1/DistriRapido/pull/10), [#12](https://github.com/RicardoF1/DistriRapido/pull/12) | Compleción → feature/sprint-3-avances → main | Fusionados |
| [#13](https://github.com/RicardoF1/DistriRapido/pull/13), [#14](https://github.com/RicardoF1/DistriRapido/pull/14), [#15](https://github.com/RicardoF1/DistriRapido/pull/15) | US-018, US-019 y Green IT → sprint-4 | Fusionados |
| [#16](https://github.com/RicardoF1/DistriRapido/pull/16) | sprint-4 → main, `7cdde3b` | Fusionado el 2026-11-12 según API |

La guía de Green IT describe ese flujo por ramas/PR. Para la siguiente entrega documental, revisar el diff, incorporar únicamente lo acordado a una rama de trabajo y seguir el PR elegido por el equipo. Son pasos futuros: no se creó rama, commit, tag, release ni push durante esta revisión.

## Tags, releases y PMV

- `git tag -l` no devolvió tags en el clon inicial ni en la validación final; la API remota de tags también devolvió una lista vacía.
- La API de releases de GitHub devolvió una lista vacía.
- La captura de Jira muestra `v1.0.0-MVP` en **UNRELEASED**. Ese objeto de planificación no crea una referencia Git `v1.0.0`.
- Las versiones npm `0.1.0` y las documentales V_1_0_0/V_1_1_0 tampoco son tags del producto.
- La guía exige tags semánticos y PMV identificado como `v1.0.0`: **pendiente**.

| Referencia evaluada | Respaldo existente | Límite para elegir v1.0.0 |
|---|---|---|
| `33d6139e6404f70e12c76a6111f51245f24057db` | Commit de implementación/documentación Sprint 1 del 02/10; informes registran pruebas y confirmación técnica del equipo | Solo alcance inicial; falta aceptación formal de PMV y de interesados |
| `33e76018d3c656d1702d059765c518368d482234` | Informes Sprint 3: pruebas, Quality Gate análisis 9, flujo local, cierre administrativo Jira | Candidato técnico de incremento, no candidato PMV validado formalmente; deuda HGR-43, WCAG y alcance del acta pendientes |
| `7cdde3b765aa4898ef61789640900bad4910d386` | main incorpora Sprint 4 y Green IT por PR #16 | No se encontró una entrega integral aceptada que vincule todo este HEAD con v1.0.0 |

**No se identificó un candidato respaldado por aceptación formal de PMV.** El equipo debe decidir alcance, aportar aceptación y seleccionar el commit exacto antes de autorizar publicación del tag/release. No se generó ninguno automáticamente.

## Checks y protección

La protección clásica de main devolvió HTTP 404. El único ruleset visible, `Aprobar` (23636239), está **disabled**. No se acreditó un check obligatorio que impida fusionar Green IT fallido. Que `lhci assert` produzca un fallo de job no prueba un bloqueo de merge.

El workflow de Green IT audita login, panel administrativo y seguimiento en escritorio; no incluye la pantalla Registrar pedido en su lista actual ni perfil móvil. Ejecuta pruebas de fórmula SWDM, no el cálculo de emisiones sobre cada auditoría nueva. No se cambiaron workflows ni protecciones.

## Cinco capturas Jira

Inspección visual realizada sobre los PNG existentes; no se modificó ninguna imagen.

| Evidencia | Archivo | Observación visual |
|---|---|---|
| Roadmap | [Evidencia1_Roadmap.png](../02%20Planificaci%C3%B3n/Evidencia1_Roadmap.png) | Panel con épicas y cronograma; sin escritorio ni barras de navegador |
| Backlog | [Evidencia2_Backlog_Priorizado.png](../02%20Planificaci%C3%B3n/Evidencia2_Backlog_Priorizado.png) | Lista priorizada con historias y puntos; sin escritorio ni barras de navegador |
| Planificación y objetivo | [Evidencia3_SprintPlanning.png](../02%20Planificaci%C3%B3n/Evidencia3_SprintPlanning.png) | SCRUM Sprint 1, 11–25 sep, objetivo visible; margen claro superior, sin barra de navegador |
| Tablero | [Evidencia4_TableroScrum.png](../02%20Planificaci%C3%B3n/Evidencia4_TableroScrum.png) | To Do 2, In Progress 2, In Review/QA 1, Done 0; no acredita cierre |
| Release | [Evidencia5_Release.png](../02%20Planificaci%C3%B3n/Evidencia5_Release.png) | v1.0.0-MVP UNRELEASED; fechas no completadas; no es tag Git |

Cumplen el encuadre solicitado para estas cinco evidencias de planificación. Son históricas y no demuestran el estado actual de Jira, el cierre Sprint 2 ni aceptación del producto.

## Historial

| Revisión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 de este informe de inspección | 2026-11-12 | Registra ramas/PR, ausencia de tags/releases, límites del candidato y comprobación visual de Jira. |

[← Volver al README principal](../../README.md) · [Índice documental](../README.md)
