# Guía de aplicación de la evaluación SUS

[← Volver al README principal](../../../../README.md) · [Índice documental](../../../README.md)

Material de apoyo para el entregable `04 Usabilidad V_1_0_0.md` del Sprint 4. Versión V_1_0_0, 2026-11-19. Responsables de la aplicación: Albornoz Quiliano, José Antonio y Veliz De La Cruz, Carlos Adrián (acción 4 de la Retrospectiva del Sprint 4).

> Las respuestas deben ser **reales**. El informe solo puede presentar datos recogidos con esta guía; no se completan ni se estiman respuestas.

## 1. Ficha técnica

| Elemento | Definición |
|---|---|
| Instrumento | System Usability Scale (SUS), Brooke (1996), en versión en español |
| Escala | Likert de 1 («Totalmente en desacuerdo») a 5 («Totalmente de acuerdo») |
| Muestra mínima | n ≥ 5 personas |
| Perfiles | Al menos 3 con el perfil Operador / Administrador y al menos 2 con el perfil Conductor, para cubrir las dos interfaces del sistema |
| Entorno | El sistema desplegado. Si el despliegue no está disponible, el entorno local del equipo, indicándolo en el informe |
| Momento | El cuestionario se responde **inmediatamente después** de terminar las tareas, sin ayuda del evaluador durante ellas |

## 2. Preparación

1. Crear una cuenta de prueba por perfil (Operador / Técnico y Conductor) y un conjunto de datos de demostración: al menos una ruta calculada sin confirmar, una ruta asignada al conductor de prueba y una ruta completada con su registro de sostenibilidad.
2. No usar datos personales reales de clientes ni de conductores.
3. Anotar para cada participante: código (P1, P2…), perfil, fecha, si completó cada tarea y el tiempo aproximado. No registrar nombres en el repositorio.

## 3. Tareas antes de responder

### Perfil Operador / Administrador

| # | Tarea | Se considera completada cuando… |
|---|---|---|
| T1 | Iniciar sesión con la cuenta de prueba | Llega al panel de acceso de su rol |
| T2 | Registrar un pedido nuevo para un cliente de Huancayo | El sistema confirma el registro |
| T3 | Abrir una ruta calculada, revisarla y confirmarla | La ruta aparece como «Confirmada» |
| T4 | En «Seguimiento operativo», filtrar las rutas con incidencias | La tabla muestra solo las rutas filtradas |
| T5 | Consultar los «Indicadores» del último mes y abrir una operación del «Historial» | Ve los indicadores y el detalle de la operación |

### Perfil Conductor

| # | Tarea | Se considera completada cuando… |
|---|---|---|
| T1 | Iniciar sesión con la cuenta de conductor | Llega a su panel |
| T2 | Abrir la ruta asignada y ubicar la primera entrega | Ve la parada en el detalle de la ruta |
| T3 | Marcar una entrega como realizada | La entrega aparece como «Entregada» |
| T4 | Registrar una incidencia en otra entrega | La incidencia aparece en la parada |

## 4. Cuestionario (versión en español)

Para cada afirmación, marque de 1 («Totalmente en desacuerdo») a 5 («Totalmente de acuerdo»).

| # | Afirmación |
|---|---|
| 1 | Creo que me gustaría usar este sistema con frecuencia. |
| 2 | Encontré el sistema innecesariamente complejo. |
| 3 | Pensé que el sistema era fácil de usar. |
| 4 | Creo que necesitaría la ayuda de una persona con conocimientos técnicos para poder usar este sistema. |
| 5 | Encontré que las distintas funciones del sistema estaban bien integradas. |
| 6 | Pensé que había demasiada inconsistencia en este sistema. |
| 7 | Imagino que la mayoría de las personas aprenderían a usar este sistema muy rápidamente. |
| 8 | Encontré el sistema muy engorroso de usar. |
| 9 | Me sentí muy seguro/a usando el sistema. |
| 10 | Necesité aprender muchas cosas antes de poder empezar a usar este sistema. |

Al final se puede añadir una pregunta abierta: «¿Qué fue lo más difícil o confuso?». Sus respuestas sirven para identificar cuellos de botella de la interfaz.

## 5. Registro de respuestas y cálculo

1. Copiar la plantilla [`respuestas-sus.csv`](respuestas-sus.csv) y añadir una fila por participante: `P1,Operador,4,2,…` (10 respuestas de 1 a 5).
2. Calcular con:

   ```bash
   node scripts/sus-score.cjs "docs/otros/soporte-sprint-04/usabilidad/respuestas-sus.csv"
   ```

   El script valida las respuestas y genera en Markdown la tabla de respuestas brutas, el cálculo paso a paso por participante (ítems impares: respuesta − 1; ítems pares: 5 − respuesta; suma × 2,5), el promedio global, la desviación estándar, la nota de Sauro y Lewis (A+ a F), el adjetivo de Bangor et al. y la comparación con el umbral de 68.
3. Ese resultado, junto con las tareas completadas y los comentarios, es la base del informe `04 Usabilidad V_1_0_0.md`.

## 6. Referencias

- Brooke, J. (1996). *SUS: A «quick and dirty» usability scale*. En Usability Evaluation in Industry. Taylor & Francis.
- Bangor, A., Kortum, P. y Miller, J. (2009). Determining what individual SUS scores mean: Adding an adjective rating scale. *Journal of Usability Studies*, 4(3), 114–123.
- Sauro, J. y Lewis, J. R. (2016). *Quantifying the User Experience* (2.ª ed.). Morgan Kaufmann. Escala de notas curvada de la SUS.

[← Volver al README principal](../../../../README.md)
