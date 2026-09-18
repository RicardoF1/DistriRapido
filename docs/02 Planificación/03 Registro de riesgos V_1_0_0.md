# 03 Registro de riesgos V_1_0_0

[← Volver al README Principal](../../README.md)

## 1. Metadatos del documento

| Campo | Detalle |
|---|---|
| **Nombre del proyecto** | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| **Documento** | Registro de riesgos |
| **Versión** | 1.0.0 |
| **Fecha** | 17 de septiembre de 2026 |
| **Marco de referencia** | PMBOK / CMMI |
| **Ruta** | `docs/02 Planificación/03 Registro de riesgos V_1_0_0.md` |

### Integrantes

- Flores, Toribio, Ricardo Miguel
- Janampa, Navarro, Clinton
- Rupay, Chira, Rosalyn Exkra
- Veliz de la Cruz, Carlos Adrian

---

## 2. Objetivo

El presente registro identifica, analiza y establece respuestas para los principales riesgos que pueden afectar el desarrollo y la operación del proyecto.

Los riesgos consideran las características particulares de la solución: plataforma web responsive, modo conductor PWA, frontend React + TypeScript, backend Node.js + NestJS + TypeScript, PostgreSQL + Prisma, mapas Leaflet + OpenStreetMap, motor de rutas OSRM, optimización mediante Algoritmo Genético, despliegue mediante Docker sobre hosting/VPS y comunicación mediante REST API + HTTPS.

La evaluación utiliza criterios cuantitativos de probabilidad e impacto para priorizar las acciones preventivas y reactivas.

---

## 3. Metodología de evaluación

La exposición de cada riesgo se calcula mediante:

```text
Severidad = Probabilidad × Impacto
```

Donde:

| Valor | Probabilidad | Impacto |
|---:|---|---|
| 1 | Muy baja | Insignificante |
| 2 | Baja | Menor |
| 3 | Media | Moderado |
| 4 | Alta | Mayor |
| 5 | Muy alta | Catastrófico |

La clasificación de severidad establecida para este artefacto es:

| Resultado | Clasificación |
|---:|---|
| 1–6 | **Low (Baja)** |
| 8–12 | **Medium (Media)** |
| 15–25 | **High (Alta)** |

> **Nota:** la escala proporcionada por la consigna no contempla explícitamente los valores 7, 13 y 14. Para evitar ambigüedad, las valoraciones seleccionadas en esta versión no producen dichos resultados.

---

## 4. Matriz de Evaluación de Riesgos

