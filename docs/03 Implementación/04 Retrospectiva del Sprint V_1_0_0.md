# 04 Retrospectiva del Sprint V_1_0_0

[← Volver al README principal](../../README.md)

## 1. Datos generales

| Campo | Información |
|---|---|
| **Proyecto** | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| **Sistema indicado en el Acta** | EcoLogística Huancayo |
| **Líder del proyecto** | Rupay, Chira, Rosalyn Exkra |
| **Sprint** | Sprint 1, planificado del 11 al 25 de septiembre de 2026 |
| **Fecha de elaboración** | 2 de octubre de 2026 |
| **Versión** | 1.0.0 |
| **Estado** | Propuesta basada en evidencias del repositorio; pendiente de validación por el equipo |


## 2. ¿Qué aprendimos?

- Conviene aclarar permisos y reglas de negocio antes de implementar una historia. En US-004, los documentos mencionaban el rol Planificador, que no está en el catálogo de roles, y diferían sobre cómo tratar pedidos incompletos; las decisiones quedaron registradas en `implementation/US-004.md`.
- Una prueba de navegación que simula la API verifica la experiencia de interfaz, pero no demuestra persistencia real. Para aceptar US-004 se debe complementar la prueba automatizada con una validación del `POST /orders` y de los datos persistidos.
- La reproducción local depende de instrucciones y configuración coherentes. En la preparación posterior al Sprint se detectó que faltaba `.env.example` y fue necesario habilitar el entorno de Node/Docker/WSL. Estos hallazgos son posteriores al periodo planificado del Sprint y no se atribuyen a él.
- Los cambios de alcance deben reflejarse de manera consistente en el backlog, el tablero, la documentación y el criterio de cierre. Jira muestra US-005 dentro de la selección del Sprint 1; los documentos de implementación indican que no se inició y que debe esperar a US-004.

## 3. ¿Qué estamos haciendo bien?

- El código separa el frontend React y el backend NestJS en carpetas y proyectos distintos.
- Las migraciones de base de datos son versionadas; los cambios de US-004 se agregaron mediante una migración nueva, sin reescribir las migraciones anteriores.
- El `.gitignore` raíz excluye `node_modules`, `.env`, salidas de compilación, cobertura y artefactos temporales de pruebas.
- Las historias de autenticación, usuarios y pedidos cuentan con pruebas automatizadas y documentación técnica de sus decisiones y límites.
- La comprobación E2E de navegación de US-004 aprobó los escenarios de roles en escritorio, y el entorno local pudo iniciar los servicios y aplicar las migraciones.

Estos puntos describen evidencias técnicas del repositorio y la ejecución local; no sustituyen la evaluación del equipo sobre colaboración o satisfacción.

## 4. ¿Qué podemos hacer mejor?

### Personas

- Acordar desde la planificación quién lidera cada entregable, quién valida y quién aprueba. El nombre de líder se confirmó para esta documentación, pero las responsabilidades individuales del Sprint no están registradas en los artefactos revisados.
- Identificar temprano dependencias de disponibilidad y reservar tiempo para cierre, pruebas y documentación dentro del Sprint.

### Relaciones

- Programar la revisión con stakeholders y registrar participantes, comentarios y decisiones. El equipo confirmó que no hubo una demo formal del Sprint 1; no se conoce el motivo ni se atribuye a la disponibilidad de ninguna persona.
- Registrar acuerdos de producto y cambios de alcance en un lugar compartido para evitar interpretaciones distintas entre documentos y código.

### Procesos

- Alinear Sprint Goal, historias comprometidas, tablero y criterios de aceptación antes de iniciar la iteración; documentar cambios de alcance cuando ocurran.
- Definir una condición de terminado que incluya pruebas pertinentes, verificación de persistencia para historias de datos y aceptación/observaciones de stakeholders cuando corresponda.
- Mantener un registro de impedimentos con fecha, impacto, prioridad, responsable, fecha límite y resolución; distinguir riesgos potenciales de hechos materializados.

### Herramientas

- Incorporar y mantener un `.env.example` sin secretos para facilitar la instalación en nuevos equipos.
- Documentar la versión de Node, los pasos de Docker/WSL, puertos y comandos; validar la guía desde una instalación limpia.
- Resolver los cuatro fallos unitarios del frontend relacionados con `localStorage`/`sessionStorage` y conservar pruebas unitarias, build, lint y E2E como verificaciones separadas.
- Mantener la convención de ramas y hacer commits pequeños y revisables; integrar cambios mediante revisión y pruebas.

## 5. Plan de acción propuesto

Las acciones y responsables siguientes son **propuestas para aprobación del equipo**, no acuerdos ya adoptados. Las fechas deben fijarse en la siguiente reunión de planificación.

| Acción | Responsable sugerido | Criterio de cierre |
|---|---|---|
| Completar la validación manual de US-004 con Administrador y Operador / Técnico; comprobar respuesta `201` y persistencia de pedido y cliente. | QA y responsable técnico, por asignar por el equipo | Evidencia del flujo real y decisión explícita de aceptación; no dejar datos de prueba sin identificarlos. |
| Realizar una Sprint Review con los stakeholders y registrar comentarios, cambios y aceptación. | Líder del proyecto | Acta de revisión enlazada desde el repositorio. |
| Corregir los cuatro fallos de pruebas unitarias frontend y repetir la suite completa. | Responsable frontend, por asignar por el equipo | Suite frontend aprobada; causa y cambio documentados. |
| Añadir un `.env.example` seguro y probar los pasos de arranque desde una instalación limpia. | Responsable técnico, por asignar por el equipo | Plantilla sin secretos, Compose validado y guía reproducible. |
| Alinear la selección de US-005 en Jira con el alcance aprobado y cerrar la discrepancia de nombre del sistema entre Acta e interfaz. | Líder del proyecto y equipo | Decisiones acordadas y consistentes en Jira, README y documentos afectados. |

## 6. Cierre

Esta propuesta identifica mejoras apoyadas por evidencias verificables y evita presentar suposiciones como hechos. Para convertirla en la retrospectiva oficial del Sprint 1, el equipo debe discutirla, corregir lo que no represente su experiencia y aprobar las acciones y responsables.

## 7. Historial de control de cambios

| Versión | Fecha | Descripción |
|---|---|---|
| **1.0.0** | 2026-10-02 | Creación de propuesta de retrospectiva basada en el estado documentado del proyecto; pendiente de validación del equipo. |
