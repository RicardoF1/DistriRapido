[← Volver al README principal](../../../README.md)

# Despliegue en producción (Render)

**Proyecto:** DistriRapido · EcoRuta Huancayo
**Workflow:** [`.github/workflows/deploy-production.yml`](../../../.github/workflows/deploy-production.yml)
**Fecha:** 2026-11-19

## 1. Arquitectura

| Servicio en Render | Origen | Función |
|---|---|---|
| `distrirapido` (Web Service, imagen) | `ghcr.io/ricardof1/distrirapido-frontend` | nginx con el build de producción de Vite. Reenvía `/api/*` al backend sin el prefijo. |
| `distrirapido-api` (Web Service, imagen) | `ghcr.io/ricardof1/distrirapido-backend` | API NestJS. Expone `GET /health` para el despliegue y el monitoreo. |
| `distrirapido-osrm` (Web Service, imagen) | `ghcr.io/ricardof1/distrirapido-osrm` | OSRM v26.10.0 con el grafo vial de Huancayo, preparado durante la construcción de la imagen. |
| `distrirapido-db` (PostgreSQL) | Render | Base de datos de producción. |

El usuario abre solo la URL del frontend. Como la API se consume en el mismo origen (`/api`), la cookie de sesión (`SameSite=Lax`) viaja en cada petición y la CSP solo necesita `'self'`. En Render, el frontend y la API tienen subdominios distintos de `onrender.com`, y el navegador los trata como sitios diferentes. Sin el proxy, el inicio de sesión no funcionaría.

### Flujo del workflow

1. **Disparo:** cuando «DistriRapido tests» termina en verde después de un push a `main`. También se puede lanzar a mano.
2. **Cobertura:** el paquete INEI llega desde el Secret `COVERAGE_V1_TAR_XZ_B64` y se verifica contra los SHA-256 de `geodata/coverage-release.json` con `scripts/provision-coverage.cjs`.
3. **Imágenes:** se construyen el backend (con `APP_VERSION` igual al commit) y el frontend (con `VITE_API_URL=/api`), y se publican en GHCR.
4. **OSRM:** la imagen se reconstruye solo si cambia `infra/osrm/Dockerfile`, porque su etiqueta es el hash de ese archivo, o si se pide a mano.
5. **Migraciones:** `prisma migrate deploy` se ejecuta contra la base de producción.
6. **Despliegue:** se llama a los *deploy hooks* de Render con `imgURL`, para que cada servicio despliegue exactamente la imagen recién construida.
7. **Verificación:** se espera hasta 15 minutos a que `GET /api/health` informe el commit nuevo y `database: up`. Luego se comprueba que `/`, `/login`, `/api/health` y la cobertura respondan 200. Los tiempos (TTFB y total) quedan en el resumen de la ejecución.

Si todavía faltan los *deploy hooks* o la URL, el workflow publica las imágenes y migra la base, pero no despliega. Avisa de esto con un *warning*.

## 2. Decisión sobre la cobertura INEI

`geodata/coverage-release.json` mantiene `publicReleaseAllowed: false`, porque los permisos de redistribución del INEI siguen sin confirmarse. Aun así, el equipo decidió el 2026-11-19 desplegar con esa cobertura para la Inspección 5:

- el paquete no se versiona en Git;
- entra en la construcción solo como GitHub Secret;
- las imágenes de GHCR se mantienen privadas.

Esto tiene una consecuencia: el frontend desplegado sirve `coverage.geojson` a cualquier visitante, igual que en local. La alternativa de usar límites de OpenStreetMap, que sí se pueden redistribuir, queda registrada como deuda técnica.

## 3. Configuración inicial (una sola vez)

Las imágenes tienen que existir en GHCR antes de crear los servicios de Render. Por eso el orden es el siguiente.

### 3.1 Secrets necesarios para la primera ejecución

En GitHub, en *Settings → Secrets and variables → Actions → New repository secret*:

| Secret | Valor |
|---|---|
| `COVERAGE_V1_TAR_XZ_B64` | El paquete `geodata/coverage/v1/` comprimido en tar.xz y codificado en base64 (unos 26 KB). Ver el comando más abajo. |
| `PRODUCTION_DATABASE_URL` | La *External Database URL* de `distrirapido-db`, terminada en `?sslmode=require`. |

Para generar `COVERAGE_V1_TAR_XZ_B64`, ejecuta en Git Bash desde la raíz del repositorio. El comando copia el valor al portapapeles; pégalo directamente en GitHub sin guardarlo en ningún archivo:

```bash
tar cJf - -C geodata coverage/v1 | base64 -w0 | clip
```

Para crear `distrirapido-db` en Render: *New → Postgres*, plan Free, región Virginia. La base gratuita vence a los 30 días.

### 3.2 Primera ejecución

Fusiona en `main`. El workflow publica las tres imágenes y aplica las migraciones; el paso de despliegue queda omitido.

Después revisa *github.com → tu perfil → Packages*:

- los tres paquetes `distrirapido-*` deben estar en **Private**;
- anota el valor `OSRM_DATA_REVISION` que aparece en el resumen de la ejecución.

