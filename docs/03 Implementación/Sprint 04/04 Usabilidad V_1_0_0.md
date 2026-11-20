# Evaluación cuantitativa de usabilidad

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)

**Nombre del Proyecto:** Huancayo GreenRoute Logistics (proyecto HGR en Jira) — sistema DistriRapido de planificación y seguimiento de entregas de última milla

**Líder del Proyecto:** Rupay Chira, Rosalyn Exkra

> Sprint 4 · Versión V_1_0_0 · Fecha: 2026-11-19 (America/Lima). Evaluación aplicada por Albornoz Quiliano, José Antonio y Veliz De La Cruz, Carlos Adrián.

## 1. Ficha técnica de la evaluación

| Elemento | Detalle |
|---|---|
| Instrumento | System Usability Scale (SUS), Brooke (1996), en versión en español ([formulario](../../otros/soporte-sprint-04/usabilidad/Formulario%20SUS%20V_1_0_0.md)), aplicado con un formulario en línea |
| Escala de valoración | Likert de 1 («Totalmente en desacuerdo») a 5 («Totalmente de acuerdo»), 10 ítems alternos positivos (impares) y negativos (pares) |
| Tamaño de la muestra | n = 10 |
| Perfil de la muestra | 7 con el perfil Operador / Administrador y 3 con el perfil Conductor. Los 10 dieron su consentimiento para que sus respuestas anónimas se usen en este informe; se identifican solo con un código (P1 a P10) |
| Entorno | Entorno local del equipo (frontend, backend, PostgreSQL y OSRM en el equipo de desarrollo). El sistema desplegado en Render quedó en línea después de la sesión (ver sección 4) |
| Fecha de aplicación | 2026-11-19, entre las 18:34 y las 18:49 |
| Procedimiento | Cada participante realizó las tareas de su perfil y respondió el cuestionario inmediatamente después ([guía de aplicación](../../otros/soporte-sprint-04/usabilidad/Gu%C3%ADa%20de%20aplicaci%C3%B3n%20SUS%20V_1_0_0.md)). El formulario registró qué tareas completó sin ayuda y cuáles necesitaron ayuda, y dos preguntas abiertas |
| Datos | [respuestas-sus.csv](../../otros/soporte-sprint-04/usabilidad/respuestas-sus.csv) (códigos y respuestas, sin nombres) |

### 1.1 Tareas ejecutadas antes de responder

**Perfil Operador / Administrador:** T1 iniciar sesión; T2 registrar un pedido; T3 revisar y confirmar una ruta calculada (US-020); T4 filtrar en «Seguimiento operativo» las rutas con incidencias (US-019); T5 consultar los «Indicadores» del último mes y abrir una operación del «Historial» (US-022 y US-023).

**Perfil Conductor:** T1 iniciar sesión; T2 abrir la ruta asignada y ubicar la primera entrega; T3 marcar una entrega como realizada; T4 registrar una incidencia (US-018).

### 1.2 Tareas completadas

Conteo a partir de lo que cada participante marcó en el formulario.

**Operador / Administrador (7 participantes)**

| Tarea | Sin ayuda | Con ayuda | Sin registro válido |
|---|---|---|---|
| T1 Iniciar sesión | 6 | 0 | 1 (P9) |
| T2 Registrar un pedido | 6 | 0 | 1 (P9) |
| T3 Confirmar una ruta | 5 | 1 (P5) | 1 (P9) |
| T4 Filtrar el seguimiento | 3 | 3 (P1, P5, P6) | 1 (P9) |
| T5 Indicadores e historial | 1 | 5 (P1, P2, P5, P6, P8) | 1 (P9) |

P9 marcó la tarea T5 a la vez como completada sin ayuda y como completada con ayuda, y no marcó las tareas T1 a T4. Su registro de tareas no es interpretable y se deja fuera de este conteo; sus respuestas SUS sí se incluyen en el cálculo.

**Conductor (3 participantes)**

| Tarea | Sin ayuda | Con ayuda |
|---|---|---|
| T1 Iniciar sesión | 3 | 0 |
| T2 Abrir la ruta y ubicar la primera entrega | 2 | 1 (P10) |
| T3 Marcar una entrega como realizada | 3 | 0 |
| T4 Registrar una incidencia | 3 | 0 |

El perfil Conductor tiene cuatro tareas, pero el formulario ofrecía las casillas T1 a T5 a todos los perfiles: P4 y P7 marcaron T5 como completada y P10 la marcó como completada con ayuda. Esa casilla no corresponde a ninguna tarea del conductor y no se cuenta.

