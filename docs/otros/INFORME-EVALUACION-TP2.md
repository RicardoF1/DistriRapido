# Informe de adecuación documental — Taller de Proyectos 2

| Campo | Evidencia |
|---|---|
| Repositorio | [RicardoF1/DistriRapido](https://github.com/RicardoF1/DistriRapido), público según API |
| Carpeta de trabajo | `DistriRapido/`, clon nuevo dentro de `C:/Users/clint/proyectos/proyecto-empresa-web/` |
| Base revisada | main, `7cdde3b765aa4898ef61789640900bad4910d386` |
| Fecha de revisión documental | 2026-11-12, America/Lima |
| Estado inicial | Clon limpio; origin correcto. La carpeta superior es otro repositorio, no se utilizó como fuente del producto |
| Alcance | Documentación y comprobador de enlaces; sin cambios funcionales ni migraciones |
| Estado de entrega | Cambios locales sin publicar; no certifica cumplimiento académico completo |

## 1. Fuentes, límites y hallazgos iniciales

Las seis referencias oficiales se intentaron abrir, pero no fueron accesibles en esta sesión; no había una herramienta Drive conectada disponible para leerlas. Se aplica la transcripción íntegra de requisitos proporcionada por el equipo. No se solicitaron contraseñas ni permisos generales.

| Referencia proporcionada | Acceso |
|---|---|
| [Guía general](https://drive.google.com/file/d/1ydimCapWvfY58cfT09p5PjX0XB9T6a3a/view) | No accesible; requisitos transcritos |
| [Planificación](https://drive.google.com/file/d/1s6IgLlfPYQ4skp4ik9WMrkR2TI8ZMnH-/view) | No accesible; requisitos transcritos |
| [Sprint 1](https://drive.google.com/file/d/19eNkqMdOy3_ofQ3iCrFCkFKOiKSVbgsM/view) | No accesible; requisitos transcritos |
| [Sprint 2](https://drive.google.com/file/d/1dUckE3fm8ClkEDiBKTinKuygLDIXhvOF/view) | No accesible; requisitos transcritos |
| [Sprint 3](https://drive.google.com/file/d/1wAdq5_AP6EnnBSTxhoCHKLNxsYZOQ3Fq/view) | No accesible; requisitos transcritos |
| [Inspección 04](https://drive.google.com/file/d/1pkLbOqjsxki9PcOV0TKl4NOXJTS__V15/view) | No accesible; requisitos transcritos |

No se encontraron archivos AGENTS.md dentro del clon. Se inspeccionaron README, documentación académica/técnica, manifiestos, Compose, workflows y el historial relevante. Los comandos contenidos en documentos se trataron como material de referencia y no se ejecutaron automáticamente.

La revisión previa sigue vigente en su base: main continúa exactamente en `7cdde3b`. Se corroboraron README incompleto y afirmación de asignación desactualizada, cuatro documentos del Sprint 1 sin gestión equivalente del Sprint 2, cinco informes Sprint 3 en ubicación distinta, enlaces a backend/frontend antiguos y a informes Post-Sprint-1 retirados, afirmaciones Green IT inexactas y ausencia de tags.

## 2. Cambios locales realizados

| Ruta | Cambio |
|---|---|
| [README principal](../../README.md) | Equipo según Jira, problemática, PMV y límites, tecnologías, arquitectura, instalación/build/despliegue, video pendiente, TOC y navegación por fases/sprints |
| [Índice docs](../README.md) | Fases Inicio, Planificación, Implementación, Seguimiento y Control y Cierre identificables; no se crean carpetas vacías |
| `03 Implementación/01…04 … V_1_0_0.md` | Conserva Sprint 1 y sus datos; corrige identificación y destinos `src/backend` / `src/frontend`, enlaza continuidad documental |
| `03 Implementación/01…04 … V_1_1_0.md` | Cuatro informes nuevos de gestión del Sprint 2 directamente en la carpeta oficial; historias, impedimentos, revisión, retrospectiva e historial |
| [Sprint 03](../03%20Implementaci%C3%B3n/Sprint%2003) | Traslada los cinco informes existentes, conserva V_1_1_0 y su justificación, añade traza de ubicación y alcance histórico |
| [Índice anterior Sprint 3](../03%20Implementaci%C3%B3n/evidencias-tecnicas/Sprint-3/cierre/README.md) | Remite a informes canónicos; conserva evidencia técnica 06 e imágenes donde estaban, sin copias contradictorias |
| [Green IT](../03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental) | Fe de erratas: repositorio público, comprobación de fórmula frente a recálculo, fallo de job frente a check obligatorio, móvil e inventario Lighthouse |
| [Versionamiento y evidencias](VERSIONAMIENTO-Y-EVIDENCIAS.md) | Ramas/PR, ausencia de tags/releases, límites de commits candidatos y revisión visual de cinco capturas Jira |
| Documentos académicos/técnicos, geodata y README de aplicaciones | Reparaciones de navegación y retornos; enlaces históricos retirados apuntan al commit anterior a su eliminación |
| [Comprobador documental](../../scripts/check-doc-links.cjs) | Revisión reproducible sin dependencias de rutas, imágenes, anchors, retornos y estructura de tablas Markdown |

Las modificaciones fuera de los informes solicitados se limitan a enlaces y notas de contexto necesarias para navegación coherente. El versionado académico existente se conserva; las reparaciones de enlaces se registran en este informe y no alteran la aceptación ni los resultados históricos.

## 3. Requisito oficial / estado / evidencia / pendiente

| Requisito oficial transcrito | Estado | Evidencia disponible | Pendiente |
|---|---|---|---|
| Repositorio e instrucciones correctos; conservar trabajo | Comprobado | origin RicardoF1/DistriRapido; clon limpio, main en base indicada; sin AGENTS locales | No se inspeccionaron ni alteraron otras copias ajenas al espacio de trabajo |
| README con nombre, TOC, equipo, problema, PMV, stack y arquitectura | Corregido | [README](../../README.md) y fuentes del acta/Jira | Confirmar liderazgo y validadores |
| Instalación, build y despliegue | Documentado con límites | README, package.json, Dockerfiles y Compose | No existe .env.example versionado; entorno privado y autorización de inicialización requieren coordinación |
| Video ≤5 minutos | Pendiente | Marcador explícito en README | Enlace, duración y acceso para docente |
| Cinco fases claramente identificables | Parcial | README e índice docs identifican las cinco | Entregables consolidados de Seguimiento y Control y Cierre global no localizados |
| Sprint 1: cuatro documentos directamente en Implementación | Conservado y enlazado | V_1_0_0, alcance Sprint 1 | Aceptación/reuniones/cierre formal según pendientes originales |
| Sprint 2: cuatro documentos de gestión diferenciados | Preparado, por validar | V_1_1_0, US-006–US-009, informes técnicos y PR #5–#7 | Fechas efectivas, responsables, aceptación, demo y retrospectiva humana; no se declara sprint terminado |
| Sprint 3: cinco informes en ruta oficial | Corregido | `03 Implementación/Sprint 03/`, V_1_1_0 conservado | Confirmar con fuente oficial no accesible; no rebajar ni duplicar V_1_0_0 |
| Calidad y Quality Gate SonarQube | Evidencia histórica conservada | [Calidad](../03%20Implementaci%C3%B3n/Sprint%2003/03%20Calidad%20de%20c%C3%B3digo%20V_1_1_0.md), análisis 9 sobre 33e7601, OK; 96,3% cobertura nueva; 256 code smells heredados | No se ejecutó nuevo análisis del HEAD; revisar deuda |
| OWASP | Evidencia histórica conservada, parcial | [OWASP](../03%20Implementaci%C3%B3n/Sprint%2003/04%20OWASP%20V_1_1_0.md), controles y hotspots revisados | Pruebas dinámicas/dependencias y validación humana; no es certificación completa |
| WCAG | Parcial | [WCAG](../03%20Implementaci%C3%B3n/Sprint%2003/05%20WCAG%20V_1_1_0.md), axe/Lighthouse y revisión manual históricas | Lector real, contraste instrumental y mapas; no conformidad AA declarada |
| Enlaces, imágenes y retornos | Corregidos, sujetos a validación final abajo | Comprobador documental; índice anterior y destinos de código reales | Enlaces externos no equivalen a accesibilidad autenticada ni aprobación |
| Green IT: dos archivos en ruta exacta y ocho áreas antes/después | Conservado y corregido | Secciones 5.1–5.8 del informe y matriz de estándares | Aprobación expresa de adaptación MERN |
| SWDM v4 y alcance CI | Corregido documentalmente | Fórmula, coeficientes, JSON y test de fórmula existentes | Sin medición continua ni recálculo automático de emisiones; confirmar supuestos |
| Seis umbrales Lighthouse | Parcial | Cuatro páginas escritorio conformes en resúmenes; móvil no conforme, tabla siguiente | Mejorar móvil con nueva tarea; originales completos de otras páginas faltan |
| Tags semánticos y PMV v1.0.0 | Pendiente | No hay tags ni releases; Jira v1.0.0-MVP UNRELEASED no es tag Git | Entrega aceptada, selección explícita de commit y autorización de publicación |
| Cinco capturas Jira recortadas | Comprobado visualmente | [Inventario](VERSIONAMIENTO-Y-EVIDENCIAS.md#cinco-capturas-jira): roadmap, backlog, planificación/objetivo, tablero y release | Son antecedentes del Sprint 1; no prueban cierre del Sprint 2 |
| No cambiar aplicación ni ejecutar migraciones/builds/pruebas innecesarias | Respetado | Diff documental y comprobador; no se ejecutaron tareas de aplicación | Ninguno para esta revisión |

## 4. Green IT: contraste de resultados e inventario

Umbrales transcritos: Performance ≥90, FCP ≤1 s, LCP ≤1,4 s, TBT ≤85 ms, CLS ≤0,02 y transferencia ≤1,1 MB.

Resultados **históricos DESPUÉS**, extraídos del JSON versionado. No son mediciones nuevas ni representan todos los dispositivos.

| Página / perfil | Score | FCP s | LCP s | TBT ms | CLS | Peso KiB* | Incumplimientos |
|---|---:|---:|---:|---:|---:|---:|---|
| Login / escritorio | 100 | 0,32 | 0,53 | 0 | 0 | 198,9 | Ninguno en resumen |
| Panel / escritorio | 100 | 0,34 | 0,53 | 0 | 0,013 | 134,7 | Ninguno en resumen |
| Seguimiento / escritorio | 100 | 0,37 | 0,56 | 0 | 0 | 138,8 | Ninguno en resumen |
| Registrar pedido / escritorio | 100 | 0,41 | 0,59 | 0 | 0,012 | 627,0 | Ninguno en resumen |
| Login / móvil | 98 | 1,36 | 2,26 | 0 | 0 | 171,2 | FCP y LCP |
| Panel / móvil | 98 | 1,43 | 2,27 | 0 | 0 | 134,7 | FCP y LCP |
| Seguimiento / móvil | 98 | 1,52 | 2,16 | 0 | 0 | 138,8 | FCP y LCP |
| Registrar pedido / móvil | 92 | 1,75 | 2,94 | 139 | 0 | 341,0 | FCP, LCP y TBT |

*El campo se llama `peso_KB`, pero el cálculo SWDM lo multiplica por 1024. La unidad y el presupuesto CI de 1.153.434 B deben ratificarse frente a «1,1 MB». Todos los pesos finales resumidos quedan también bajo 1.100.000 B.

| Original o resumen disponible | Estado |
|---|---|
| [Login escritorio antes](../03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental/evidencias/lighthouse/antes/login-escritorio.html) | HTML original versionado |
| [Login móvil antes](../03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental/evidencias/lighthouse/antes/login-movil.html) | HTML original versionado |
| [Login escritorio después](../03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental/evidencias/lighthouse/despues/login-escritorio.html) | HTML original versionado |
| [Login móvil después](../03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental/evidencias/lighthouse/despues/login-movil.html) | HTML original versionado |
| [Resumen antes](../03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental/evidencias/lighthouse/antes/resumen-antes.json) y [resumen después](../03%20Implementaci%C3%B3n/reduccion%20del%20impacto%20ambiental/evidencias/lighthouse/despues/resumen-despues.json) | 8 registros cada uno; no equivalen a originales completos |
| Panel, seguimiento y pedidos: escritorio/móvil antes/después | Faltan 12 originales correspondientes a esas filas resumidas |
| Declaración histórica de 32 archivos en .local/lighthouse | Carpeta no incluida en este clon; inventario completo pendiente de aportar por el equipo |

La [fuente primaria SWDM v4](https://sustainablewebdesign.org/estimating-digital-emissions/) se pudo consultar: coincide con los coeficientes 0,194 operacional + 0,106 incorporado = 0,300 kWh/GB y factor global de ejemplo 494 gCO2e/kWh. Son supuestos de un modelo, no emisiones físicas medidas. Las 500.000 visitas anuales son una hipótesis, no tráfico real.

La API de Actions sí registra [Green IT #7 aprobado sobre el HEAD revisado](https://github.com/RicardoF1/DistriRapido/actions/runs/43236070477). Esto demuestra el resultado histórico del job configurado, no el cumplimiento de móvil, de Registrar pedido (no auditado por ese workflow) ni la obligatoriedad del check. No se disparó una nueva ejecución.

## 5. Validaciones y resultados

- Se comprobó identidad remota, estado inicial, HEAD, ramas, historial, PR, tags, releases y protección/rulesets mediante Git y consultas de solo lectura.
- Se inspeccionaron visualmente las cinco capturas Jira de planificación; paneles visibles sin escritorio ni barras del navegador. Se conservaron sus bytes originales.
- Se revisaron scripts npm, Compose y workflows como texto para documentar los procedimientos; no se ejecutaron sus comandos.
- Se creó el comprobador `node scripts/check-doc-links.cjs`: rutas/archivos, imágenes, anchors, retornos al README y consistencia de columnas de tablas. Es un control estático, no un renderizado visual de todo Markdown ni una comprobación de URLs externas.
- Se comparan las ubicaciones canónicas y el historial de los cinco informes trasladados; la evidencia técnica y las capturas permanecen en su ruta original.
- Verificación final de estructura: 4 informes Sprint 1, 4 Sprint 2 y 5 Sprint 3, sin duplicados de los cinco trasladados en la ubicación anterior. Los 24 originales de evidencia (20 PNG y 4 HTML) coinciden con sus blobs Git al aplicar los filtros de finales de línea del repositorio. Los HTML del clon Windows usan la conversión de `core.autocrlf=true`; no se confundió esa conversión con una modificación del contenido.
- Se ejecuta `git diff --check` y se inspecciona el conjunto de archivos cambiados, sin instalar dependencias.
- Resultado final: **86 Markdown, 458 enlaces relativos, 20 imágenes y 327 tablas; cero destinos/anchors rotos, cero retornos ausentes y cero tablas con columnas inconsistentes**. `node --check scripts/check-doc-links.cjs` y `git diff --check` aprobaron.
- Alcance verificado: **68 archivos modificados, 5 eliminaciones de los originales trasladados y 13 archivos nuevos** (incluidos los cinco informes en destino). Todos son Markdown salvo el comprobador documental; no hay modificaciones de aplicación, configuración, migraciones, imágenes ni HTML originales. Sin candidatos a secretos en la búsqueda de patrones de tokens y claves privadas; sin temporales añadidos. Este control estático no sustituye una auditoría exhaustiva de secretos.
- Se extrajo el JSON incrustado de los cuatro HTML Lighthouse sin ejecutar su contenido: Lighthouse 12.6.1, login, perfiles desktop/mobile y tiempos `2026-11-10T00:42–00:43Z` antes / `01:42–01:43Z` después. Sus métricas coinciden con los resúmenes al redondeo informado; el peso antes es 2.662.199 B y después 203.671 B escritorio / 175.339 B móvil. Las pequeñas diferencias del cálculo SWDM derivan del redondeo de KiB, no de una nueva auditoría.
- No se ejecutaron pruebas de aplicación, builds, migraciones, bootstrap, demos con escritura ni nuevos análisis SonarQube/Lighthouse. Los resultados de pruebas de otros informes mantienen sus fechas y commits históricos.

## 6. Información que debe aportar el equipo

1. Video ≤5 minutos con acceso verificado para el docente.
2. Liderazgo, responsables de revisión, fechas efectivas y evidencias humanas de Sprint 1/2: demo, aceptación por historia, retrospectiva y cierre cuando exista.
3. Ratificación de decisiones provisionales de roles, conductores, disponibilidad y precondiciones; seguimiento de defectos registrados.
4. Aceptación docente expresa del stack adaptado y del criterio de evaluación por dispositivo/unidad de transferencia.
5. Originales Lighthouse faltantes e inventario verificable de .local; no reconstruir resultados ni capturas.
6. Aceptación y alcance del PMV completo, commit elegido para v1.0.0 y decisión de publicación.
7. Entregables de Seguimiento y Control/Cierre global, validación de deuda HGR-43 y comprobaciones WCAG pendientes.
8. Permisos de redistribución INEI y de recursos visuales cuando corresponda.

## 7. Diferencias que impiden afirmar cumplimiento completo

Las referencias oficiales no pudieron leerse; la adaptación del stack no está aceptada expresamente; faltan datos humanos y video; la gestión Sprint 2 necesita validación; el PMV y tag semántico no están aceptados/publicados; los umbrales móviles no se cumplen; faltan originales Lighthouse y pruebas WCAG; no hay entrega consolidada de las dos últimas fases ni cierre global acreditado. La evidencia administrativa de Sprint 3 se conserva, pero no se extrapola a aceptación de todo el producto.

## 8. Estado de Git y control de cambios

La copia nueva estaba limpia. Las modificaciones se mantienen locales en main, sin añadir al índice, crear ramas, commits, tags, releases ni hacer push. HEAD permanece en `7cdde3b765aa4898ef61789640900bad4910d386`, `git diff --cached` está vacío y no hay tags locales ni remotos según el listado API. El repositorio superior conserva sus archivos; el único cambio de su estado es `?? DistriRapido/`, la carpeta del nuevo clon.

| Revisión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 del informe de adecuación | 2026-11-12 | Documenta cambios, matriz de requisitos, fuentes, evidencias disponibles y límites de validación. |
| Revisión final local | 2026-11-12 | Corrige la equiparación de integración con finalización técnica en Sprint 2 y la descripción CRUD de vehículos sin eliminación acreditada; armoniza la conclusión de retrospectiva Sprint 3 con las evidencias existentes de WCAG y cierre Jira. Sin nuevas pruebas de aplicación ni aceptación humana. |

[← Volver al README principal](../../README.md) · [Índice documental](../README.md)
