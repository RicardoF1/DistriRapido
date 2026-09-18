# 04 Presupuesto del proyecto V_1_0_0

[← Volver al README Principal](../../README.md)

## 1. Metadatos del documento

| Campo | Detalle |
|---|---|
| **Nombre del proyecto** | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| **Documento** | Presupuesto del proyecto |
| **Versión** | 1.0.0 |
| **Fecha** | 17 de septiembre de 2026 |
| **Moneda** | Soles peruanos (S/) |
| **Tipo de estimación** | Presupuesto académico proyectado |
| **Ruta** | `docs/02 Planificación/04 Presupuesto del proyecto V_1_0_0.md` |

### Integrantes

- Flores, Toribio, Ricardo Miguel
- Janampa, Navarro, Clinton
- Rupay, Chira, Rosalyn Exkra
- Veliz de la Cruz, Carlos Adrian

---

## 2. Objetivo del presupuesto

El presente documento establece la estimación financiera necesaria para el desarrollo, despliegue y operación inicial del proyecto **“Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo”**.

El presupuesto considera cuatro componentes principales:

1. Recursos humanos — CAPEX.
2. Licenciamiento y herramientas.
3. Infraestructura y servicios — OPEX.
4. Reserva de contingencia.

La estimación se realiza considerando el desarrollo de un **MVP académico**, priorizando tecnologías de código abierto, planes gratuitos y una infraestructura de bajo costo.

---

## 3. Criterio monetario de estimación

Todos los valores del presente documento se expresan en **soles peruanos (S/)**.

Para mantener coherencia con la estimación inicial elaborada en dólares, se utiliza un **tipo de cambio referencial académico de S/ 3.37 por USD 1.00**.

```text
Conversión referencial:

Monto en soles = Monto en USD × 3.37
```

El tipo de cambio se utiliza únicamente como referencia para homogeneizar el presupuesto académico y deberá actualizarse si el equipo realiza una cotización real al momento de contratar servicios.

---

## 4. Supuestos presupuestales

| ID | Supuesto |
|---|---|
| **PRE-01** | El proyecto será desarrollado por un equipo de 4 integrantes. |
| **PRE-02** | El equipo se encuentra en etapa formativa/junior. |
| **PRE-03** | Las tarifas por hora representan el valor económico estimado del trabajo y no necesariamente un desembolso real. |
| **PRE-04** | Se utilizarán principalmente tecnologías open source. |
| **PRE-05** | El MVP será desplegado inicialmente en un VPS/hosting compatible con Docker. |
| **PRE-06** | No se utilizarán APIs comerciales de mapas o tráfico en el MVP. |
| **PRE-07** | Leaflet, OpenStreetMap y OSRM forman parte de la solución base. |
| **PRE-08** | PostgreSQL y Prisma conforman la capa principal de persistencia. |
| **PRE-09** | Se utilizará Git/GitHub para control de versiones. |
| **PRE-10** | Se priorizarán planes gratuitos académicos o comunitarios para Jira, Figma y análisis de código cuando estén disponibles. |
| **PRE-11** | El presupuesto de infraestructura inicial se proyecta para **6 meses**. |
| **PRE-12** | Se establece una reserva de contingencia del **12 %**, dentro del intervalo de 10 %–15 % sugerido por la consigna. |
| **PRE-13** | Las conversiones desde valores de referencia en USD emplean un tipo de cambio académico de **S/ 3.37 por USD 1.00**. |

---

## 5. Costo de Recursos Humanos — CAPEX

El costo de recursos humanos se calcula mediante:

```text
Costo del recurso = Horas asignadas × Tarifa por hora
```

Las horas se presupuestan por **rol funcional**, debido a que un mismo integrante puede asumir más de una responsabilidad durante el desarrollo del proyecto.

### 5.1 Tarifas académicas estimadas