## 2. Resultados cuantitativos

La fórmula aplicada es la estándar de la SUS: en los ítems impares se resta 1 a la respuesta; en los pares se resta la respuesta a 5; la suma de los diez valores (0 a 40) se multiplica por 2,5 para obtener un puntaje de 0 a 100. Las tablas siguientes son la salida de `node scripts/sus-score.cjs "docs/otros/soporte-sprint-04/usabilidad/respuestas-sus.csv"`, cuyas pruebas están en `scripts/sus-score.test.cjs`.

### Respuestas brutas (Likert 1–5)

| Participante | Perfil | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | P9 | P10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | Operador | 3 | 2 | 5 | 2 | 4 | 1 | 4 | 2 | 4 | 2 |
| P2 | Operador | 5 | 1 | 4 | 2 | 5 | 2 | 4 | 1 | 5 | 2 |
| P3 | Operador | 5 | 5 | 4 | 4 | 5 | 4 | 5 | 4 | 5 | 5 |
| P4 | Conductor | 4 | 5 | 4 | 5 | 5 | 4 | 4 | 4 | 5 | 4 |
| P5 | Operador | 4 | 2 | 4 | 3 | 4 | 3 | 4 | 2 | 4 | 3 |
| P6 | Operador | 5 | 5 | 3 | 2 | 5 | 2 | 5 | 1 | 5 | 1 |
| P7 | Conductor | 5 | 1 | 1 | 3 | 5 | 1 | 5 | 3 | 5 | 3 |
| P8 | Operador | 5 | 1 | 5 | 1 | 4 | 2 | 5 | 1 | 4 | 1 |
| P9 | Operador | 4 | 5 | 4 | 4 | 5 | 4 | 5 | 4 | 5 | 5 |
| P10 | Conductor | 4 | 1 | 5 | 2 | 4 | 2 | 5 | 2 | 4 | 2 |

### Cálculo del puntaje SUS individual

| Participante | Ítems impares (respuesta − 1) | Ítems pares (5 − respuesta) | Suma × 2,5 | Nota |
|---|---|---|---|---|
| P1 | (3−1) + (5−1) + (4−1) + (4−1) + (4−1) = 15 | (5−2) + (5−2) + (5−1) + (5−2) + (5−2) = 16 | 31 × 2,5 = **77,5** | B+ |
| P2 | (5−1) + (4−1) + (5−1) + (4−1) + (5−1) = 18 | (5−1) + (5−2) + (5−2) + (5−1) + (5−2) = 17 | 35 × 2,5 = **87,5** | A+ |
| P3 | (5−1) + (4−1) + (5−1) + (5−1) + (5−1) = 19 | (5−5) + (5−4) + (5−4) + (5−4) + (5−5) = 3 | 22 × 2,5 = **55,0** | D |
| P4 | (4−1) + (4−1) + (5−1) + (4−1) + (5−1) = 17 | (5−5) + (5−5) + (5−4) + (5−4) + (5−4) = 3 | 20 × 2,5 = **50,0** | F |
| P5 | (4−1) + (4−1) + (4−1) + (4−1) + (4−1) = 15 | (5−2) + (5−3) + (5−3) + (5−2) + (5−3) = 12 | 27 × 2,5 = **67,5** | C |
| P6 | (5−1) + (3−1) + (5−1) + (5−1) + (5−1) = 18 | (5−5) + (5−2) + (5−2) + (5−1) + (5−1) = 14 | 32 × 2,5 = **80,0** | A- |
| P7 | (5−1) + (1−1) + (5−1) + (5−1) + (5−1) = 16 | (5−1) + (5−3) + (5−1) + (5−3) + (5−3) = 14 | 30 × 2,5 = **75,0** | B |
| P8 | (5−1) + (5−1) + (4−1) + (5−1) + (4−1) = 18 | (5−1) + (5−1) + (5−2) + (5−1) + (5−1) = 19 | 37 × 2,5 = **92,5** | A+ |
| P9 | (4−1) + (4−1) + (5−1) + (5−1) + (5−1) = 18 | (5−5) + (5−4) + (5−4) + (5−4) + (5−5) = 3 | 21 × 2,5 = **52,5** | D |
| P10 | (4−1) + (5−1) + (4−1) + (5−1) + (4−1) = 17 | (5−1) + (5−2) + (5−2) + (5−2) + (5−2) = 16 | 33 × 2,5 = **82,5** | A |

### Resultado global

