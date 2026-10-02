# 01 Informe de estado del proyecto V_1_0_0

[← Volver al README principal](../../README.md)

## 1. Datos generales

| Campo | Información |
|---|---|
| **Proyecto** | Plataforma web con Algoritmo Genético para optimizar rutas sostenibles de última milla en Huancayo |
| **Sistema indicado en el Acta de Constitución** | EcoLogística Huancayo |
| **Organización beneficiaria** | DistriRápido S.A.C. |
| **Líder del proyecto** | Rupay, Chira, Rosalyn Exkra |
| **Sprint** | Sprint 1 |
| **Periodo planificado** | 11 al 25 de septiembre de 2026 |
| **Fecha de elaboración del informe** | 2 de octubre de 2026 |
| **Versión del documento** | 1.0.0 |
| **Estado** | Demo local realizada; validación final de US-004 y revisión formal con stakeholders pendientes |

## 2. Resumen del estado

El Sprint 1 estableció el flujo inicial de autenticación, administración de usuarios y roles, y registro de pedidos. Las historias US-001, US-002 y US-003 están implementadas. US-004 está implementada y su navegación hacia el formulario fue verificada con pruebas E2E; queda pendiente la validación manual del registro real contra la base de datos y la aceptación formal. US-005 no se ha iniciado y no debe adelantarse hasta cerrar US-004.

El informe se elabora después del periodo planificado del Sprint. Se realizó una demostración local de la aplicación; esto no equivale a una revisión formal ante stakeholders ni representa aprobación de usuarios o interesados. La fecha exacta, las personas presentes y los comentarios específicos de la demo local no quedaron registrados en la información disponible.

## 3. Objetivo del Sprint

> Implementar el flujo base de gestión de usuarios y pedidos, permitiendo el acceso al sistema y la gestión inicial de los pedidos registrados.

El objetivo se transcribe del artefacto de planificación de Jira del Sprint 1.

## 4. Historias de usuario y estado

| Historia | Resultado al 2 de octubre de 2026 | Estado |
|---|---|---|
| **US-001 — Iniciar sesión** | Inicio de sesión, identidad autenticada y control de acceso por rol implementados. | Completada |
| **US-002 — Cerrar sesión** | Persistencia de sesión mediante cookie HttpOnly, restauración de identidad y cierre de sesión implementados. | Completada |
| **US-003 — Administrar usuarios y roles** | Listado, creación y edición de usuarios, asignación de roles y autorización administrativa implementados. | Completada |
| **US-004 — Registrar pedidos** | Formulario y endpoint `POST /orders` implementados. La navegación al formulario pasó E2E para los cuatro roles probados en escritorio. Falta la validación manual final del registro y la persistencia con la interfaz conectada a la base de datos. | En validación final |
| **US-005 — Consultar pedidos** | No iniciada; fuera del trabajo autorizado hasta cerrar US-004. | Pendiente / no iniciada |

## 5. Demostración del trabajo

Sí se realizó una demostración de la aplicación en el entorno local. La fecha exacta, las personas presentes y el contenido detallado que se mostró no quedaron registrados. Esta demo local no se presenta como una revisión formal ante stakeholders; no se registran comentarios ni aceptación formal de usuarios o interesados.

Por separado, como verificación técnica local del 2 de octubre de 2026, se comprobó que PostgreSQL estaba saludable en el puerto 5433, las migraciones estaban aplicadas, el frontend y Swagger respondían, y la autenticación administrativa y la ruta protegida de usuarios respondían correctamente. Además, la prueba E2E `frontend/e2e/order-navigation.spec.ts` aprobó cuatro escenarios de escritorio para los roles del sistema; esa prueba intercepta la API y no crea pedidos en la base de datos.

## 6. Verificación de calidad disponible

| Comprobación | Resultado observado |
|---|---|
| Backend: compilación, TypeScript y lint | Correctos |
| Backend: pruebas unitarias | 121 pruebas aprobadas en 16 suites |
| Frontend: build y lint | Correctos |
| Frontend: pruebas unitarias | 79 aprobadas y 4 fallidas; los fallos ocurren al leer `localStorage`/`sessionStorage` en el entorno de pruebas |
| Frontend: E2E de navegación US-004 | 4 escenarios de escritorio aprobados; API interceptada, sin escritura de pedidos |
| PostgreSQL y migraciones | PostgreSQL saludable; esquema Prisma al día |
| Login, identidad y acceso administrativo | Login, `/auth/me` y acceso a `/users` respondieron HTTP 200 en la verificación local |

Los resultados de E2E de navegación validan el enlace y la presentación del formulario, pero no prueban un registro de pedido real. Los cuatro fallos unitarios del frontend siguen pendientes de diagnóstico y corrección.

## 7. Pendientes y próximos pasos

1. Completar la validación manual de US-004 con Administrador y Operador / Técnico: enviar un pedido válido, comprobar respuesta `201` y verificar su persistencia y la del cliente relacionado. No se ha insertado un pedido de prueba en esta revisión.
2. Realizar la revisión formal con los stakeholders y registrar fecha, participantes, comentarios y decisión de aceptación. La demo local ya realizada no sustituye esta revisión.
3. Investigar y corregir los cuatro fallos de pruebas unitarias del frontend relacionados con almacenamiento web; repetir la suite y conservar el resultado real.
4. Aclarar la diferencia entre la planificación de Jira —que incluye US-005 en la selección del Sprint 1— y los documentos de implementación, que indican que US-005 no se inició y no debe desarrollarse antes del cierre de US-004.
5. Confirmar la denominación del sistema antes de armonizar los documentos: el Acta registra **EcoLogística Huancayo**, mientras que la pantalla de inicio de sesión muestra **EcoRuta Huancayo**. El repositorio se denomina **DistriRapido** y la organización beneficiaria **DistriRápido S.A.C.**; no se modificaron esas denominaciones en esta versión.

## 8. Fuentes de trazabilidad

- [Acta de Constitución](../01%20Inicio/02.%20Acta%20de%20Constituci%C3%B3n%20V_1_0_0.md)
- [Artefactos Jira](../02%20Planificaci%C3%B3n/02%20Artefactos%20Jira%20V_1_0_0.md)
- [Implementación de US-004](../../implementation/US-004.md)
- [README principal](../../README.md)

## 9. Historial de control de cambios

| Versión | Fecha | Descripción |
|---|---|---|
| **1.0.0** | 2026-10-02 | Actualización para registrar la demo local y distinguirla de la revisión formal con stakeholders. |