| ID | Descripción del riesgo | Categoría | Prob. | Imp. | Severidad | Plan de mitigación (preventivo) | Plan de contingencia (reactivo) | Responsable |
|---|---|---|---:|---:|---|---|---|---|
| **RSK-01** | El equipo puede presentar dificultades en la implementación del Algoritmo Genético para obtener soluciones válidas de optimización de rutas. | Técnica / Algoritmos | 4 | 5 | **20 (Alta)** | Implementar el algoritmo incrementalmente, realizar pruebas con conjuntos pequeños y documentar parámetros, restricciones y función de aptitud. | Utilizar temporalmente una heurística simplificada que genere rutas válidas mientras se corrige el algoritmo. | Responsable de Optimización |
| **RSK-02** | El Algoritmo Genético puede superar el tiempo máximo definido en el RNF de rendimiento al procesar escenarios de mayor tamaño. | Técnica / Rendimiento | 3 | 5 | **15 (Alta)** | Ejecutar pruebas periódicas de rendimiento, limitar generaciones y población según pruebas y medir tiempos de ejecución. | Reducir temporalmente parámetros de búsqueda y ejecutar una configuración de optimización de menor costo computacional. | Backend / Optimización |
| **RSK-03** | Fallos o indisponibilidad de OSRM pueden impedir calcular correctamente distancias y geometrías necesarias para las rutas. | Técnica / Integraciones | 3 | 4 | **12 (Media)** | Controlar errores y tiempos de espera de las solicitudes a OSRM y realizar pruebas de integración antes de cada release. | Conservar datos de rutas previamente calculados cuando sean aplicables y suspender nuevas optimizaciones hasta restablecer el servicio. | Backend |
| **RSK-04** | Datos incompletos o incorrectos de pedidos, vehículos, conductores o ubicaciones pueden producir planificaciones no válidas. | Datos / Operación | 4 | 4 | **16 (Alta)** | Implementar validaciones de datos obligatorios, coordenadas, capacidades, disponibilidad y estados antes de ejecutar la planificación. | Rechazar la optimización afectada, identificar los registros inválidos y solicitar su corrección antes de reprocesar. | Backend / Base de Datos |
| **RSK-05** | Vulnerabilidades en autenticación, autorización o API pueden permitir accesos no autorizados a información del sistema. | Seguridad | 3 | 5 | **15 (Alta)** | Aplicar validación de entradas, control de acceso por roles, gestión segura de credenciales y análisis estático de seguridad en CI/CD. | Bloquear el acceso comprometido, revocar sesiones afectadas, revisar registros y desplegar la corrección prioritaria. | Backend / Seguridad |
| **RSK-06** | La conectividad móvil inestable durante las entregas puede impedir al conductor consultar o actualizar oportunamente la información de su ruta. | Operativa / Conectividad | 4 | 4 | **16 (Alta)** | Diseñar el modo conductor PWA considerando interrupciones de conectividad y minimizar operaciones que dependan de transferencias innecesarias. | Conservar temporalmente las operaciones pendientes y sincronizarlas cuando se restablezca la conexión, cuando la funcionalidad implementada lo permita. | Frontend / PWA |
| **RSK-07** | El hosting/VPS seleccionado puede presentar recursos insuficientes para ejecutar simultáneamente API, PostgreSQL, OSRM y procesos de optimización. | Infraestructura / Capacidad | 3 | 4 | **12 (Media)** | Medir CPU, RAM, almacenamiento y tiempos de respuesta durante las pruebas; definir límites de recursos para los contenedores Docker. | Incrementar recursos del VPS o separar los servicios de mayor consumo en infraestructura adicional. | DevOps / Backend |
| **RSK-08** | Cambios incompatibles entre el esquema PostgreSQL, Prisma y el backend pueden provocar errores o pérdida de consistencia durante despliegues. | Base de Datos / Técnica | 3 | 4 | **12 (Media)** | Versionar migraciones de Prisma, probarlas en staging y realizar respaldos antes de cambios estructurales. | Restaurar el respaldo y revertir la versión de aplicación o migración afectada. | Base de Datos / Backend |
| **RSK-09** | Integraciones realizadas simultáneamente por los integrantes pueden generar conflictos de código o regresiones en el repositorio Git. | Gestión / Configuración | 4 | 3 | **12 (Media)** | Trabajar mediante ramas, Pull Requests, revisión por al menos un integrante y pruebas antes de integrar cambios. | Revertir el cambio que introdujo la regresión, corregirlo en una rama separada y volver a ejecutar las pruebas. | Equipo de Desarrollo |
| **RSK-10** | La experiencia limitada del equipo con algunas tecnologías del stack puede ocasionar retrasos en historias de mayor complejidad. | Recursos Humanos / Capacidades | 4 | 3 | **12 (Media)** | Realizar sesiones técnicas internas, dividir historias complejas en subtareas ≤ 8 horas y utilizar revisión por pares. | Redistribuir temporalmente tareas, reducir trabajo no prioritario del Sprint y realizar Pair Programming en los componentes afectados. | Scrum Master / Equipo |
| **RSK-11** | Una estimación incorrecta de Story Points o exceso de historias comprometidas puede impedir completar el Sprint Goal dentro de las dos semanas. | Gestión / Cronograma | 3 | 4 | **12 (Media)** | Priorizar el backlog, considerar dependencias y revisar la capacidad del equipo durante Sprint Planning. | Repriorizar los elementos no esenciales y devolver al Product Backlog las historias que no sean necesarias para alcanzar el Sprint Goal. | Scrum Master / Equipo |
| **RSK-12** | El cálculo de indicadores de sostenibilidad puede verse limitado por falta de datos operativos suficientes o consistentes. | Sostenibilidad / Datos | 3 | 3 | **9 (Media)** | Definir previamente los datos mínimos necesarios para calcular cada indicador y validar su registro durante las operaciones. | Mostrar únicamente indicadores sustentados por datos disponibles e identificar explícitamente aquellos que no pueden calcularse. | Backend / Responsable de Sostenibilidad |