| Indicador | Valor |
|---|---|
| Participantes (n) | 10 |
| SUS promedio | **72,0** |
| Desviación estándar | 15,1 |
| Nota (Sauro y Lewis) | C+ |
| Adjetivo (Bangor et al.) | Bueno |
| Umbral de aceptación (≥ 68) | Cumple |

### Resultados complementarios

| Indicador | Valor |
|---|---|
| Mediana | 76,3 |
| Mínimo y máximo | 50,0 y 92,5 |
| Participantes con SUS ≥ 68 | 6 de 10 |
| Intervalo de confianza del 95 % de la media (t de Student, 9 g. l.) | 61,2 a 82,8 |
| Operador / Administrador (n = 7) | media 73,2 (DE 15,5) |
| Conductor (n = 3) | media 69,2 (DE 17,0) |

## 3. Análisis e interpretación

### 3.1 Comparación con el estándar

- El SUS promedio es **72,0**, **4 puntos por encima** del umbral de aceptación de 68, que es el promedio de la industria (Sauro, 2011). El sistema **cumple** el criterio.
- En la escala curvada de Sauro y Lewis (2016) corresponde a la nota **C+** (71,1 a 72,5), y en la escala de adjetivos de Bangor, Kortum y Miller (2009), a **«Bueno»** (≥ 71,4).
- La dispersión es alta (desviación estándar 15,1) y el intervalo de confianza del 95 % va de 61,2 a 82,8: con 10 participantes no se puede afirmar con esa confianza que la media real supere 68. El resultado es favorable, pero no concluyente.
- El perfil Operador / Administrador (73,2) puntúa algo más alto que el Conductor (69,2). Con 3 conductores, la diferencia no permite conclusiones.

### 3.2 Ítems con peor resultado

Contribución media por ítem (0 a 4; más alto es mejor):

| Ítem | Afirmación | Contribución media |
|---|---|---|
| 2 | Encontré el sistema innecesariamente complejo | 2,2 |
| 4 | Necesitaría la ayuda de una persona con conocimientos técnicos | 2,2 |
| 10 | Necesité aprender muchas cosas antes de empezar | 2,2 |
| 6 | Había demasiada inconsistencia | 2,5 |
| 8 | Encontré el sistema muy engorroso | 2,6 |
| 3 | Pensé que el sistema era fácil de usar | 2,9 |
| 1 | Me gustaría usar este sistema con frecuencia | 3,4 |
| 5, 7, 9 | Integración, aprendizaje rápido y seguridad al usarlo | 3,6 |

Los cinco ítems con peor resultado son los de redacción negativa (2, 4, 6, 8 y 10). Ese promedio está influido por tres participantes, P3, P4 y P9, que marcaron 4 o 5 tanto en los ítems positivos como en los negativos; por ejemplo, P3 marcó 4 en «fácil de usar» y 4 en «muy engorroso», y en las preguntas abiertas respondió «todo excelente». Es el patrón de aquiescencia conocido de la SUS, en el que se responde «de acuerdo» sin atender a la redacción negativa. Los tres obtienen los puntajes más bajos (50,0 a 55,0). El equipo decidió mantenerlos en el cálculo: no se excluyen respuestas por su resultado.

Aun así, los ítems 4 y 10, sobre ayuda técnica y aprendizaje previo, coinciden con lo que muestran las tareas: T4 y T5 del Operador necesitaron ayuda con frecuencia. Ese es el hallazgo que se mantiene al margen del patrón anterior.

En el ítem 3, P7 marcó 1 («totalmente en desacuerdo» con «fácil de usar»), aunque comentó «todo es muy intuitivo»; se mantiene tal como fue respondido.

### 3.3 Cuellos de botella de la interfaz

| Hallazgo | Evidencia | Pantalla o flujo |
|---|---|---|
| Consultar indicadores e historial necesita ayuda | 5 de 6 Operadores con registro válido necesitaron ayuda en T5 | Indicadores (US-022) e Historial (US-023) |
| Filtrar el seguimiento necesita ayuda y no se sabe qué filtros están activos | 3 de 6 necesitaron ayuda en T4; P8: «reconocer qué filtros estaban activos» | Seguimiento operativo (US-019) |
| No queda claro qué revisar antes de confirmar una ruta ni por qué no se puede confirmar | P1: «identificar qué información debía revisar antes de confirmar una ruta»; P5: «comprender por qué una ruta no permitía confirmación»; P5 necesitó ayuda en T3 | Detalle de ruta, confirmación (US-020) |
| El formato de fecha y hora del pedido no es evidente | P2: «entender el formato de fecha y hora al registrar el pedido» | Registro de pedidos |
| Elegir el tipo de incidencia | P10: «elegir el tipo de incidencia» | Panel del conductor, incidencias (US-018) |
| Ubicar la primera entrega de la ruta asignada | P10 necesitó ayuda en T2 del Conductor | Panel del conductor |

