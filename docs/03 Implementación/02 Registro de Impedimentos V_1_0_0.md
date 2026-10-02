# 02 Registro de Impedimentos V_1_0_0

[← Volver al README principal](../../README.md)

## 1. Datos generales

| Campo | Información |
|---|---|
| **Proyecto** | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| **Líder del proyecto** | Rupay, Chira, Rosalyn Exkra |
| **Sprint revisado** | Sprint 1, planificado del 11 al 25 de septiembre de 2026 |
| **Versión del documento** | 1.0.0 |
| **Fecha de actualización** | 2 de octubre de 2026 |
| **Criterio de registro** | Separar hechos verificables, asuntos posteriores al Sprint y ejemplos que requieren confirmación del equipo |

## 2. Impedimentos durante el Sprint 1

De acuerdo con la información proporcionada para este registro, **no hubo impedimentos durante el Sprint 1** (11–25 de septiembre de 2026). Por lo tanto, no se atribuyen al Sprint los problemas encontrados después al preparar y ejecutar el proyecto en el equipo local.

## 3. Incidencias observadas al ejecutar el proyecto localmente

Las siguientes situaciones se presentaron durante la preparación o ejecución local posterior al Sprint, entre el 1 y el 2 de octubre de 2026. Se registran para dejar constancia de lo que ocurrió en este equipo; no cuentan como impedimentos del Sprint 1.

| Impedimento # | Fecha de registro | Descripción e impacto | Prioridad | Reportado por | Fecha tope | Estado | Fecha de resolución | Resolución / comentarios |
|---|---|---|---|---|---|---|---|---|
| **LOCAL-01** | 2026-10-01 | Docker Desktop/WSL aún no estaban listos; no se podía iniciar PostgreSQL ni probar la aplicación localmente. | Alta | Registro de puesta en marcha local | No se fijó | Resuelto | 2026-10-02 | Docker Desktop quedó instalado para el usuario, WSL 2 operativo y los términos aceptados. PostgreSQL 16 quedó saludable en `localhost:5433`. |
| **LOCAL-02** | 2026-10-01 | El Node disponible era v26, pero la guía del proyecto requiere Node 24; esto podía impedir reproducir el entorno esperado. | Media | Registro de puesta en marcha local | No se fijó | Resuelto | 2026-10-01 | Se instaló Node v24.21.0 y npm 11.19.0 en una carpeta local dedicada a DistriRapido, sin modificar el Node global. |
| **LOCAL-03** | 2026-10-01 | No había un `.env.example` en el repositorio, lo que dificultaba configurar el proyecto para ejecutarlo localmente. | Media | Revisión de la puesta en marcha local | No se fijó | Mitigado localmente; plantilla pendiente | Parcial: 2026-10-01 | Se creó un `.env` local, ignorado por Git, para iniciar el sistema. Sigue pendiente agregar al repositorio una plantilla compartible sin secretos. |
| **LOCAL-04** | 2026-10-01 | Cuatro pruebas unitarias del frontend fallan al leer `localStorage`/`sessionStorage`; la suite frontend no queda completamente aprobada. | Media | Ejecución de pruebas local | No se fijó | Abierto | — | Build, lint y E2E de navegación pasan; falta investigar y corregir los cuatro fallos unitarios. No se atribuye una causa definitiva. |

> Las fechas tope se indican como “No se fijó” cuando no se acordó una fecha. La prioridad refleja el impacto observado durante la puesta en marcha local.

## 4. Cierre

No se registran impedimentos del Sprint 1 ni ejemplos hipotéticos. El registro se limita a las incidencias verificadas al preparar y ejecutar DistriRapido localmente después del periodo del Sprint.

## 5. Historial de control de cambios

| Versión | Fecha | Descripción |
|---|---|---|
| **1.0.0** | 2026-10-02 | Actualización: se deja constancia de que no hubo impedimentos durante el Sprint y se registran únicamente incidencias de ejecución local posteriores. |
