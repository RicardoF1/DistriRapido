# Aprovisionamiento local de OSRM y validación de US-013 V_1_2_0

Fecha: 2026-11-06, America/Lima. Estado: procedimiento **ejecutado y validado funcionalmente** en el entorno local de desarrollo, sobre `main` en el commit `600564f6c309e36b38904830652c5add1f70a799`. La versión anterior de este documento (V_1_1_0, 2026-10-29) describía el procedimiento preparado sin ejecutar; los apartados marcados como **estado anterior** conservan ese registro histórico y no describen el estado actual.

Todos los comandos se ejecutan desde la raíz del repositorio. Los datos se guardan en `.local/osrm-data`, carpeta ignorada por Git (`.gitignore`: `.local/`). No se publican el PBF, el recorte, los archivos `huancayo.osrm.*`, la configuración efectiva de Compose ni secretos.

## 1. Recursos y origen verificable

El motor utiliza una red vial OpenStreetMap, independiente de los límites administrativos INEI. La cobertura INEI v1.0.0 permanece privada y la valida el backend; no se copió al servicio OSRM ni se publica en imágenes.

| Elemento | Valor |
|---|---|
| Proveedor del extracto | Geofabrik GmbH, [Perú](https://download.geofabrik.de/south-america/peru.html) |
| Fuente de datos y licencia | OpenStreetMap, [ODbL 1.0](https://www.openstreetmap.org/copyright), © OpenStreetMap contributors |
| URL descargada | `https://download.geofabrik.de/south-america/peru-261105.osm.pbf` |
| Fecha de los datos OSM | 2026-11-05T21:23:02Z |
| PBF original | `peru-261105.osm.pbf`, 257 311 800 bytes |
| MD5 oficial y calculado | `0000a5e658777d61fdc853fa0751588c` (coinciden) |
| SHA-256 del PBF original | `4f10e3216fdc5a83caa0333b5d300504f10038ec964313f94182c96cf33fa32e` |
| Recorte | `huancayo.osm.pbf`, 2 180 983 bytes |
| Bounding box solicitado | `-75.40,-12.25,-74.80,-11.75` (oeste, sur, este, norte) |
| Estrategia de recorte | `complete_ways` |
| SHA-256 del recorte | `70cce1d0a42c52de0a5aa1b18a72fb3c184143b50ef1cf83cf426113c1beedb1` |
| Contenido del recorte | 292 701 nodos, 25 113 vías, 306 relaciones |
| Imagen OSRM | `ghcr.io/project-osrm/osrm-backend:v26.10.0-debian@sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f` |
| Versión de OSRM | v26.10.0 (`osrm-extract`, `osrm-partition`, `osrm-customize`, `osrm-routed`) |
| Perfil | `/opt/car.lua`, consultado como `driving` |
| Algoritmo | MLD |

El bounding box contiene la cobertura privada v1.0.0 con un margen aproximado de 13 a 16 km por cada lado, de modo que las conexiones y desvíos cercanos quedan dentro del grafo. Con `complete_ways` las vías que cruzan el borde se conservan completas, por lo que la extensión real de los datos del recorte (`-76.4820,-12.4384,-74.6465,-11.5559`) es mayor que la solicitada. No se preparó el grafo de todo Perú.

Las condiciones de OSM no autorizan redistribuir derivados del INEI. El PBF y sus derivados se usan solo localmente y no se redistribuyen desde este repositorio.

Recursos medidos durante la preparación: memoria máxima informada por OSRM de 237 887 488 bytes en extract, 47 071 232 bytes en partition y 44 331 008 bytes en customize. Los límites de 2 CPU y 2 GB del overlay siguen siendo un punto de partida configurable, no un dimensionamiento de producción.

## 2. Configuración Windows sin reemplazar .env

Ejemplo de variables públicas: `infra/osrm/.env.example`. No copiarlo sobre el `.env` existente ni introducir claves o contraseñas en esos archivos públicos. Las variables del overlay se definieron solo en la sesión.

| Variable | Uso |
|---|---|
| OSRM_IMAGE | Imagen oficial con versión/digest comprobado; obligatoria para el overlay. No hay latest implícito. |
| OSRM_DATA_DIR | Ruta absoluta de carpeta privada con el grafo MLD ya preparado. |
| OSRM_GRAPH_BASE | Base del grafo, por defecto huancayo. |
| OSRM_BASE_URL | URL privada del motor; vacía deshabilita cálculos, no login/pedidos. |
| OSRM_ALLOWED_ORIGIN | Origen HTTP/HTTPS exacto expresamente autorizado. Debe coincidir con la URL base. |
| OSRM_PROFILE | driving por defecto; debe corresponder al perfil del grafo preparado. |
| OSRM_DATA_REVISION | Huella/identificador del release PBF + perfil + imagen. No inventar una versión. |
| OSRM_TIMEOUT_MS | 10000 ms por consulta por defecto; máximo 30000 y nunca mayor al presupuesto total. |
| OSRM_TOTAL_TIMEOUT_MS | 20000 ms por ejecución por defecto; incluye lecturas, transacciones y proveedor. |
| OSRM_MAX_SNAP_M | 100 m por defecto; entre 1 y 500, cambio explícito y registrado en procedencia. |

Valores utilizados en la validación:

```powershell
$env:OSRM_IMAGE = 'ghcr.io/project-osrm/osrm-backend:v26.10.0-debian@sha256:55dbfd47d984c2cacd64e32901b4321c86b5ec761438e69aa053dc78698a786f'
$env:OSRM_DATA_DIR = (Resolve-Path '.local/osrm-data').Path
$env:OSRM_GRAPH_BASE = 'huancayo'
$env:OSRM_DATA_REVISION = 'geofabrik-peru-261105-sha256:70cce1d0a42c-car-mld-osrm-v26.10.0'
```

`OSRM_DATA_REVISION` no contiene espacios e identifica el extracto fechado (`geofabrik-peru-261105`), los 12 primeros caracteres del SHA-256 del recorte, el perfil `car`, el algoritmo `mld` y la versión `osrm-v26.10.0`. OSRM no devuelve un `data_version` para este grafo (`provenance.data_version` queda en `null`); la trazabilidad la da esta revisión.

Las URLs con credenciales, consultas o fragmentos se inhabilitan. El origen autorizado debe carecer de ruta y credenciales. HTTP se limita a hosts locales/contenedor o IPv4 privada; un proveedor remoto autorizado requiere HTTPS. Se rechazan los demos router.project-osrm.org y routing.openstreetmap.de. No se sigue ninguna redirección del proveedor.

No hay reintentos automáticos de OSRM en este incremento: cada ejecución tiene un único presupuesto total. Repetir la misma clave de idempotencia consulta la ejecución existente y no reinicia cálculo/plazo. Un nuevo intento expresamente solicitado usa otra clave y es otra ejecución, con presupuesto propio; no existe bucle automático ilimitado. El control de concurrencia inicial es mono-instancia, junto con el throttling vigente por IP. El cupo global multi-réplica/límite específico por usuario requiere trabajo adicional antes de escalar; no se promete aquí.

La actualización de estado FALLIDA tras un error es mantenimiento separado, acotado a 1000 ms de transacción/200 ms de espera, que no mantiene bloqueada la respuesta ni el cupo de cálculo. Si no puede completarse, la recuperación de leases vencidos marca la ejecución INTERRUMPIDA. No vuelve a consultar OSRM ni puede publicar rutas.

## 3. Preparación del grafo (ejecutada)

### 3.1 Descarga y verificación

La descarga se hizo con `Invoke-WebRequest` hacia un archivo temporal `.part`. Se exigieron el tamaño y el MD5 publicados por Geofabrik antes de renombrarlo, y después se calculó el SHA-256. `curl` en Windows falló con `CRYPT_E_NO_REVOCATION_CHECK`; no se desactivó la comprobación de revocación.

```powershell
New-Item -ItemType Directory -Force '.local/osrm-data/logs' | Out-Null
$pbf = '.local/osrm-data/peru-261105.osm.pbf'
Invoke-WebRequest 'https://download.geofabrik.de/south-america/peru-261105.osm.pbf' -OutFile "$pbf.part"
(Get-Item "$pbf.part").Length                          # exigido: 257311800
(Get-FileHash -Algorithm MD5 "$pbf.part").Hash         # exigido: 0000A5E658777D61FDC853FA0751588C
Rename-Item "$pbf.part" 'peru-261105.osm.pbf'
Get-FileHash -Algorithm SHA256 $pbf
```

Si el tamaño o el MD5 no coinciden, no se continúa y el archivo se conserva renombrado con sufijo `.invalid-<fecha>` para revisión.

### 3.2 Recorte con osmium

El recorte se ejecutó en un contenedor efímero `debian:trixie-slim@sha256:a72b4433de1cf7d6bae0c4cee74d0547f58601a643b3375f070c51600d63b6b2` con `osmium-tool 1.18.0-1` de los repositorios oficiales de Debian (osmium 1.18.0, libosmium 2.22.0). Antes de instalar se exige que `apt-cache policy osmium-tool` ofrezca exactamente `1.18.0-1`. El script se pasa como archivo porque PowerShell 5.1 parte los scripts multilínea enviados con `sh -c`.

```sh
apt-get update
apt-cache policy osmium-tool          # Candidate: 1.18.0-1
apt-get install -y --no-install-recommends osmium-tool=1.18.0-1
osmium extract -b -75.40,-12.25,-74.80,-11.75 --strategy complete_ways --no-progress \
  /data/peru-261105.osm.pbf -o /data/huancayo.tmp.osm.pbf
osmium fileinfo -e --no-progress /data/huancayo.tmp.osm.pbf
```

La salida temporal se renombra a `huancayo.osm.pbf` solo si `fileinfo` termina con código 0 e informa nodos, vías y relaciones mayores que cero. Nunca se sobrescribe un `huancayo.osm.pbf` existente.

### 3.3 Extract, partition y customize

```powershell
docker pull $env:OSRM_IMAGE
docker image inspect --format '{{json .RepoDigests}}' $env:OSRM_IMAGE   # debe contener sha256:55dbfd47...
docker run --rm --entrypoint sh $env:OSRM_IMAGE -c 'ls -l /opt/car.lua'

docker run --rm --mount "type=bind,source=$env:OSRM_DATA_DIR,target=/data" $env:OSRM_IMAGE osrm-extract -p /opt/car.lua /data/huancayo.osm.pbf
if ($LASTEXITCODE -ne 0) { throw 'Falló extract; no continuar' }
docker run --rm --mount "type=bind,source=$env:OSRM_DATA_DIR,target=/data" $env:OSRM_IMAGE osrm-partition /data/huancayo
if ($LASTEXITCODE -ne 0) { throw 'Falló partition; no continuar' }
docker run --rm --mount "type=bind,source=$env:OSRM_DATA_DIR,target=/data" $env:OSRM_IMAGE osrm-customize /data/huancayo
if ($LASTEXITCODE -ne 0) { throw 'Falló customize; no continuar' }
```

OSRM v26.10.0 **no genera un archivo único `huancayo.osrm`**: produce el conjunto `huancayo.osrm.*` y el propio `osrm-extract` recomienda continuar con la base `/data/huancayo`. Por eso partition y customize se ejecutaron con `/data/huancayo`. La forma `/data/huancayo.osrm` no se probó en partition ni en customize.

| Etapa | Duración | Código de salida | Memoria máxima informada por OSRM | Archivos tras la etapa |
|---|---:|:---:|---:|---:|
| extract | 6 s | 0 | 237 887 488 bytes | 21 |
| partition | 2 s | 0 | 47 071 232 bytes | 23 |
| customize | 2 s | 0 | 44 331 008 bytes | 26 |

Artefactos MLD generados por esta versión: `huancayo.osrm.partition` y `huancayo.osrm.cells` (partition), `huancayo.osrm.cell_metrics`, `huancayo.osrm.mldgr` y `huancayo.osrm.datasource_names` (customize). Resultado final: **26 archivos `huancayo.osrm.*`, 36 253 316 bytes**, todos con tamaño mayor que cero.

### 3.4 Trazabilidad privada

En `.local/osrm-data`, fuera de Git:

- `provenance.txt`: URL, fechas, tamaños, MD5 y SHA-256 del PBF y del recorte, bounding box, estrategia, imagen de osmium, imagen OSRM con digest, perfil, algoritmo, base del grafo, fechas, duraciones, códigos de salida y memoria de cada etapa.
- `huancayo-osrm-sha256.txt`: manifiesto con una línea `<SHA-256>  <archivo>` por cada `huancayo.osrm.*`, ordenado por nombre. SHA-256 del manifiesto: `f5f2e73d94051181fce2e8ddb0ff204e06e1d2909721e2c64d1c11a0143369ce`.
- `logs/`: registros de descarga, recorte, inspección de imagen, extract, partition, customize y validaciones.

## 4. Servicio y validación

### 4.1 Validación directa del grafo

Con contenedores temporales publicados solo en `127.0.0.1:5000` y montaje de solo lectura, `osrm-routed --algorithm mld` funcionó tanto con `/data/huancayo` como con `/data/huancayo.osrm`, la ruta que usa el overlay. Ambas respondieron rutas reales sin errores de dataset.

| Consulta de prueba | HTTP | Distancia | Duración | Tramos | Waypoints |
|---|---|---:|---:|---:|---:|
| 2 puntos | 200, `code=Ok` | 1.62 km | 4.2 min | 1 | 2 |
| 3 puntos | 200, `code=Ok` | 4.62 km | 9.9 min | 2 | 3 |

### 4.2 Overlay de Compose

El servicio se levanta con `docker-compose.yml` más `docker-compose.osrm.yml`. El overlay no se modificó:

```powershell
docker compose -f docker-compose.yml -f docker-compose.osrm.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.osrm.yml up -d --no-deps osrm
```

Configuración comprobada: imagen fijada por digest; comando `osrm-routed --algorithm mld /data/huancayo.osrm --max-viaroute-size 32`; `OSRM_DATA_DIR` montado en `/data` en solo lectura y sin crear la ruta del host; puerto `127.0.0.1:5000:5000`; raíz del contenedor de solo lectura, `tmpfs` en `/tmp`, `cap_drop: ALL`, `no-new-privileges`, 2 CPU, 2 GB y `restart: "no"`. El backend recibe `OSRM_BASE_URL` y `OSRM_ALLOWED_ORIGIN` iguales a `http://osrm:5000`. Los puertos de PostgreSQL, backend y frontend no cambian, y el único volumen sigue siendo el de PostgreSQL. La configuración efectiva interpola valores del `.env` y no debe publicarse.

`config --quiet` por sí solo no acredita que la imagen exista o que el grafo sea válido; por eso se exige además una consulta real. El servicio usa la condición `started`; una inicialización fallida o lenta debe devolver error de proveedor, sin afirmar que está listo.

### 4.3 Reconstrucción de la aplicación desde HEAD

Antes de la validación funcional, backend y frontend se reconstruyeron desde `600564f` y se recrearon sin tocar OSRM ni PostgreSQL:

```powershell
docker compose -f docker-compose.yml -f docker-compose.osrm.yml build backend frontend
docker compose -f docker-compose.yml -f docker-compose.osrm.yml up -d --no-deps --force-recreate backend frontend
```

Imágenes resultantes: backend `sha256:62201174aae41d4b107aa9aac1aca68e66e83d3ecb208bab8b1ad07937aefd41` (2026-11-07T02:26:47Z) y frontend `sha256:93f87b9a1f1a752b0c0a78901546a993216675d5883e5f7f2d85e8eabfeaf62f` (2026-11-07T02:26:28Z).

Observación del build: npm advirtió que no ejecutó los scripts de instalación de siete paquetes no incluidos en `allowScripts`, entre ellos `argon2`, `@prisma/client`, `@prisma/engines` y `prisma`. En un contenedor desechable y sin red se comprobó que `argon2` genera y verifica un hash, que `PrismaClient` carga su motor de consultas y que `dist` contiene el código de HEAD. El aviso no impidió el funcionamiento, pero conviene revisarlo en la configuración de npm.

### 4.4 Comunicación del backend con OSRM

Dentro del contenedor backend: `OSRM_BASE_URL=http://osrm:5000`, `OSRM_ALLOWED_ORIGIN=http://osrm:5000`, `OSRM_PROFILE=driving`, `OSRM_DATA_REVISION=geofabrik-peru-261105-sha256:70cce1d0a42c-car-mld-osrm-v26.10.0`, `OSRM_MAX_SNAP_M=100`, `OSRM_TIMEOUT_MS=10000` y `OSRM_TOTAL_TIMEOUT_MS=20000`. Una consulta con Node `fetch` a `http://osrm:5000` desde el backend devolvió HTTP 200, `code=Ok`, una ruta de 1 618.1 m y 253.2 s.

PostgreSQL se arrancó sin recrearlo y conserva el volumen `distrirapido_analisis_postgres-data`. `prisma migrate status` reconoce las 9 migraciones y responde "Database schema is up to date!". No se ejecutaron seeds ni bootstrap.

### 4.5 Validación funcional desde la interfaz

Un planificador preparó la jornada en la interfaz y solicitó el cálculo. La ruta de referencia es la versión `d9ebaee0-85df-4504-99d6-764839838c6a`:

| Criterio | Resultado |
|---|---|
| Procedencia | `provider=OSRM`, `profile=driving`, revisión `geofabrik-peru-261105-sha256:70cce1d0a42c-car-mld-osrm-v26.10.0` |
| Método | `SECUENCIAL_OSRM`, `optimized=false` |
| Distancia | 3 888.7 m, mostrada como 3.89 km |
| Viaje estimado | 356.2 s, mostrado como 5.9 min |
| Duración con atención y esperas | 7 800 s, mostrada como 130 min |
| Geometría | `LineString` con 86 coordenadas, visible en el mapa |
| Paradas | 2, en el orden confirmado; finalización en el último pedido |
| Ajuste de puntos | origen 0.1 m, pedido `390deb77` 49.9 m, pedido `ed2a4fb3` 23.1 m; límite 100 m (`radiuses=100` en la consulta a OSRM) |
| Avisos | `warnings=[]`, `confirmable=true` |
| Ejecución | COMPLETADA, sin código de error |
| Estado | ruta GENERADA; paradas y pedidos en PENDIENTE |

La distancia de ajuste se calculó comparando cada punto solicitado con el punto ajustado que se guarda en `resultado.snapped`; el resultado no persiste esa distancia.

En la base existen tres rutas porque se hicieron **tres ejecuciones manuales** en la interfaz. Las otras dos (versiones `c89138c6` y `b04c7f85`) corresponden a la opción de generar alternativas con la estrategia de orden confirmado y un origen distinto (Av. Leandra Torres): 4.30 km y 6.5 min cada una, con la misma procedencia y revisión. Son cálculos reales de OSRM, no resultados sintéticos. OSRM registró exactamente tres consultas del agente `DistriRapido-Routing/1.0`, todas con HTTP 200.

Ninguna de las tres rutas tiene conductor asignado. La interfaz indica: "La asignación no está habilitada en este incremento." El backend dispone del endpoint `PATCH /routes/:id/assignment` con control de versión, pero la interfaz web no ofrece todavía la acción de asignar. La ausencia de asignación corresponde al alcance del incremento y no es un fallo de OSRM.

## 5. Migración de rutas (estado anterior, 2026-10-29)

Estado actual: `202610290001_planificacion_rutas` está aplicada junto con las demás migraciones (9 en total) y `prisma migrate status` indica que el esquema está actualizado. El texto siguiente se conserva como registro de la revisión previa a su aplicación.

Migración: `202610290001_planificacion_rutas`. SHA-256 revisado: `0e58dd51d0217d1074ca75743a6cb57ad233fafef2ec5632d3dbd92dac8f722e`.

Contiene siete CREATE TABLE, índices/UNIQUE y FK RESTRICT; no elimina tablas ni modifica registros de usuarios, pedidos, conductores o disponibilidades. La compatibilidad se probó en PostgreSQL aislado. En aquel momento schema public conservaba seis migraciones y no tenía tabla rutas.

Respaldo previo disponible: `.local/routing-increment-20261029-175242/before-routing.dump`. Su listado y decodificación con pg_restore se verifican sin restaurar sobre desarrollo. Antes de una nueva migración, crear un respaldo del estado de ese momento con `pg_dump -Fc`, verificar listado/decodificación y conservar también un snapshot de conteos/hash y credenciales cifradas protegidas. No introducir contraseñas en la línea de comandos ni imprimir DATABASE_URL.

Plan de aplicación que se definió, solo tras autorización específica:

1. Pausar nuevas escrituras de la aplicación durante la ventana acordada, sin eliminar PostgreSQL ni volúmenes.
2. Verificar rama/SQL/hash, respaldo actualizado y `prisma migrate status`. Debe haber únicamente la migración de rutas pendiente; si hay otras, detenerse y revisarlas.
3. Preparar imágenes de aplicación locales y etiquetar antes sus imágenes anteriores por ID para rollback. No publicar imágenes con geodata privada.
4. Usar el servicio migrate opt-in ya existente, no el inicio ordinario del backend. El comando siguiente ejecutaría todas las pendientes, por eso el control anterior es obligatorio:

```powershell
# SOLO DESPUÉS DE AUTORIZACIÓN.
docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance build migrate
docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance run --rm --no-deps migrate
```

5. Comprobar siete nuevas tablas/FK, conteos/hash de tablas existentes y estado de migración. No ejecutar bootstrap/seeds ni crear recursos automáticamente.
6. Activar únicamente OSRM/backend/frontend según la configuración autorizada. Nunca ejecutar down -v ni migrate reset.

## 6. Actualización y reversión no destructiva

Secuencia validada el 2026-11-06, con las variables de la sección 2 definidas en la sesión:

1. Levantar OSRM con el overlay, según la sección 4.2.
2. Arrancar PostgreSQL solo si está detenido, sin recrearlo: `docker compose -f docker-compose.yml -f docker-compose.osrm.yml up -d postgres`.
3. Reconstruir backend y frontend desde el commit que se valida y recrearlos sin dependencias, según la sección 4.3.

PostgreSQL no se incluye entre servicios a recrear. La aplicación arranca mediante node dist/main.js, no ejecuta migrate deploy en cada inicio. Si se usa un OSRM privado ya existente, puede omitirse el overlay y configurarse BASE_URL/ALLOWED_ORIGIN en el Compose base.

Antes de reconstruir, guardar los IDs y etiquetar las imágenes anteriores. Para rollback, un override privado selecciona esas imágenes y se recrean **solo** backend/frontend con --no-deps --no-build. Mantener las tablas aditivas y los datos de rutas; el código previo no las utiliza. No borrar tablas ni alterar _prisma_migrations para simular una reversión. No ejecutar migrate resolve --rolled-back sobre una migración aplicada correctamente.

Si fuera necesaria recuperación de datos, restaurar primero el dump a un destino nuevo aislado, comprobarlo y solicitar autorización separada antes de reemplazar/restaurar desarrollo. La reversión ordinaria propuesta es de aplicación, no de datos. Ante una migración fallida, detenerse, guardar diagnóstico/estado y revisar SQL; no encadenar operaciones de reparación destructiva.

## 7. Datos mínimos y prueba manual US-013

Estado anterior (2026-10-29): se leyeron cuatro usuarios, dos conductores, dos pedidos, cero vehículos y cero disponibilidades. Para la validación del 2026-11-06 existían un vehículo DISPONIBLE (W6A-123), un conductor ACTIVO con disponibilidad que cubre la jornada y dos pedidos PENDIENTE dentro de cobertura.

Hacen falta un vehículo real DISPONIBLE con capacidad válida, al menos un conductor ACTIVO con intervalo DISPONIBLE que cubra toda la jornada y uno o más pedidos PENDIENTE con clientes habilitados, puntos dentro de cobertura y ventanas compatibles. Un conductor ACTIVO no implica disponibilidad. Cualquier alta o actualización de estos recursos en desarrollo requiere autorización.

Para evaluar capacidad volumétrica deben conocerse capacidad y volúmenes positivos de todos los pedidos. NULL sigue siendo desconocido, no cero. Un recorrido puede calcularse y consultarse con advertencias sin considerarse confirmable. No alterar pedidos antiguos solo para satisfacer la demostración.

Prueba manual:

1. Abrir http://localhost:5173 en perfil Administrador u Operador; ir a Preparar recorrido.
2. Indicar jornada America/Lima; consultar pedidos/recursos y seleccionar datos reales válidos.
3. Seleccionar explícitamente origen por sugerencia o mapa. Introducir atención por pedido y ordenar todas las paradas.
4. Elegir terminar en último pedido o regresar al origen. Marcar las tres confirmaciones; cambiar datos las invalida.
5. Preparar y después solicitar cálculo OSRM. La interfaz no ofrece la acción de asignar y no hay optimización genética.
6. Abrir Consultar recorrido registrado; revisar geometría vial, marcadores numerados, pedidos, metros/segundos convertidos para visualización, atención/esperas, método y procedencia.
7. Recargar/consultar historial y lista: no debe generarse otra ruta ni volver a llamar a OSRM. Versión 0 debe devolver 400.
8. Probar proveedor caído en entorno de pruebas: error explícito, sin línea recta, tiempos cero de relleno ni rutas parciales. Repetir misma solicitud conserva idempotencia; un nuevo intento requiere acción expresa.
9. Para el conductor, usar un perfil de navegador separado. El mismo perfil comparte cookies entre pestañas; no son sesiones independientes. Su panel sigue sin rutas asignadas porque la asignación no está habilitada en este incremento.

Los pasos 1 a 6 se completaron el 2026-11-06 con el resultado de la sección 4.5.

## 8. Limitaciones vigentes

- El cálculo es secuencial sobre el orden confirmado (`optimized=false`); no es una ruta óptima global ni usa optimización genética.
- OSRM no considera tráfico en tiempo real.
- OSRM no devuelve `data_version`; la trazabilidad se apoya en `OSRM_DATA_REVISION`.
- La distancia de ajuste de cada punto no se persiste en el resultado.
- La asignación de rutas a conductores existe como endpoint backend con control de versión y pruebas automatizadas, pero no está habilitada en la interfaz de este incremento.
- El control de concurrencia es mono-instancia.

## Siguiente documento / Siguiente trabajo recomendado

Registrar esta validación en la evidencia de cierre del Sprint 3, revisar el aviso `allowScripts` de npm y integrar en la interfaz la asignación de rutas a conductores, ya disponible en el backend, en el siguiente incremento. Conservar servicios, datos y la carpeta privada `.local/osrm-data`.

[← Volver al README principal](../../README.md)