### 3.4 Mejoras propuestas

Las primeras cuatro recogen lo que pidieron los propios participantes. Una ya está aplicada y verificada con pruebas automatizadas; las demás quedan planificadas en la acción 9 de la [Retrospectiva](02%20Retrospectiva%20del%20Sprint%20V_1_0_0.md).

| Mejora | Estado | Evidencia |
|---|---|---|
| Mostrar junto al botón «Confirmar» un resumen de las condiciones de confirmación y cuál falta cumplir | Propuesta | Pedido por P1 y P5 |
| Mostrar los filtros activos de «Seguimiento operativo» como etiquetas, con una opción para quitarlos | Propuesta | Pedido por P8 |
| Añadir un ejemplo del formato junto a los campos de fecha y hora del pedido | Propuesta | Pedido por P2 |
| Añadir una descripción breve con un ejemplo de cada tipo de incidencia | **Aplicada** (2026-11-20) | Pedido por P10. Al elegir un tipo, el formulario muestra su explicación con un ejemplo, enlazada al campo con `aria-describedby` para lectores de pantalla. Código: [`INCIDENT_TYPE_DESCRIPTIONS`](../../../src/frontend/src/services/driver-profile-api.ts) y [`DeliveryIncidents.tsx`](../../../src/frontend/src/features/drivers/DeliveryIncidents.tsx). Prueba: «explica el tipo de incidencia elegido con un ejemplo» en [`DeliveryIncidents.test.tsx`](../../../src/frontend/src/features/drivers/DeliveryIncidents.test.tsx), ejecutada por `tests.yml` |
| Indicar en «Indicadores» qué periodo se está viendo y enlazar cada fila con su operación en «Historial» | Propuesta | 5 de 6 necesitaron ayuda en T5 |
| Repetir la SUS sobre el sistema desplegado, con el formulario corregido (tareas por perfil) y una instrucción explícita sobre los ítems negativos | Propuesta | Secciones 1.2, 3.2 y 4 |

## 4. Limitaciones

- **Entorno.** Las diez sesiones se hicieron en el entorno local del equipo. Cuatro participantes (P3, P4, P7 y P9) marcaron «Sistema desplegado» en el formulario, pero respondieron entre las 18:37 y las 18:47 del 2026-11-19, y el despliegue en Render quedó en línea después de las 20:46 de ese día. El equipo confirmó que usaron el entorno local, y así se registra. Sus respuestas se mantienen sin cambios en el CSV; solo se corrige la descripción del entorno en este informe.
- **Muestra.** n = 10 cumple el mínimo de la guía (n ≥ 5), pero el intervalo de confianza es amplio y solo hay 3 conductores.
- **Relación con el equipo.** Los participantes no son usuarios operativos de una empresa de distribución, sino personas cercanas al equipo. Los resultados describen la primera impresión de uso, no el uso cotidiano.
- **Formulario.** Ofrecía las casillas T1 a T5 a ambos perfiles, aunque el Conductor tiene cuatro tareas, y permitía marcar la misma tarea como completada con ayuda y sin ella (P9).
- **Aquiescencia.** Tres respuestas (P3, P4 y P9) muestran el patrón descrito en la sección 3.2 y bajan el promedio. Se mantienen para no seleccionar datos según el resultado.

## 5. Referencias

- Brooke, J. (1996). *SUS: A «quick and dirty» usability scale*. En P. W. Jordan et al. (Eds.), Usability Evaluation in Industry. Taylor & Francis.
- Bangor, A., Kortum, P. y Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. *Journal of Usability Studies*, 4(3), 114–123.
- Sauro, J. (2011). *A Practical Guide to the System Usability Scale*. Measuring Usability LLC.
- Sauro, J. y Lewis, J. R. (2016). *Quantifying the User Experience* (2.ª ed.). Morgan Kaufmann.

---

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 2026-11-19 | Versión inicial con los resultados de la evaluación SUS del Sprint 4 (n = 10). |
| V_1_0_0 (actualización) | 2026-11-20 | Se aplica la mejora «descripción con ejemplo de cada tipo de incidencia» (cuello de botella señalado por P10) con su prueba automatizada; las demás mejoras quedan planificadas en la Retrospectiva. |

[← Volver al README principal](../../../README.md)
