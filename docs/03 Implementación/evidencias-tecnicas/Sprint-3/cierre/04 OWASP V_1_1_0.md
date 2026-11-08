# 04 OWASP V_1_0_0

## Identificación

- Fecha de generación: 2026-10-30 15:55:51 -05:00
- Rama: main
- Commit corto: debc2e7
- Commit completo: debc2e7893863c64111586a32fd9a955b88c8da2
- Pull Request final: #12
- Commit de integración en main: debc2e7
- Actualización del análisis estático: 2026-11-06 20:03:59 -05:00, commit 37bd746c8227219aceb5652a9a510fa750f9c9dd
- Validación funcional con OSRM local: 2026-11-06, commit 600564f6c309e36b38904830652c5add1f70a799

## Alcance revisado

- Inicio y cierre de sesión.
- Roles y autorización.
- Gestión de conductores y credenciales.
- Planificación y consulta de rutas; endpoint backend de asignación con control de versión, sin interfaz habilitada en este incremento.
- Operación de entregas.
- Validación de entradas y errores HTTP.
- Persistencia con Prisma y PostgreSQL.
- Servicio local de rutas OSRM y su integración con el backend.

## Controles observados

### Autenticación

- Contraseñas almacenadas mediante Argon2id.
- Bootstrap administrativo exige contraseña de 12 a 128 caracteres.
- La cuenta local se crea mediante el mecanismo oficial y no con SQL en texto plano.
- Revocación mediante versión de credenciales y sesiones.

### Autorización

- Acceso condicionado por roles.
- Operaciones del conductor verifican identidad y pertenencia.
- La asignación (endpoint backend `PATCH /routes/:id/assignment`) utiliza controles de versión y estado. Los controles fueron revisados en el endpoint backend y sus pruebas; no se realizó validación manual desde la interfaz porque esa acción no está disponible.
- La actualización de entregas utiliza controles de versión y estado.

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

### Servicio de rutas OSRM

Controles comprobados en la validación del 2026-11-06:

- OSRM se publica únicamente en `127.0.0.1:5000`; no queda expuesto en otras interfaces del equipo.
- El backend consulta `http://osrm:5000` dentro de la red de Compose. `OSRM_ALLOWED_ORIGIN` coincide exactamente con `OSRM_BASE_URL`; se rechazan URLs con credenciales, consultas o fragmentos, y no se siguen redirecciones.
- No se usan servidores públicos de demostración: `router.project-osrm.org` y `routing.openstreetmap.de` se rechazan por configuración.
- La carpeta del grafo se monta en solo lectura y sin crear la ruta en el host.
- La imagen está fijada por tag y digest: `ghcr.io/project-osrm/osrm-backend:v26.10.0-debian@sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f`. No se usa `latest`.
- El contenedor usa raíz de solo lectura, `tmpfs` para `/tmp`, `cap_drop: ALL`, `no-new-privileges`, límites de 2 CPU y 2 GB y `restart: "no"`.
- El backend limita el ajuste de cada punto a 100 m y envía ese límite a OSRM.
- El PBF, el recorte, el grafo y su procedencia permanecen en `.local/osrm-data`, ignorada por Git. Los datos OpenStreetMap están bajo licencia ODbL y no se redistribuyen desde el repositorio.
- Las variables de OSRM se definieron solo en la sesión; no se modificó `.env` ni se registran contraseñas, tokens o la cadena de conexión a la base de datos.

## Análisis estático con SonarQube

Análisis final sobre main, commit `37bd746c8227219aceb5652a9a510fa750f9c9dd`, con SonarQube 10.5.1 (detalle en 03 Calidad de código V_1_0_0):

- Quality Gate: OK, con condiciones de código nuevo evaluadas.
- Vulnerabilities: 0. Security rating: A.
- Security review rating: A, con el 100% de los Security Hotspots revisados (era E antes de la revisión manual).

### Hotspots corregidos

- `src/backend/src/orders/order.dto.ts`, líneas 31 y 32 (S5852, denegación de servicio por backtracking): la validación de zona horaria de `ventana_inicio` y `ventana_fin` pasó de `/T.*(?:Z|[+-]\d{2}:\d{2})$/` a `/T[^T]*(?:Z|[+-]\d{2}:\d{2})$/`, de tiempo lineal. Se conserva `@IsISO8601({ strict: true })`. En la medición local, una entrada de 100 000 caracteres T bajó de unos 16.7 s a menos de 1 ms. Hay pruebas para valores válidos e inválidos y para la entrada maliciosa. Los dos hotspots desaparecieron en el segundo análisis.

### Hotspots revisados manualmente

| Archivo | Línea | Regla | Probabilidad | Estado | Justificación registrada |
|---|---:|---|---|---|---|
| `src/frontend/src/features/users/UserForm.tsx` | 21 | S2068 (credencial en el código) | HIGH | REVIEWED / SAFE | La cadena detectada es un mensaje de validación sobre la longitud permitida, no una contraseña ni una credencial codificada. La contraseña real procede del formulario y no está almacenada en el código fuente. |
| `src/frontend/src/features/auth/LoginForm.tsx` | 32 | S5852 (backtracking) | MEDIUM | REVIEWED / SAFE | La expresión regular solo se ejecuta cuando el correo normalizado tiene como máximo 255 caracteres. El operador `&&` aplica cortocircuito antes de `RegExp.test()`, por lo que las entradas mayores no son evaluadas. |
| `src/frontend/src/features/users/UserForm.tsx` | 19 | S5852 (backtracking) | MEDIUM | REVIEWED / SAFE | La expresión regular solo se ejecuta para valores de hasta 255 caracteres. La condición de longitud aparece primero, el operador `\|\|` aplica cortocircuito y el campo también usa `maxLength=255`. |

La clasificación se registró el 2026-11-06 20:45 -05:00 mediante revisión manual en SonarQube: cada hotspot recibió su comentario técnico y pasó a REVIEWED / SAFE. Los hotspots no se eliminaron del código; se revisaron y se clasificaron como seguros. No se modificó código ni se ejecutó un nuevo análisis para esta clasificación.

## Riesgos pendientes

- Revisar las seis vulnerabilidades de severidad baja reportadas por npm.
- Mantener dependencias mayores bajo actualización planificada.
- Revisar el aviso de npm sobre scripts de instalación no cubiertos por `allowScripts` en la construcción de imágenes.
- Reevaluar los límites de CPU, memoria y concurrencia de OSRM antes de un despliegue con varias instancias.

## Conclusión

No se identificaron bloqueos críticos durante las pruebas, el análisis de CI ni el análisis de SonarQube, que reporta 0 vulnerabilidades y Security rating A. Los tres Security Hotspots se revisaron manualmente y quedaron REVIEWED / SAFE, con Security review rating A. OSRM local quedó aprovisionado con origen, revisión, imagen fijada por digest, montaje de solo lectura y exposición limitada a localhost. Antes de un despliegue productivo todavía hay que completar la auditoría de dependencias y las pruebas dinámicas.
