# 02 Retrospectiva del Sprint V_1_1_0

> Sprint 3 · Informe histórico V_1_1_0. Resultados sobre `33e7601` (noviembre de 2026), no sobre el HEAD actual. Traslado documental a la ruta oficial el 2026-11-12; no se repitieron pruebas, auditorías ni reuniones.

[Evidencia técnica conservada](../evidencias-tecnicas/Sprint-3/cierre/06%20Evidencia%20técnica%20de%20cierre%20del%20Sprint%203%20V_1_1_0.md) · [Otros informes del Sprint 3](../../README.md#sprint-3--ubicación-oficial)

## Identificación

- Versión del documento: V_1_1_0 (sustituye a V_1_0_0, disponible en el historial de Git)
- Fecha de actualización: 2026-11-07 -05:00
- Rama: main
- Commit final evaluado: 33e7601 (33e76018d3c656d1702d059765c518368d482234), 2026-11-07 14:57:19 -05:00
- Commit de integración original: debc2e7 (PR #12), 2026-10-30
- Validación funcional con OSRM local: 2026-11-06, commit 600564f
- Habilitación de la asignación desde la interfaz (HGR-34): 7745ef3, 2026-11-06 23:04:17 -05:00
- Análisis SonarQube final: análisis 9 sobre 33e7601, 2026-11-07 14:59:42 -05:00, Quality Gate OK
- Frontend desplegado localmente desde 33e7601: imagen sha256:98cfee35ba8a…, 2026-11-07 15:15:55 -05:00

## Qué funcionó bien

- Integración progresiva mediante ramas y Pull Requests.
- Uso de pruebas automatizadas para detectar duplicaciones y regresiones.
- Reconciliación de HGR-33 con HGR-34, HGR-35 y HGR-36 sin perder funcionalidad previa.
- Validación de cobertura mínima antes de fusionar a main.
- Uso de migraciones aditivas y bootstrap seguro para la cuenta administrativa local.
- Conservación de datos geográficos privados fuera de Git.
- Validación con API simulada y guarda de red: las pruebas E2E y la auditoría de accesibilidad no realizaron escrituras ni llamadas reales.
- Análisis SonarQube tras cada commit de cierre: los hallazgos nuevos se corrigieron en el commit siguiente sin NOSONAR ni excepciones.
- Auditoría automática de accesibilidad (axe y Lighthouse) en 9 estados de pantalla y 6 viewports, con el bundle de producción y la CSP real.
- Decisión funcional de HGR-36 registrada por el equipo en Jira antes de validar el escenario exitoso.

## Dificultades encontradas

- El squash de HGR-33 produjo bloques, tipos y pruebas duplicadas durante la integración.
- Una prueba de mapa fue sensible a tiempos distintos entre entorno local y GitHub Actions.
- La cobertura de ramas quedó inicialmente por debajo del umbral de 80%.
- main y la rama de integración compartían cambios equivalentes con historiales distintos, generando conflictos.
- Docker no podía construir sin el paquete privado geodata/coverage/v1.
- El puerto 5173 estaba ocupado por otro contenedor.
- La precondición EN_RUTA de HGR-36 no estaba trazada en Jira ni en la documentación funcional y bloqueó la primera validación manual con HTTP 409.
- Modificar líneas que ya tenían issues antiguos hizo que SonarQube los registrara como nuevos (análisis 2, 6 y 8 en ERROR).
- Dos pruebas de `DeliveryMap` fallaban de forma intermitente con la suite completa porque consultaban el mapa antes de que el efecto de cobertura terminara.
- Diez pruebas E2E de rutas quedaron desactualizadas tras el halo del trazado y el cambio del enlace de alternativas.
- La CSP de producción bloquea el estilo en línea de las flechas de sentido; solo se detectó al probar el bundle con nginx.
- El cambio de placa de un vehículo mostró que las rutas no conservan la placa usada al planificar.

## Acciones de mejora

1. Evitar integrar ramas squash sobre ramas que ya contienen partes del mismo incremento sin comparar ancestros.
2. Dividir archivos extensos de planificación y páginas en módulos más pequeños.
3. Mantener pruebas asíncronas con waitFor cuando el resultado depende del ciclo de renderizado.
4. Documentar desde el inicio los prerrequisitos privados y el procedimiento de aprovisionamiento.
5. Reservar puertos por proyecto mediante variables configurables.
6. Mantener un checklist de cierre con migraciones, Docker, CI, seguridad y evidencia.
7. Trazar en Jira las precondiciones de estado antes de implementarlas.
8. Al corregir un archivo con issues antiguos, revisar en SonarQube los issues de las líneas modificadas antes del commit.
9. En pruebas de componentes con efectos encadenados, esperar al estado final observable (por ejemplo, los trazados SVG) y no al primer indicio.
10. Ejecutar la auditoría de accesibilidad y las E2E contra el bundle servido con la CSP de producción antes de cerrar un Sprint.

## Seguimiento de los compromisos anteriores (2026-10-30)

| Compromiso | Estado al 2026-11-07 |
|---|---|
| Aprovisionar OSRM real antes de validar rutas viales de extremo a extremo | Cumplido el 2026-11-06 (validación funcional sobre `600564f`) |
| Reducir advertencias de act(...) en pruebas React | Pendiente; se mantiene |
| Revisar el tamaño del bundle y aplicar división de código cuando corresponda | Pendiente; se mantiene |
| Atender dependencias con vulnerabilidades bajas sin actualizaciones forzadas no controladas | Pendiente; se mantiene |

## Compromisos para el siguiente Sprint

- Reducir advertencias de act(...) en pruebas React.
- Revisar el tamaño del bundle y aplicar división de código cuando corresponda.
- Atender dependencias con vulnerabilidades bajas sin usar actualizaciones forzadas no controladas.
- Definir el efecto de NO_ENTREGADA sobre el pedido y el flujo de replanificación.
- Conservar la placa del vehículo en cada versión de ruta (RN-020).
- Evitar que la revalidación de sesión al recuperar el foco desmonte formularios o listas abiertas (H1).
- Resolver la rotación de las flechas del mapa con clases CSS predefinidas, sin `unsafe-inline`.
- Completar lector de pantalla y contraste instrumental; la revisión manual de teclado y zoom ya consta en el informe WCAG (2026-11-07).
- Conservar la evidencia del cierre administrativo del 2026-11-07, documentada en la Revisión; no se consultó Jira de nuevo en esta corrección.

## Conclusión

El Sprint 3 cerró con el incremento integrado y validado en local, y con las lecciones de integración, calidad y accesibilidad convertidas en acciones concretas. De los cuatro compromisos anteriores se cumplió uno (OSRM local) y tres continúan pendientes; a ellos se suman la deuda de NO_ENTREGADA, la placa histórica, H1, la rotación de las flechas y las comprobaciones WCAG aún pendientes descritas en el informe 05. La revisión manual de teclado y zoom y el cierre administrativo de HGR-32 a HGR-36 ya constan en los informes 05 y 01, respectivamente; no se consultó Jira de nuevo en esta revisión documental.

---

## Historial documental de ubicación

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | Véase historial Git | Versión inicial anterior, no recreada ni duplicada. |
| V_1_1_0 | Actualización técnica registrada: 2026-11-07; evidencias posteriores: 2026-11-08 | Se mantiene la justificación y el detalle histórico del informe. |
| V_1_1_0, corrección de ubicación | 2026-11-12 | Traslado desde `evidencias-tecnicas/Sprint-3/cierre/` a `Sprint 03/`, enlaces ajustados y pendientes WCAG/Jira armonizados con los informes 05/01. No es una nueva medición. |

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)
