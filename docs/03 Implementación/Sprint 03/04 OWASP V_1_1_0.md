# 04 OWASP V_1_1_0

> Sprint 3 · Informe histórico V_1_1_0. Resultados sobre `33e7601` (noviembre de 2026), no sobre el HEAD actual. Traslado documental a la ruta oficial el 2026-11-12; no se repitieron pruebas, auditorías ni reuniones.

[Evidencia técnica conservada](../evidencias-tecnicas/Sprint-3/cierre/06%20Evidencia%20técnica%20de%20cierre%20del%20Sprint%203%20V_1_1_0.md) · [Otros informes del Sprint 3](../../README.md#sprint-3--ubicación-oficial)

## Identificación

- Versión del documento: V_1_1_0 (sustituye a V_1_0_0, disponible en el historial de Git)
- Fecha de actualización: 2026-11-07 -05:00
- Rama: main
- Commit final evaluado: 33e7601 (33e76018d3c656d1702d059765c518368d482234), 2026-11-07 14:57:19 -05:00
- Commit de integración original: debc2e7 (PR #12), 2026-10-30
- Validación funcional con OSRM local: 2026-11-06, commit 600564f
- Habilitación de la asignación desde la interfaz (HGR-34): 7745ef3, 2026-11-06 23:04:17 -05:00
- Análisis SonarQube final: análisis 9 sobre 33e7601, 2026-11-07 14:59:42 -05:00, Quality Gate OK
- Frontend desplegado localmente desde 33e7601: imagen sha256:98cfee35ba8a…, 2026-11-07 15:15:55 -05:00

## Alcance revisado

- Inicio y cierre de sesión.
- Roles y autorización.
- Gestión de conductores y credenciales.
- Planificación, consulta de rutas y asignación a conductores desde la interfaz (`7745ef3`) sobre el endpoint `PATCH /routes/:id/assignment`.
- Operación de entregas.
- Validación de entradas y errores HTTP.
- Persistencia con Prisma y PostgreSQL.
- Servicio local de rutas OSRM y su integración con el backend.
- Política de seguridad de contenido del frontend servido con nginx.

## Controles observados

### Autenticación

- Contraseñas almacenadas mediante Argon2id.
- Bootstrap administrativo exige contraseña de 12 a 128 caracteres.
- La cuenta local se crea mediante el mecanismo oficial y no con SQL en texto plano.
- Revocación mediante versión de credenciales y sesiones.

### Autorización

- Acceso condicionado por roles.
- Operaciones del conductor verifican identidad y pertenencia.
- La asignación (`PATCH /routes/:id/assignment`) utiliza controles de versión y estado y está disponible desde la interfaz desde `7745ef3`; se validó manualmente en local.
- El registro de entregas verifica que la parada pertenezca al conductor autenticado, que corresponda a la versión vigente de la ruta y que la ruta esté ASIGNADA o EN_CURSO; bloquea la fila (`FOR UPDATE`) y aplica control optimista con `version_entrega`. Un rechazo 409 se validó sin cambios parciales.

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

### Política de seguridad de contenido (CSP)

- nginx sirve el frontend con `default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self' http://localhost:3000 https://photon.komoot.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`.
- La auditoría de accesibilidad confirmó que la CSP bloquea los estilos en línea (`style-src-attr`): la rotación de las flechas de sentido del mapa no se aplica en producción. Se mantiene la CSP sin `unsafe-inline`; la corrección prevista usa clases CSS predefinidas.
- Para auditar con axe sin debilitar la CSP, el motor se inyectó por evaluación del protocolo de depuración y no mediante scripts insertados.

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

Análisis final sobre main, commit `33e76018d3c656d1702d059765c518368d482234` (análisis 9, 2026-11-07 14:59:42 -05:00), con SonarQube 10.5.1 (detalle en 03 Calidad de código V_1_1_0):

- Quality Gate: OK.
- Vulnerabilities: 0. Security rating: A.
- Security Hotspots pendientes: 0. Security review rating: A.
- Los tres hotspots revisados el 2026-11-06 siguen REVIEWED / SAFE; los análisis 4 a 9 no introdujeron hotspots nuevos.

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
- H1: al recuperar el foco de la ventana se revalida la sesión y se vuelve a montar la vista. No expone datos, pero borra la contraseña escrita y cierra la lista de entregas; revisar junto con el manejo de expiración de sesión.
- Rotación de flechas bloqueada por la CSP: no es un riesgo de seguridad, pero no debe resolverse debilitando `style-src`.

## Conclusión

No se identificaron bloqueos críticos durante las pruebas, el análisis de CI ni el análisis de SonarQube, que en el análisis 9 sobre `33e7601` reporta Quality Gate OK, 0 vulnerabilidades y Security rating A. Los tres Security Hotspots siguen REVIEWED / SAFE, sin hotspots pendientes, y Security review rating es A. La CSP se mantiene sin `unsafe-inline`. OSRM local quedó aprovisionado con origen, revisión, imagen fijada por digest, montaje de solo lectura y exposición limitada a localhost. Antes de un despliegue productivo todavía hay que completar la auditoría de dependencias y las pruebas dinámicas.

---

## Historial documental de ubicación

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | Véase historial Git | Versión inicial anterior, no recreada ni duplicada. |
| V_1_1_0 | Actualización técnica registrada: 2026-11-07; evidencias posteriores: 2026-11-08 | Se mantiene la justificación y el detalle histórico del informe. |
| V_1_1_0, corrección de ubicación | 2026-11-12 | Traslado desde `evidencias-tecnicas/Sprint-3/cierre/` a `Sprint 03/`, enlaces ajustados. No es una nueva medición. |

[← Volver al README principal](../../../README.md) · [Índice documental](../../README.md)