| Rol | Horas estimadas | Tarifa estimada S//h | Cálculo | Subtotal |
|---|---:|---:|---:|---:|
| Project Manager / Scrum Master | 80 h | S/ 40.44 | 80 × 40.44 | **S/ 3,235.20** |
| Software Architect | 60 h | S/ 50.55 | 60 × 50.55 | **S/ 3,033.00** |
| Junior Developer | 240 h | S/ 26.96 | 240 × 26.96 | **S/ 6,470.40** |
| QA Engineer | 80 h | S/ 30.33 | 80 × 30.33 | **S/ 2,426.40** |
| UI/UX Designer | 60 h | S/ 30.33 | 60 × 30.33 | **S/ 1,819.80** |
| **TOTAL RECURSOS HUMANOS** | **520 h** | — | — | **S/ 16,984.80** |

### 5.2 Justificación de los roles

- **Project Manager / Scrum Master:** planificación de Sprints, gestión del backlog, seguimiento de riesgos, coordinación y documentación.
- **Software Architect:** definición y seguimiento de la arquitectura React + NestJS + PostgreSQL, integraciones y decisiones técnicas.
- **Junior Developer:** implementación de frontend, backend, PWA, base de datos, integración con OSRM y Algoritmo Genético.
- **QA Engineer:** diseño y ejecución de pruebas, criterios de aceptación, validaciones funcionales y control de calidad.
- **UI/UX Designer:** diseño de interfaces, prototipos, experiencia del operador y modo conductor PWA.

> Los roles pueden ser asumidos por uno o más integrantes del equipo y no representan necesariamente contrataciones independientes.

---

## 6. Licenciamiento y herramientas

La arquitectura seleccionada busca reducir los costos de licenciamiento mediante tecnologías open source y planes gratuitos.

| Herramienta / Tecnología | Finalidad | Modalidad presupuestada | Cantidad | Costo |
|---|---|---|---:|---:|
| Visual Studio Code | IDE / desarrollo | Gratuito | 4 | S/ 0.00 |
| Git | Control de versiones | Open source | 4 | S/ 0.00 |
| GitHub | Repositorio del proyecto | Plan gratuito | 1 | S/ 0.00 |
| Jira Software | Scrum / Backlog / Sprints | Plan gratuito aplicable al equipo | 1 | S/ 0.00 |
| Figma | Prototipado UI/UX | Plan gratuito | 1 | S/ 0.00 |
| SonarQube Community / CodeQL | Análisis estático | Alternativa gratuita | 1 | S/ 0.00 |
| Node.js | Backend runtime | Open source | 1 | S/ 0.00 |
| NestJS | Framework backend | Open source | 1 | S/ 0.00 |
| React | Frontend | Open source | 1 | S/ 0.00 |
| TypeScript | Lenguaje | Open source | 1 | S/ 0.00 |
| PostgreSQL | Base de datos | Open source | 1 | S/ 0.00 |
| Prisma | ORM | Uso base/open source | 1 | S/ 0.00 |
| Docker | Contenedores | Uso presupuestado sin licencia comercial | 1 | S/ 0.00 |
| Leaflet | Mapas frontend | Open source | 1 | S/ 0.00 |
| OpenStreetMap | Datos cartográficos | Sin API comercial presupuestada | 1 | S/ 0.00 |
| OSRM | Motor de rutas | Open source / autohospedado | 1 | S/ 0.00 |
| **TOTAL LICENCIAMIENTO** |  |  |  | **S/ 0.00** |

### Decisión financiera

El costo presupuestado de licenciamiento es:

> **S/ 0.00**

debido a que el MVP prioriza herramientas open source, planes gratuitos y modalidades académicas.

Esto **no implica que la infraestructura sea gratuita**, ya que los servicios de backend, base de datos, OSRM y almacenamiento requieren recursos de servidor.

---

## 7. Infraestructura Cloud y Servicios — OPEX

Para el MVP se utilizará una arquitectura de bajo costo basada en:

