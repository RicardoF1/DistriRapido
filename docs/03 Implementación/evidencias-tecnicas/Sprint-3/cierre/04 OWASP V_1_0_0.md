# 04 OWASP V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7

## Alcance revisado

- Inicio y cierre de sesión.
- Roles y autorización.
- Gestión de conductores y credenciales.
- Planificación, asignación y operación de entregas.
- Validación de entradas y errores HTTP.
- Persistencia con Prisma y PostgreSQL.

## Controles observados

### Autenticación

- Contraseñas almacenadas mediante Argon2id.
- Bootstrap administrativo exige contraseña de 12 a 128 caracteres.
- La cuenta local se crea mediante el mecanismo oficial y no con SQL en texto plano.
- Revocación mediante versión de credenciales y sesiones.

### Autorización

- Acceso condicionado por roles.
- Operaciones del conductor verifican identidad y pertenencia.
- Asignación y actualización utilizan controles de versión y estado.

### Entrada y persistencia

- DTO y validaciones de NestJS.
- Prisma evita concatenación manual en operaciones ordinarias.
- Migraciones versionadas y despliegue mediante prisma migrate deploy.
- Idempotencia y conflictos controlados en cálculos de planificación.

### Secretos y datos privados

- Variables sensibles fuera de Git.
- Token de SonarQube manejado solo en sesión.
- geodata/coverage/v1 permanece ignorado por restricciones de redistribución.
- No se publican contraseñas, hashes ni paquetes privados.

## Riesgos pendientes

- Revisar las seis vulnerabilidades de severidad baja reportadas por npm.
- Ejecutar análisis definitivo de SonarQube y revisar Security Hotspots.
- Mantener dependencias mayores bajo actualización planificada.
- Aprovisionar OSRM con origen, revisión y permisos documentados.

## Conclusión

No se identificaron bloqueos críticos durante las pruebas y el análisis de CI. La revisión debe complementarse con SonarQube, auditoría de dependencias y pruebas dinámicas antes de un despliegue productivo.
