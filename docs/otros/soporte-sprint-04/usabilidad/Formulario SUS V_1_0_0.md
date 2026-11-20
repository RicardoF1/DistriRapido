# Formulario SUS para Google Forms

[← Volver al README principal](../../../../README.md) · [Guía de aplicación SUS](Gu%C3%ADa%20de%20aplicaci%C3%B3n%20SUS%20V_1_0_0.md)

Texto listo para copiar en Google Forms. Versión V_1_0_0, 2026-11-19. El evaluador rellena la sección 1 y el participante responde las secciones 2 a 4 **justo después** de terminar las tareas de la [guía](Gu%C3%ADa%20de%20aplicaci%C3%B3n%20SUS%20V_1_0_0.md#3-tareas-antes-de-responder).

## Opción rápida: crear el formulario con Apps Script

El script [`crear-formulario-sus.gs`](crear-formulario-sus.gs) crea el formulario completo, con las cuatro secciones de abajo, y su hoja de respuestas:

1. Abrir <https://script.google.com> con la cuenta de Google del equipo → **Nuevo proyecto**.
2. Borrar el contenido, pegar el script y guardar.
3. Elegir la función `crearFormularioSUS` → **Ejecutar** → autorizar el acceso a Forms, Drive y Sheets de esa cuenta.
4. En **Registro de ejecución** aparecen el enlace para responder (el que se comparte), el de edición y el de la hoja.
5. Con las respuestas reunidas, ejecutar `exportarCsvSUS` y copiar el CSV del registro en `respuestas-sus.csv`.

## Configuración del formulario

- Título: **Evaluación de usabilidad — EcoRuta Huancayo**
- No recopilar correos electrónicos; no pedir nombres.
- Todas las preguntas de las secciones 1 y 3 son obligatorias.

**Descripción:**

> Gracias por participar. Acabas de usar EcoRuta Huancayo, una plataforma para planificar y seguir entregas de última milla. Responde según tu propia experiencia; no hay respuestas correctas ni incorrectas, y lo que se evalúa es el sistema, no a ti. Las respuestas son anónimas y solo se usan para el informe de usabilidad del curso Taller de Proyectos 2. Tiempo estimado: 3 minutos.

## Sección 1. Datos de la sesión (la completa el evaluador)

| Pregunta | Tipo | Opciones |
|---|---|---|
| Código del participante | Respuesta corta | P1, P2, P3… (validación: texto que empiece por «P») |
| Perfil evaluado | Opción múltiple | Operador / Administrador · Conductor |
| Entorno | Opción múltiple | Sistema desplegado · Entorno local del equipo |
| Tareas completadas sin ayuda | Casillas | T1 · T2 · T3 · T4 · T5 (marcar solo las completadas sin ayuda) |
| Tareas que necesitaron ayuda | Casillas | T1 · T2 · T3 · T4 · T5 · Ninguna |

## Sección 2. Consentimiento

| Pregunta | Tipo | Opciones |
|---|---|---|
| Acepto que mis respuestas anónimas se usen en el informe de usabilidad del proyecto | Opción múltiple (obligatoria) | Sí, acepto |

## Sección 3. Cuestionario SUS

Cada afirmación es una pregunta de **escala lineal de 1 a 5**, con la etiqueta 1 = «Totalmente en desacuerdo» y 5 = «Totalmente de acuerdo». Mantener este orden: la fórmula SUS depende de la posición de cada ítem.

1. Creo que me gustaría usar este sistema con frecuencia.
2. Encontré el sistema innecesariamente complejo.
3. Pensé que el sistema era fácil de usar.
4. Creo que necesitaría la ayuda de una persona con conocimientos técnicos para poder usar este sistema.
5. Encontré que las distintas funciones del sistema estaban bien integradas.
6. Pensé que había demasiada inconsistencia en este sistema.
7. Imagino que la mayoría de las personas aprenderían a usar este sistema muy rápidamente.
8. Encontré el sistema muy engorroso de usar.
9. Me sentí muy seguro/a usando el sistema.
10. Necesité aprender muchas cosas antes de poder empezar a usar este sistema.

## Sección 4. Comentarios (opcional)

| Pregunta | Tipo |
|---|---|
| ¿Qué fue lo más difícil o confuso al usar el sistema? | Párrafo |
| ¿Qué cambiarías primero? | Párrafo |

## Exportar las respuestas

1. En Google Forms: **Respuestas → Vincular con Hojas de cálculo**.
2. En la hoja, dejar solo estas columnas, en este orden: código, perfil y las 10 respuestas del cuestionario. Renombrar la cabecera a `participante,perfil,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10` y escribir el perfil como `Operador` o `Conductor`.
3. **Archivo → Descargar → Valores separados por comas (.csv)** y guardarlo como `docs/otros/soporte-sprint-04/usabilidad/respuestas-sus.csv`.
4. Calcular con `node scripts/sus-score.cjs "docs/otros/soporte-sprint-04/usabilidad/respuestas-sus.csv"`.
5. Conservar la hoja original (con las tareas completadas y los comentarios) como evidencia; se resume en el informe `04 Usabilidad V_1_0_0.md`.

[← Volver al README principal](../../../../README.md)