> **Docker + VPS/hosting + PostgreSQL + NestJS + React/PWA + OSRM**

### 7.1 Estimación de infraestructura

| Servicio | Costo mensual estimado | Periodo | Cálculo | Subtotal |
|---|---:|---|---|---:|
| VPS / Hosting para MVP | S/ 40.44 | 6 meses | 40.44 × 6 | **S/ 242.64** |
| Dominio web | — | 1 año | Conversión referencial | **S/ 50.55** |
| Certificado SSL | S/ 0.00 | 1 año | Let's Encrypt / equivalente | **S/ 0.00** |
| Copias de seguridad / almacenamiento | S/ 16.85 | 6 meses | 16.85 × 6 | **S/ 101.10** |
| CI/CD | S/ 0.00 | 6 meses | Plan gratuito previsto | **S/ 0.00** |
| PostgreSQL | S/ 0.00 adicional | 6 meses | Desplegado en infraestructura prevista | **S/ 0.00** |
| OSRM | S/ 0.00 licencia | 6 meses | Autohospedado | **S/ 0.00** |
| **TOTAL INFRAESTRUCTURA** |  |  |  | **S/ 394.29** |

---

## 8. Subtotal antes de contingencia

```text
Recursos Humanos        = S/ 16,984.80
Licenciamiento          = S/      0.00
Infraestructura         = S/    394.29
                           -----------
SUBTOTAL                = S/ 17,379.09
```

Por lo tanto:

> **Subtotal del proyecto = S/ 17,379.09**

---

## 9. Reserva de contingencia

Considerando los riesgos identificados en el **Registro de Riesgos**, se establece una reserva del:

> **12 %**

La fórmula es:

```text
Reserva = Subtotal × 12 %
```

Sustituyendo:

```text
Reserva = S/ 17,379.09 × 0.12
Reserva = S/ 2,085.49
```

Por lo tanto:

> **Reserva de contingencia = S/ 2,085.49**

---

## 10. Presupuesto total

```text
Presupuesto total = Subtotal + Reserva de contingencia
Presupuesto total = S/ 17,379.09 + S/ 2,085.49
Presupuesto total = S/ 19,464.58
```

## PRESUPUESTO TOTAL ESTIMADO: **S/ 19,464.58**

---

## 11. Tabla Resumen Financiera

Los porcentajes de las tres categorías base se calculan respecto del **subtotal del proyecto de S/ 17,379.09**.

| Categoría | Costo Subtotal (S/) | Porcentaje del Subtotal |
|---|---:|---:|
| **1. Recursos Humanos (CAPEX)** | **S/ 16,984.80** | **97.73 %** |
| **2. Licenciamiento de Software** | **S/ 0.00** | **0.00 %** |
| **3. Infraestructura Cloud (OPEX)** | **S/ 394.29** | **2.27 %** |
| **SUBTOTAL DE PROYECTO** | **S/ 17,379.09** | **100.00 %** |
| **4. Reserva de Contingencia (12 %)** | **S/ 2,085.49** | **N/A** |
| **PRESUPUESTO TOTAL ESTIMADO** | **S/ 19,464.58** | **100.00 %** |

---

## 12. Distribución del presupuesto total

Si se analiza el presupuesto incluyendo la contingencia, la distribución respecto de **S/ 19,464.58** es:

| Categoría | Monto | % del presupuesto total |
|---|---:|---:|
| Recursos Humanos | S/ 16,984.80 | 87.26 % |
| Licenciamiento | S/ 0.00 | 0.00 % |
| Infraestructura | S/ 394.29 | 2.03 % |
| Reserva de contingencia | S/ 2,085.49 | 10.71 % |
| **TOTAL** | **S/ 19,464.58** | **100.00 %** |

La reserva equivale al **12 % del subtotal**, pero representa aproximadamente **10.71 % del presupuesto final** una vez incorporada al total.

---

