# US-008 — Diseño y avance independiente V_1_1_0

Este documento conserva el avance inicial. La implementación provisional posterior y resultados vigentes están en [US-008 Implementación V_1_1_0](US-008%20Implementación%20V_1_1_0.md).

## Trazabilidad

HGR-26 / US-008 / RF-006 / EP-02 / ST-009 / 5 puntos. Trabajo en el checkout original y rama feature/us-008-gestion-conductores. Fuentes: docs/02 Planificación/01 Transformando a ágil V_1_0_0.md, secciones US-008 y matriz; docs/01 Inicio/06. Requisitos funcionales V_1_1_0.md, RF-006; docs/01 Inicio/11. Base de datos V_1_1_0.md, tabla 5.3; docs/01 Inicio/09. Reglas de negocio V_1_1_0.md, RN-007/RN-008.

## Decisiones pendientes

El encargo declara expresamente propuestas, sin aprobación formal: permisos Administrador/Operador, cuenta opcional y ACTIVO/INACTIVO. RF-006 y los perfiles no definen una matriz uniforme. El SQL documental permite usuario_id nulo y propone DISPONIBLE/NO_DISPONIBLE/INACTIVO; la tabla lógica incluye horarios y coordenadas iniciales obligatorios. La disponibilidad corresponde a US-009. Se requiere aprobar cómo separar datos administrativos, horario y estado operativo, y si las coordenadas iniciales pertenecen al alcance actual. Se propuso vincular exclusivamente usuarios con rol Usuario Final / Conductor; también requiere aprobación. No se modificaron requisitos oficiales.

## Implementación independiente

DriverDataDto prepara los campos documentados nombre_completo (150), dni (20), licencia_categoria (20), anios_experiencia (SMALLINT no negativo), telefono (30). Normaliza espacios exteriores, rechaza blancos y tipos incorrectos. No inventa formato DNI de ocho dígitos, categorías oficiales, años máximos de negocio o vencimientos. El máximo 32767 deriva del tipo SMALLINT. Pruebas incluyen datos ficticios exclusivamente de validación.

El DTO aún no está conectado a ningún endpoint. No hay una función de alta/edición operativa, modelo Prisma Conductor o interfaz React nueva. Los criterios de persistencia, permisos, duplicados y estado todavía no están verificados. No se declara US-008 terminada.

## Diseño condicionado de Prisma y migración

Conductor: conductor_id UUID, nombre_completo, dni único, licencia_categoria, anios_experiencia, telefono. usuario_id único y relación restrictiva si se aprueba la opcionalidad; estado administrativo si se aprueba el catálogo. No añadir vehículo, disponibilidad por jornada ni rutas. Las coordenadas se definirán después de acordar alcance. La modificación de estado seguiría PATCH /drivers/:id.

El archivo US-008-migracion-propuesta.sql es un borrador para revisión separado de prisma/migrations. Contiene el DDL propuesto en comentario y un bloqueo explícito contra ejecución accidental. No es una migración aplicable ni una solución definitiva: la decisión de estado se señala como pendiente. La compatibilidad se revisó solo con schema.prisma y migraciones versionadas; no se inspeccionó la base real. El esquema actual no tiene conductores. Antes de generar una migración final se debe revisar la ausencia de una tabla homónima en un entorno autorizado y coordinar con US-009.

## Plan restante tras aprobación

1. Ajustar schema.prisma y preparar migración aditiva final sin ejecutarla sobre la base real.
2. DriversModule, controller, service, DTO de alta/PATCH/consulta y guard con permisos aprobados. GET /drivers paginado, GET /drivers/:id, POST /drivers y PATCH /drivers/:id. Manejar 400/401/403/404/409 y concurrencia con restricciones únicas. Reutilizar JWT, cookies HttpOnly, origen, Prisma y Swagger; no devolver hashes ni contraseñas.
3. React: tipos/API, listado, detalle y editor responsive, rutas protegidas y menú autorizado. Mensajes específicos de conductores sin alterar usuarios/pedidos.
4. Unitarias y HTTP con Prisma simulado; componentes, estados de carga/error/vacío, navegación y responsive. Integración solo con base aislada y autorización para ejecutar migraciones.

## Pruebas ejecutadas

Jest focalizado: 1 suite y 18 pruebas aprobadas. TypeScript backend (tsc --noEmit) aprobado. ESLint sobre src/drivers aprobado. Sin llamadas a PostgreSQL. No se ejecutaron pruebas de frontend porque todavía no se modificó React; tampoco pruebas de persistencia, migraciones o flujos completos.

## Restricciones preservadas

No se modificaron backend/ o frontend/ antiguos, recursos geográficos, PostgreSQL, Docker, .env, otras historias, rama o arquitectura. Sin commit/push. No se crearon clones ni worktrees.

## Siguiente documento / Siguiente trabajo recomendado

Registrar aprobación explícita de permisos, estados, relación con usuarios y alcance de coordenadas/horarios; después completar API, Prisma y React y adjuntar evidencias de aceptación HGR-26.
