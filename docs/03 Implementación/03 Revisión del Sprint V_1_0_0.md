# 03 Revisión del Sprint V_1_0_0

[← Volver al README principal](../../README.md)

## 1. Datos de la revisión

| Campo | Información |
|---|---|
| **Proyecto** | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| **Sistema según el Acta** | EcoLogística Huancayo |
| **Líder del proyecto** | Rupay, Chira, Rosalyn Exkra |
| **Sprint revisado** | Sprint 1 |
| **Periodo planificado** | 11 al 25 de septiembre de 2026 |
| **Fecha de elaboración** | 2 de octubre de 2026 |
| **Versión** | 1.0.0 |
| **Estado de la revisión con stakeholders** | Demo local realizada; revisión formal con stakeholders pendiente |

## 2. Objetivo del Sprint

> Implementar el flujo base de gestión de usuarios y pedidos, permitiendo el acceso al sistema y la gestión inicial de los pedidos registrados.

## 3. Historias revisadas

| Historia | Resultado | Evidencia / observación |
|---|---|---|
| **US-001 — Iniciar sesión** | Implementada | Login y consulta de identidad autenticada descritos en `implementation/US-001.md`; la suite backend actual pasó 121 pruebas. |
| **US-002 — Cerrar sesión** | Implementada | Cookie HttpOnly, recuperación de sesión y logout descritos en `implementation/US-002.md`. |
| **US-003 — Administrar usuarios y roles** | Implementada | Endpoints y pantallas administrativas descritos en `implementation/US-003.md`. |
| **US-004 — Registrar pedidos** | Implementada; aceptación final pendiente | Formulario, endpoint `POST /orders` y migración aditiva descritos en `implementation/US-004.md`. La navegación E2E al formulario pasó en escritorio para los cuatro roles; esa prueba intercepta la API y no confirma una transacción real. Falta validación manual final del registro y persistencia. |
| **US-005 — Consultar pedidos** | No iniciada | Se mantiene fuera del trabajo actual hasta cerrar y aceptar US-004. |

## 4. Demostración y retroalimentación

Se realizó una **demostración local** de la aplicación. El equipo también confirmó que no hubo una demostración formal del Sprint 1 ante stakeholders. La fecha exacta, las personas presentes y el contenido detallado de la demo local no quedaron registrados. En consecuencia:

- No se registran fecha ni participantes de la demo local, ni comentarios o decisión de aceptación de stakeholders.
- No se afirma que usuarios operativos, docente u otros interesados hayan validado el incremento.
- La verificación técnica realizada el 2 de octubre se distingue de la demo local y no representa aprobación de stakeholders.

### Demo local y evidencia técnica disponible

- Demo local realizada; el contenido concreto mostrado no está detallado en el registro disponible.
- Aplicación React disponible en `http://localhost:5173`.
- API NestJS y Swagger disponibles en `http://localhost:3000` y `http://localhost:3000/api/docs`.
- PostgreSQL 16 saludable en `localhost:5433`, con las migraciones al día.
- Inicio de sesión y consulta de identidad administrativa verificados localmente.
- Prueba E2E de navegación US-004: 4 de 4 escenarios de escritorio aprobados, con API simulada.

La demo local no sustituye una revisión formal con stakeholders ni una prueba real de creación de pedido con persistencia en la base de datos.

## 5. Resultado de la revisión

El objetivo técnico del incremento está implementado en buena parte: autenticación, cierre de sesión y administración de usuarios/roles están completas; el registro de pedidos está implementado y su formulario es accesible para los roles previstos. La aceptación de US-004 continúa pendiente de validación manual con persistencia real y de revisión del equipo/stakeholders.

La revisión formal queda **sin realizar** hasta que el equipo programe la sesión, presente el incremento y registre comentarios y decisiones. No se declara el Sprint aceptado únicamente por contar con pruebas automáticas.

## 6. Pendientes acordados para cerrar la revisión

1. Validar el flujo real de registro de US-004 con Administrador y Operador / Técnico; comprobar respuesta `201` y persistencia de pedido y cliente. No se insertó un registro de muestra durante esta revisión.
2. Repetir la suite unitaria frontend y resolver los cuatro fallos relacionados con acceso a `localStorage`/`sessionStorage`.
3. Programar la revisión formal con stakeholders y conservar acta, fecha, participantes, observaciones y aceptación o cambios solicitados; la demo local ya se realizó.
4. Resolver la discrepancia de planificación de US-005: Jira la incluye en la selección del Sprint 1, mientras que la documentación de implementación dice que no se inició y debe esperar a US-004.
5. Acordar la denominación final del sistema: el Acta dice **EcoLogística Huancayo** y la pantalla actual dice **EcoRuta Huancayo**.

## 7. Historial de control de cambios

| Versión | Fecha | Descripción |
|---|---|---|
| **1.0.0** | 2026-10-02 | Actualización para distinguir la demo local realizada de la revisión formal pendiente con stakeholders. |