## 13. Relación entre riesgos y contingencia

La reserva de contingencia se justifica especialmente por los riesgos identificados en el Registro de Riesgos:

| Riesgo | Posible impacto económico |
|---|---|
| Dificultades con el Algoritmo Genético | Horas adicionales de desarrollo |
| Problemas de rendimiento | Mayor capacidad de infraestructura |
| Calidad insuficiente de datos | Horas adicionales de corrección y pruebas |
| Vulnerabilidades de seguridad | Correcciones y nuevas pruebas |
| Conectividad móvil | Desarrollo adicional del modo PWA |
| Capacidad insuficiente del VPS | Incremento del plan de infraestructura |
| Conflictos de integración | Horas adicionales de desarrollo y QA |
| Curva de aprendizaje | Incremento del esfuerzo del equipo |

La reserva del **12 %** se encuentra dentro del rango del **10 % al 15 %** sugerido por la consigna.

---

## 14. Distribución de costos por naturaleza

| Naturaleza del costo | Monto | Participación aproximada |
|---|---:|---:|
| Trabajo del equipo | S/ 16,984.80 | 87.26 % |
| Infraestructura | S/ 394.29 | 2.03 % |
| Licenciamiento | S/ 0.00 | 0.00 % |
| Contingencia | S/ 2,085.49 | 10.71 % |
| **TOTAL** | **S/ 19,464.58** | **100.00 %** |

El presupuesto evidencia que el principal componente económico corresponde al **trabajo del equipo**, mientras que los costos tecnológicos se mantienen reducidos mediante el uso de software libre y servicios gratuitos para el MVP.

---

## 15. Control presupuestario

Durante cada Sprint se deberá comparar:

```text
Costo planificado
      ↓
Horas realmente empleadas
      ↓
Costo real estimado
      ↓
Variación presupuestaria
```

La variación podrá calcularse mediante:

```text
Variación = Costo real - Costo planificado
```

Una variación positiva representa un costo superior al presupuestado, mientras que una variación negativa representa un costo inferior.

La reserva de contingencia **no deberá utilizarse como presupuesto ordinario**. Su utilización deberá asociarse a un riesgo identificado o a un imprevisto justificable.

---

## 16. Consideraciones de sostenibilidad económica

La solución tecnológica seleccionada contribuye a controlar los costos mediante:

- uso de tecnologías open source;
- ausencia de dependencia obligatoria de APIs comerciales de mapas;
- utilización de OpenStreetMap + Leaflet;
- OSRM como motor de rutas;
- PostgreSQL como base de datos;
- despliegue inicial mediante Docker en VPS;
- escalamiento de infraestructura únicamente cuando la demanda lo justifique;
- utilización de planes gratuitos para herramientas de colaboración durante la etapa académica.

Esto permite que el costo tecnológico inicial del MVP permanezca reducido sin modificar la arquitectura funcional definida para el proyecto.

---

## 17. Conclusión

El proyecto presenta un **presupuesto total estimado de S/ 19,464.58**, incluyendo una reserva de contingencia del **12 %**.

El mayor componente económico corresponde a los recursos humanos, con **S/ 16,984.80**, mientras que el uso de tecnologías open source permite mantener el licenciamiento presupuestado en **S/ 0.00**.

La infraestructura inicial representa **S/ 394.29 para seis meses**, bajo el supuesto de un despliegue académico de baja escala.

La estimación deberá revisarse si cambia el alcance del MVP, la duración del proyecto, las necesidades de infraestructura, las tarifas de servicios o las condiciones identificadas en el Registro de Riesgos.

---

## 18. Historial de control de cambios

| Versión | Fecha | Descripción del cambio |
|---|---|---|
| **1.0.0** | 17/09/2026 | Creación inicial del presupuesto del proyecto expresado en soles peruanos, incluyendo CAPEX, licenciamiento, OPEX, contingencia, consolidación financiera y control presupuestario. |

---
