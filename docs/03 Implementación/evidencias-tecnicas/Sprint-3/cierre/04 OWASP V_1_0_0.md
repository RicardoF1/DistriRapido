# 04 OWASP V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7
- Actualización del análisis estático: 2026-11-06 20:03:59 -05:00, commit 37bd746c8227219aceb5652a9a510fa750f9c9dd

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

## Análisis estático con SonarQube

Análisis final sobre main, commit `37bd746c8227219aceb5652a9a510fa750f9c9dd`, con SonarQube 10.5.1 (detalle en 03 Calidad de código V_1_0_0):

- Quality Gate: OK, con condiciones de código nuevo evaluadas.
- Vulnerabilities: 0. Security rating: A.
- Security review rating: E, porque se ha revisado el 0% de los Security Hotspots. La revisión de seguridad no está aprobada.

### Hotspots corregidos

- `src/backend/src/orders/order.dto.ts`, líneas 31 y 32 (S5852, denegación de servicio por backtracking): la validación de zona horaria de `ventana_inicio` y `ventana_fin` pasó de `/T.*(?:Z|[+-]\d{2}:\d{2})$/` a `/T[^T]*(?:Z|[+-]\d{2}:\d{2})$/`, de tiempo lineal. Se conserva `@IsISO8601({ strict: true })`. En la medición local, una entrada de 100 000 caracteres T bajó de unos 16.7 s a menos de 1 ms. Hay pruebas para valores válidos e inválidos y para la entrada maliciosa. Los dos hotspots desaparecieron en el segundo análisis.

### Hotspots pendientes de revisión manual

| Archivo | Línea | Regla | Probabilidad | Estado | Observación técnica |
|---|---:|---|---|---|---|
| `src/frontend/src/features/users/UserForm.tsx` | 21 | S2068 (credencial en el código) | HIGH | TO_REVIEW | La cadena señalada es el mensaje de validación de la contraseña inicial, no una credencial. |
| `src/frontend/src/features/auth/LoginForm.tsx` | 32 | S5852 (backtracking) | MEDIUM | TO_REVIEW | La expresión del correo se aplica solo si el valor tiene 255 caracteres o menos, y se ejecuta en el navegador. |
| `src/frontend/src/features/users/UserForm.tsx` | 19 | S5852 (backtracking) | MEDIUM | TO_REVIEW | Mismo límite previo de 255 caracteres; el campo tiene además `maxLength={255}`. |

Las observaciones técnicas son el resultado del análisis del código. Los tres hotspots siguen pendientes de revisión y clasificación en SonarQube.

## Riesgos pendientes

- Revisar las seis vulnerabilidades de severidad baja reportadas por npm.
- Revisar y clasificar en SonarQube los tres Security Hotspots en estado TO_REVIEW (Security review rating E).
- Mantener dependencias mayores bajo actualización planificada.
- Aprovisionar OSRM con origen, revisión y permisos documentados.

## Conclusión

No se identificaron bloqueos críticos durante las pruebas, el análisis de CI ni el análisis de SonarQube, que reporta 0 vulnerabilidades y Security rating A. La revisión de seguridad no está completa: quedan tres Security Hotspots por revisar (Security review rating E). Antes de un despliegue productivo hay que completar esa revisión, la auditoría de dependencias y pruebas dinámicas.