### 3.3 Credencial para que Render lea GHCR

1. En GitHub, ve a *Settings → Developer settings → Personal access tokens (classic)*.
2. Crea un token que solo tenga el permiso `read:packages`.
3. En Render, ve a *Account Settings → Container Registry Credentials* y registra el usuario de GitHub con ese token.

### 3.4 Servicios web en Render

Los tres se crean desde *New → Web Service → Existing Image*, con plan Free, región Virginia y la credencial del paso anterior.

| Servicio | Imagen | Health check | Variables de entorno |
|---|---|---|---|
| `distrirapido-osrm` | `ghcr.io/ricardof1/distrirapido-osrm:latest` | `/nearest/v1/driving/-75.2049,-12.0651` | No requiere. |
| `distrirapido-api` | `ghcr.io/ricardof1/distrirapido-backend:latest` | `/health` | Ver la tabla siguiente. |
| `distrirapido` | `ghcr.io/ricardof1/distrirapido-frontend:latest` | `/login` | `API_UPSTREAM` = URL pública de `distrirapido-api`, sin barra final. |

Variables de `distrirapido-api`:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | *Internal Database URL* de `distrirapido-db` |
| `JWT_SECRET` | Valor aleatorio de al menos 32 caracteres. Se puede usar el botón *Generate* de Render. |
| `FRONTEND_ORIGIN` | URL pública de `distrirapido`, por ejemplo `https://distrirapido.onrender.com` |
| `NODE_ENV` | `production` |
| `OSRM_BASE_URL` y `OSRM_ALLOWED_ORIGIN` | URL pública de `distrirapido-osrm` (el mismo valor en las dos) |
| `OSRM_PROFILE` | `driving` |
| `OSRM_DATA_REVISION` | El valor anotado en el paso 3.2 |
| `OSRM_TIMEOUT_MS` / `OSRM_TOTAL_TIMEOUT_MS` | `30000` / `60000`. Con esto, la primera consulta tolera el arranque en frío de OSRM. |

Render asigna `PORT` por su cuenta, y tanto la API como nginx y OSRM lo respetan.

### 3.5 Secrets para desplegar

Copia de cada servicio el valor de *Settings → Deploy Hook* y regístralo en GitHub:

| Nombre | Tipo | Valor |
|---|---|---|
| `RENDER_DEPLOY_HOOK_BACKEND` | Secret | Deploy hook de `distrirapido-api` |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Secret | Deploy hook de `distrirapido` |
| `RENDER_DEPLOY_HOOK_OSRM` | Secret | Deploy hook de `distrirapido-osrm` |
| `PRODUCTION_URL` | **Variable** (pestaña *Variables*, no *Secrets*) | URL pública de `distrirapido` |

Después ejecuta el workflow a mano: *Actions → DistriRapido deploy → Run workflow* sobre `main`. Debe terminar en verde, con la tabla de verificación en el resumen.

### 3.6 Cuenta de Administrador

Se crea una sola vez desde tu equipo, en PowerShell y en la carpeta `src/backend`. Las variables solo viven en esa sesión de la terminal; no las guardes en archivos.

```powershell
$env:DATABASE_URL = Read-Host 'External Database URL'
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host 'Correo del administrador'
$env:BOOTSTRAP_ADMIN_PASSWORD = Read-Host 'Contraseña (12 a 128 caracteres)'
npx ts-node prisma/bootstrap.ts
Remove-Item Env:DATABASE_URL, Env:BOOTSTRAP_ADMIN_EMAIL, Env:BOOTSTRAP_ADMIN_PASSWORD
```

La base de producción empieza vacía. Antes de la demostración hay que registrar desde la aplicación los conductores, los vehículos y los pedidos que se vayan a mostrar.

## 4. Operación

- **Arranque en frío:** en el plan Free, cada servicio se duerme tras 15 minutos sin tráfico y tarda cerca de un minuto en despertar. Antes de una demostración, abre `/login` y `/api/health`, y planifica una ruta de prueba para despertar OSRM.
- **Actualizar el grafo vial:** cambia `PBF_DATE` y `PBF_SHA256` en `infra/osrm/Dockerfile`. Luego actualiza `OSRM_DATA_REVISION` en Render con el valor que muestre el resumen.
- **Reconstruir OSRM sin cambiar nada:** *Run workflow* con la opción «Reconstruir el grafo OSRM».
- **`TRUST_PROXY`:** sin esta variable, la API ve a todos los usuarios con la IP del proxy, y el límite de 10 peticiones por minuto y por ruta (`ThrottlerGuard`) se reparte entre todos. El número de saltos correcto se mide después del primer despliegue y se registra aquí. No se usa `true`, porque así cualquiera podría falsear su IP con `X-Forwarded-For`.

## 5. Deuda técnica

- Usar una cobertura con licencia que permita redistribuirla (límites de OSM) o aclarar el permiso del INEI.
- El plan Free no ofrece red privada entrante: la API y OSRM quedan expuestos con URL pública.
- La base Free vence a los 30 días. Para un uso real, se necesita un plan de pago o exportar los datos con `pg_dump`.

[← Volver al README principal](../../../README.md)
