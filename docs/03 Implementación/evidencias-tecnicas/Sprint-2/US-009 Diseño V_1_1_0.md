# US-009 Diseño V_1_1_0

## 1. Identificación

- Historia: US-009
- Hito: HGR-27
- Requisito funcional: RF-007
- Título: Registrar disponibilidad operativa
- Sprint: Sprint 2
- Versión: 1.1.0
- Estado: Implementado para conductores

## 2. Objetivo

Permitir que los usuarios autorizados registren, consulten y modifiquen la disponibilidad operativa de los conductores mediante intervalos de fecha y hora, antes del proceso de planificación.

## 3. Alcance implementado

La versión 1.1.0 incluye:

- Registro de disponibilidad de conductores.
- Consulta paginada de disponibilidades.
- Consulta individual.
- Modificación de registros existentes.
- Estados DISPONIBLE y NO_DISPONIBLE.
- Validación de conductor existente y activo.
- Validación de que el fin sea posterior al inicio.
- Prevención de intervalos superpuestos.
- Acceso para Administrador y Operador / Técnico.
- Interfaz responsive.
- Persistencia mediante PostgreSQL y Prisma.

## 4. Dependencias

### US-008 Gestión de conductores

US-009 utiliza el modelo Conductor y su clave conductor_id, incorporados por US-008.

### US-007 Gestión de vehículos

La historia funcional menciona vehículos y conductores. La integración de vehículos queda pendiente hasta que US-007 exponga e integre oficialmente el modelo Vehículo, su clave primaria, estados y reglas operativas.

No se creó un modelo provisional de vehículos para evitar incompatibilidades futuras.

### US-010 Planificación

La restricción que impide modificar una disponibilidad después de iniciar la planificación depende del estado y modelo que incorpore US-010.

La versión actual permite registrar y modificar disponibilidades, pero deja preparada la integración posterior con planificación.

## 5. Roles autorizados

Se utiliza el catálogo RBAC vigente:

- Administrador: acceso completo.
- Operador / Técnico: acceso completo.
- Usuario Final / Conductor: sin acceso.
- Auditor Externo: sin acceso.

No se creó el rol Planificador porque no forma parte del catálogo implementado.

## 6. Modelo de datos

Entidad: DisponibilidadConductor.

Campos:

- disponibilidad_id: UUID, clave primaria.
- conductor_id: UUID, clave foránea.
- inicio: fecha y hora con zona horaria.
- fin: fecha y hora con zona horaria.
- estado: DISPONIBLE o NO_DISPONIBLE.
- creado_en: fecha de creación.
- actualizado_en: fecha de actualización.

Restricciones:

- fin debe ser posterior a inicio.
- conductor_id debe existir.
- no se permite eliminar al conductor si tiene registros relacionados.
- no se permite repetir exactamente conductor, inicio y fin.
- el servicio rechaza cualquier solapamiento parcial o total.

## 7. Endpoints

- GET /availability
- GET /availability/:id
- POST /availability
- PATCH /availability/:id

Todos los endpoints requieren autenticación y autorización operativa.

## 8. Diseño frontend

Rutas:

- /disponibilidad
- /disponibilidad/nuevo
- /disponibilidad/:id
- /disponibilidad/:id/editar

La interfaz incluye:

- Selector de conductor activo.
- Inicio y fin de jornada.
- Estado operativo.
- Filtros por estado y periodo.
- Listado paginado.
- Consulta individual.
- Edición.
- Mensajes de validación y conflicto.
- Diseño responsive para móvil, tableta y escritorio.

## 9. Decisiones técnicas

- Los periodos se almacenan como TIMESTAMPTZ.
- El frontend convierte datetime-local a ISO.
- Prisma y PostgreSQL normalizan las fechas a UTC.
- La presentación utiliza la zona America/Lima.
- No existe eliminación física porque US-009 solicita registrar y modificar.
- Cualquier intervalo superpuesto se considera incompatible, independientemente del estado registrado.

## 10. Trazabilidad

- HGR-27
- US-009
- RF-007
- RN-007
- RN-008
