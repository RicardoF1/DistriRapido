# US-009 Implementación V_1_1_0

## 1. Resumen

Se implementó el módulo de disponibilidad operativa para conductores mediante PostgreSQL, Prisma, NestJS, React y TypeScript.

## 2. Base de datos

Se agregó el modelo Prisma DisponibilidadConductor y la tabla:

disponibilidades_conductores

La migración oficial es:

202610090002_us009_disponibilidad_conductores

La migración es aditiva y no elimina ni modifica datos existentes.

## 3. Backend

Módulo:

src/backend/src/availability/

Componentes:

- availability.module.ts
- availability.controller.ts
- availability.service.ts
- availability.guard.ts
- dto/availability.dto.ts

Funciones implementadas:

- Listar registros con filtros y paginación.
- Consultar un registro.
- Registrar disponibilidad.
- Modificar disponibilidad.
- Validar periodos.
- Validar conductor activo.
- Detectar solapamientos.
- Traducir errores Prisma.
- Proteger los endpoints mediante JWT, origen permitido y roles.

## 4. Frontend

Componentes principales:

- src/frontend/src/features/availability/AvailabilityForm.tsx
- src/frontend/src/pages/AvailabilityPage.tsx
- src/frontend/src/layouts/AvailabilityLayout.tsx
- src/frontend/src/services/availability-api.ts
- src/frontend/src/types/availability.ts

Integraciones:

- AppRoutes.tsx
- ProtectedRoute.tsx
- AppLayout.tsx
- styles/app.css
- services/api.ts

La opción Disponibilidad fue añadida al sidebar sin modificar los elementos existentes.

## 5. Validaciones

- Conductor obligatorio.
- Inicio obligatorio.
- Fin obligatorio.
- Fin posterior al inicio.
- Estado permitido.
- Conductor existente.
- Conductor activo.
- Registro existente para actualización.
- Rechazo de intervalos superpuestos.
- Restricción por roles.

## 6. Pruebas ejecutadas

### Backend Jest

- 3 suites aprobadas.
- 17 pruebas aprobadas.

Cobertura funcional:

- Registro válido.
- Periodo inválido.
- Conductor inexistente.
- Conductor inactivo.
- Solapamiento.
- Modificación.
- Actualización vacía.
- Registro inexistente.
- Autorización por roles.
- Validación de DTO.

### Frontend Vitest

- 2 archivos aprobados.
- 10 pruebas aprobadas.

Cobertura funcional:

- Carga de conductores activos.
- Registro.
- Conversión de fechas a ISO.
- Validación del periodo.
- Carga para edición.
- Presentación de conflictos.
- Reintento.
- Contrato GET.
- Contrato POST.
- Contrato PATCH.

### Playwright E2E

- 7 pruebas aprobadas.

Cobertura funcional:

- Listado.
- Registro.
- Edición.
- Conflicto por superposición.
- Bloqueo para Conductor.
- Bloqueo para Auditor Externo.
- Responsive en 390, 768 y 1440 píxeles.

Total: 34 pruebas automatizadas aprobadas.

## 7. Pruebas manuales

Se comprobó:

- Inicio de sesión administrativo.
- Registro mediante POST.
- Consulta general.
- Consulta individual.
- Modificación mediante PATCH.
- Conflicto HTTP 409.
- Periodo inválido HTTP 400.
- Límite de solicitudes HTTP 429.
- Persistencia en PostgreSQL.
- Registro y edición desde React.

## 8. Commits principales

- 870ee34: modelo y migración.
- c87b721: API de disponibilidad.
- d5ec292: pruebas backend.
- ef2c602: interfaz React.
- 12d0632: mejora visual.
- ddc9461: pruebas frontend.
- 056bcec: prueba E2E y manejo de conflictos.

## 9. Limitaciones y trabajo pendiente

- Vehículos pendiente de US-007.
- Bloqueo posterior al inicio de planificación pendiente de US-010.
- La versión actual cubre completamente la disponibilidad de conductores dentro de las dependencias disponibles.