---

## 5. Priorización de riesgos

Los riesgos de **severidad alta** identificados son:

| Riesgo | Severidad | Prioridad de seguimiento |
|---|---:|---|
| **RSK-01** – Implementación del Algoritmo Genético | 20 | Alta |
| **RSK-04** – Calidad de los datos de entrada | 16 | Alta |
| **RSK-06** – Conectividad durante la operación del conductor | 16 | Alta |
| **RSK-02** – Rendimiento del proceso de optimización | 15 | Alta |
| **RSK-05** – Vulnerabilidades de seguridad | 15 | Alta |

Estos riesgos requieren seguimiento prioritario porque pueden comprometer capacidades centrales del producto, especialmente la optimización de rutas, la integridad de la planificación, la seguridad y la operación de última milla.

Los riesgos clasificados como **medios** deberán mantenerse bajo seguimiento durante los Sprints y reevaluarse cuando se produzcan cambios en arquitectura, infraestructura, alcance o capacidad del equipo.

---

## 6. Relación de los riesgos con la arquitectura del proyecto

| Componente / Área | Riesgos relacionados |
|---|---|
| Algoritmo Genético | RSK-01, RSK-02 |
| Backend Node.js + NestJS | RSK-02, RSK-03, RSK-04, RSK-05 |
| PostgreSQL + Prisma | RSK-04, RSK-08 |
| PWA para conductor | RSK-06 |
| OSRM | RSK-03 |
| Docker + hosting/VPS | RSK-07 |
| Git y trabajo colaborativo | RSK-09 |
| Gestión Scrum | RSK-10, RSK-11 |
| Indicadores de sostenibilidad | RSK-12 |

Esta relación permite mantener trazabilidad entre los riesgos identificados y los principales componentes técnicos y de gestión de la solución.

---

## 7. Gestión durante los Sprints

El registro de riesgos será revisado durante el desarrollo iterativo. Si se identifica un nuevo riesgo, deberá asignarse un código correlativo `RSK-XX`, estimarse su probabilidad e impacto, determinar su exposición y establecer un responsable.

Los riesgos materializados deberán registrarse como incidencias cuando corresponda y sus acciones de respuesta podrán convertirse en tareas técnicas dentro del Product Backlog.

Los riesgos asociados a seguridad, rendimiento, disponibilidad y calidad deberán conservar trazabilidad con los Requisitos No Funcionales y Enablers correspondientes.

---

## 8. Criterios de seguimiento

Para cada riesgo se controlará:

- **Estado:** Abierto / En seguimiento / Materializado / Cerrado.
- **Probabilidad:** reevaluada cuando cambien las condiciones del proyecto.
- **Impacto:** reevaluado cuando cambie el alcance o la arquitectura.
- **Responsable:** encargado de supervisar las acciones de respuesta.
- **Mitigación:** acción preventiva antes de que ocurra el riesgo.
- **Contingencia:** acción ejecutada cuando el riesgo se materialice.

---

## 9. Conclusión

La evaluación evidencia que los principales riesgos del proyecto se concentran en la optimización mediante Algoritmo Genético, el rendimiento, la calidad de datos, la seguridad y la conectividad durante la última milla.

La gestión preventiva de estos riesgos permitirá reducir su probabilidad o impacto y establecer respuestas previamente definidas en caso de materialización.

El registro deberá mantenerse como un artefacto vivo y actualizarse conforme avance el desarrollo y se obtenga evidencia real de los Sprints.

---

## 10. Historial de control de cambios

| Versión | Fecha | Descripción del cambio |
|---|---|---|
| **1.0.0** | 17/09/2026 | Creación inicial del Registro de Riesgos con matriz cuantitativa, mitigación, contingencia, responsables, priorización y trazabilidad con la arquitectura. |

---