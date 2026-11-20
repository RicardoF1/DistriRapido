[← Volver al README principal](../../../README.md)

# Despliegue en producción (Render)

**Proyecto:** DistriRapido · EcoRuta Huancayo
**Workflow:** [`.github/workflows/deploy-production.yml`](../../../.github/workflows/deploy-production.yml)
**Fecha:** 2026-11-19
**URL de producción:** https://distrirapido.onrender.com

## 1. Arquitectura

| Servicio en Render | Origen | Función |
|---|---|---|
| `distrirapido` (Web Service, imagen) | `ghcr.io/ricardof1/distrirapido-frontend` | nginx con el build de producción de Vite. Reenvía `/api/*` al backend sin el prefijo. |
| `distrirapido-api` (Web Service, imagen) | `ghcr.io/ricardof1/distrirapido-backend` | API NestJS. Expone `GET /health` para el despliegue y el monitoreo. |
| `distrirapido-osrm` (Web Service, imagen) | `ghcr.io/ricardof1/distrirapido-osrm` | OSRM v26.10.0 con el grafo vial de Huancayo, preparado durante la construcción de la imagen. |
| `distrirapido-db` (PostgreSQL 16) | Render | Base de datos de producción. Vence el 2026-12-19 (plan Free). |

Los cuatro servicios están en la región Ohio (US East) y en el plan Free. URLs públicas: `https://distrirapido.onrender.com` (frontend), `https://distrirapido-api.onrender.com` (API) y `https://distrirapido-osrm.onrender.com` (OSRM).

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

La imagen de OSRM no lleva la cobertura INEI: solo contiene datos de OpenStreetMap (ODbL), así que es pública en GHCR y Render la descarga sin credencial.

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

Para crear `distrirapido-db` en Render: *New → Postgres*, PostgreSQL 16, plan Free, región Ohio (la misma de los demás servicios). La base gratuita vence a los 30 días.

### 3.2 Primera ejecución

Fusiona en `main`. El workflow publica las tres imágenes y aplica las migraciones; el paso de despliegue queda omitido.

Después revisa *github.com → tu perfil → Packages*:

- `distrirapido-backend` y `distrirapido-frontend` deben estar en **Private**. Como el repositorio es público, GHCR los crea públicos: hay que cambiarlos en *Package settings → Danger Zone → Change visibility*. `distrirapido-osrm` puede quedar público;
- anota el valor `OSRM_DATA_REVISION` que aparece en el resumen de la ejecución.

### 3.3 Credencial para que Render lea GHCR

1. En GitHub, ve a *Settings → Developer settings → Personal access tokens (classic)*.
2. Crea un token **classic** (empieza con `ghp_`) que solo tenga el permiso `read:packages`. Los tokens *fine-grained* no sirven para GHCR: Render responde «The provided image URL and registry credential are invalid».
3. En Render, ve a *Account Settings → Container Registry Credentials* y registra el usuario de GitHub con ese token.

### 3.4 Servicios web en Render

Los tres se crean desde *New → Web Service → Existing Image*, con plan Free y región Ohio. El backend y el frontend usan la credencial del paso anterior; OSRM, al ser pública, no la necesita.

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
- **Actualizar el grafo vial:** cambia `PBF_DATE` en `infra/osrm/Dockerfile`. Luego actualiza `OSRM_DATA_REVISION` en Render con el valor que muestre el resumen. Geofabrik sirve bytes distintos para el mismo extracto fechado y su `.md5` no coincide, así que la imagen no fija el hash del PBF: valida que osmium lo lea completo y registra los SHA-256 reales en `/data/PROVENANCE`. Con el extracto `261118`, dos descargas con hashes distintos dieron el mismo recorte de Huancayo (`a17b9ff8bd37…`).
- **Reconstruir OSRM sin cambiar nada:** *Run workflow* con la opción «Reconstruir el grafo OSRM».
- **`TRUST_PROXY`:** sin esta variable, la API ve a todos los usuarios con la IP del proxy, y el límite de 10 peticiones por minuto y por ruta (`ThrottlerGuard`) se reparte entre todos. El número de saltos correcto se mide después del primer despliegue y se registra aquí. No se usa `true`, porque así cualquiera podría falsear su IP con `X-Forwarded-For`.

## 5. Deuda técnica

- Usar una cobertura con licencia que permita redistribuirla (límites de OSM) o aclarar el permiso del INEI.
- El plan Free no ofrece red privada entrante: la API y OSRM quedan expuestos con URL pública.
- La base Free vence a los 30 días. Para un uso real, se necesita un plan de pago o exportar los datos con `pg_dump`.

## 6. Historial del primer despliegue (2026-11-19)

| Ejecución | Commit | Resultado | Causa y corrección |
|---|---|---|---|
| #1 | `9a3507a` | Falló en OSRM | El SHA-256 fijado del PBF no coincidía con lo servido por Geofabrik. Corregido en el [PR #33](https://github.com/RicardoF1/DistriRapido/pull/33) |
| #2 | `167d918` | Verde, sin despliegue | Imágenes publicadas y migraciones aplicadas; faltaba el *deploy hook* de OSRM, así que el despliegue se omitió como estaba previsto |
| #3 | `167d918` (manual) | Falló en la verificación | El despliegue fue correcto, pero `read` fallaba porque la salida de `curl` no terminaba en salto de línea. Corregido en la rama `fix/deploy-verificacion` |
| #4 | `073264b` | **Verde** | Construcción, migraciones, despliegue y verificación de la URL pública: `/`, `/login`, `/api/health` y la cobertura respondieron 200 con TTFB de 0,20 a 0,27 s |

---

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 2026-11-19 | Versión inicial de la guía. |
| V_1_0_0 (actualización) | 2026-11-19 | Se registran la URL y la región reales, la visibilidad de las imágenes, el tipo de token que acepta Render, el cambio en la verificación del PBF de OSRM y el historial del primer despliegue. |

[← Volver al README principal](../../../README.md)
