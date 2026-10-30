# Preparación privada de OSRM y habilitación de US-013 V_1_1_0

Fecha: 2026-10-29. Estado: procedimiento preparado, **no ejecutado contra desarrollo**. No se descargaron imágenes/grafos, aplicaron migraciones ni crearon recursos públicos. No ejecutar las secciones de habilitación hasta revisar resultados y recibir las autorizaciones correspondientes.

## 1. Recursos y origen verificable

El motor utiliza una red vial OpenStreetMap, independiente de los límites administrativos INEI. La cobertura INEI v1.0.0 permanece privada y la valida el backend; no debe copiarse al servicio OSRM ni publicarse en imágenes.

Obtener un extracto OSM/PBF autorizado que incluya Huancayo y suficiente red vial alrededor para conexiones y desvíos. No cortar el grafo siguiendo exactamente los cinco polígonos, pues una carretera puede salir de ellos. Fuente institucional del ecosistema OSM: [Geofabrik Perú](https://download.geofabrik.de/south-america/peru.html). Se verificó su disponibilidad documental, no se descargó el archivo. Las condiciones de uso de OSM requieren revisar la [licencia y atribución ODbL](https://www.openstreetmap.org/copyright); no autorizan redistribuir derivados del INEI.

Seguir el procedimiento oficial MLD de [OSRM](https://github.com/Project-OSRM/osrm-backend/blob/master/README.md): extract con perfil car, partition y customize; usar la misma imagen verificada en preparación y ejecución. Registrar URL/fecha y SHA-256 del PBF, imagen con digest, perfil y revisión. El nombre base `.osrm` identifica un conjunto de archivos; no esperar un único archivo `.osrm`.

Requisitos que aún deben comprobarse: Docker Desktop operativo, imagen oficial fijada por digest/versión aprobada, carpeta de datos con permisos, espacio para PBF + imagen + grafo + temporales y memoria de preparación. No se ha medido el costo del extracto regional. La máquina tenía aproximadamente 3.18 GB libres en C: al revisar; no se asume suficiente espacio para preparar Perú completo. No borrar archivos ni volúmenes para liberar espacio automáticamente.

Los límites de prueba 2 CPU/2 GB del Compose son un punto de partida configurable, no un dimensionamiento medido ni una garantía de capacidad. La preparación puede requerir más memoria que el servicio de consulta. No iniciar un trabajo grande sin revisar capacidad.

## 2. Configuración Windows sin reemplazar .env

Ejemplo de variables públicas: `infra/osrm/.env.example`. No copiarlo sobre el `.env` existente ni introducir claves/contraseñas en esos archivos públicos. Usar variables de la sesión PowerShell o un archivo privado aprobado.

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

Las URLs con credenciales, consultas o fragmentos se inhabilitan. El origen autorizado debe carecer de ruta y credenciales. HTTP se limita a hosts locales/contenedor o IPv4 privada; un proveedor remoto autorizado requiere HTTPS. Se rechazan los demos router.project-osrm.org y routing.openstreetmap.de. No se sigue ninguna redirección del proveedor.

No hay reintentos automáticos de OSRM en este incremento: cada ejecución tiene un único presupuesto total. Repetir la misma clave de idempotencia consulta la ejecución existente y no reinicia cálculo/plazo. Un nuevo intento expresamente solicitado usa otra clave y es otra ejecución, con presupuesto propio; no existe bucle automático ilimitado. El control de concurrencia inicial es mono-instancia, junto con el throttling vigente por IP. El cupo global multi-réplica/límite específico por usuario requiere trabajo adicional antes de escalar; no se promete aquí.

La actualización de estado FALLIDA tras un error es mantenimiento separado, acotado a 1000 ms de transacción/200 ms de espera, que no mantiene bloqueada la respuesta ni el cupo de cálculo. Si no puede completarse, la recuperación de leases vencidos marca la ejecución INTERRUMPIDA. No vuelve a consultar OSRM ni puede publicar rutas.

## 3. Preparación futura del grafo

**No ejecutado.** Primero aprobar recursos/imagen y obtener PBF real autorizado, renombrado a `huancayo.osm.pbf`. La carpeta sugerida es `.local/osrm-data`, ignorada por Git. Los nombres de ejemplo no representan datos ya disponibles.

```powershell
Set-Location 'C:\Users\HP\Desktop\DistriRapido'
# Completar con un digest real verificado; no ejecutar con un marcador de ejemplo.
$env:OSRM_IMAGE = 'ghcr.io/project-osrm/osrm-backend@sha256:DIGEST_VERIFICADO'
$env:OSRM_DATA_DIR = (Resolve-Path '.local/osrm-data').Path
$env:OSRM_GRAPH_BASE = 'huancayo'
Get-FileHash -Algorithm SHA256 (Join-Path $env:OSRM_DATA_DIR 'huancayo.osm.pbf')

docker run --rm --mount "type=bind,source=$env:OSRM_DATA_DIR,target=/data" $env:OSRM_IMAGE osrm-extract -p /opt/car.lua /data/huancayo.osm.pbf
if ($LASTEXITCODE -ne 0) { throw 'Falló extract; no continuar' }
docker run --rm --mount "type=bind,source=$env:OSRM_DATA_DIR,target=/data" $env:OSRM_IMAGE osrm-partition /data/huancayo.osrm
if ($LASTEXITCODE -ne 0) { throw 'Falló partition; no continuar' }
docker run --rm --mount "type=bind,source=$env:OSRM_DATA_DIR,target=/data" $env:OSRM_IMAGE osrm-customize /data/huancayo.osrm
if ($LASTEXITCODE -ne 0) { throw 'Falló customize; no continuar' }
```

Registrar los hashes de los archivos generados y los metadatos del release en la carpeta privada; utilizar su revisión en OSRM_DATA_REVISION. No adjuntar PBF, grafo, recursos INEI, secretos ni consultas de clientes a GitHub.

El overlay `docker-compose.osrm.yml` solo sirve un grafo existente con montaje read-only y puerto 5000 ligado a 127.0.0.1; el backend lo consulta por la red interna `http://osrm:5000`. No descarga datos ni migra PostgreSQL. Su validación `docker compose ... config --quiet` no acredita que la imagen exista o el grafo sea válido. El servicio usa condición started; una inicialización fallida/lenta debe devolver error de proveedor, sin afirmar que está listo.

## 4. Migración pendiente: revisión y respaldo

Migración: `202610290001_planificacion_rutas`. SHA-256 revisado: `0e58dd51d0217d1074ca75743a6cb57ad233fafef2ec5632d3dbd92dac8f722e`.

Contiene siete CREATE TABLE, índices/UNIQUE y FK RESTRICT; no elimina tablas ni modifica registros de usuarios, pedidos, conductores o disponibilidades. La compatibilidad se probó en PostgreSQL aislado. Esto no es autorización para ejecutarla sobre public. Schema public conserva seis migraciones y no tiene tabla rutas.

Respaldo previo disponible: `.local/routing-increment-20261029-175242/before-routing.dump`. Su listado y decodificación con pg_restore se verifican sin restaurar sobre desarrollo. Antes de habilitar, crear un respaldo nuevo del estado de ese momento con `pg_dump -Fc`, verificar listado/decodificación y conservar también un snapshot de conteos/hash y credenciales cifradas protegidas. No introducir contraseñas en la línea de comandos ni imprimir DATABASE_URL.

Plan de aplicación futuro, solo tras autorización específica:

1. Pausar nuevas escrituras de la aplicación durante la ventana acordada, sin eliminar PostgreSQL ni volúmenes.
2. Verificar rama/SQL/hash, respaldo actualizado y `prisma migrate status`. Debe haber únicamente la migración de rutas pendiente; si hay otras, detenerse y revisarlas.
3. Preparar imágenes de aplicación locales y etiquetar antes sus imágenes anteriores por ID para rollback. No publicar imágenes con geodata privada.
4. Usar el servicio migrate opt-in ya existente, no el inicio ordinario del backend. El comando siguiente ejecutaría todas las pendientes, por eso el control anterior es obligatorio:

```powershell
# SOLO DESPUÉS DE AUTORIZACIÓN: no ejecutado durante esta fase.
docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance build migrate
docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance run --rm --no-deps migrate
```

5. Comprobar siete nuevas tablas/FK, conteos/hash de tablas existentes y estado de migración. No ejecutar bootstrap/seeds ni crear recursos automáticamente.
6. Activar únicamente OSRM/backend/frontend según la configuración autorizada. Nunca ejecutar down -v ni migrate reset.

## 5. Actualización y reversión no destructiva

Después de preparar grafo, revisar imagen/recursos, autorizar migración y recursos operativos:

```powershell
# Estos comandos no se ejecutaron en esta fase de preparación.
docker compose build backend frontend
docker compose -f docker-compose.yml -f docker-compose.osrm.yml up -d --no-deps osrm
docker compose -f docker-compose.yml -f docker-compose.osrm.yml up -d --no-deps --no-build backend frontend
```

PostgreSQL no se incluye entre servicios a recrear. La aplicación arranca mediante node dist/main.js, no ejecuta migrate deploy en cada inicio. Si se usa un OSRM privado ya existente, puede omitirse el overlay y configurarse BASE_URL/ALLOWED_ORIGIN en el Compose base.

Antes de reconstruir, guardar los IDs y etiquetar las imágenes anteriores. Para rollback, un override privado selecciona esas imágenes y se recrean **solo** backend/frontend con --no-deps --no-build. Mantener las tablas aditivas y los datos de rutas; el código previo no las utiliza. No borrar tablas ni alterar _prisma_migrations para simular una reversión. No ejecutar migrate resolve --rolled-back sobre una migración aplicada correctamente.

Si fuera necesaria recuperación de datos, restaurar primero el dump a un destino nuevo aislado, comprobarlo y solicitar autorización separada antes de reemplazar/restaurar desarrollo. La reversión ordinaria propuesta es de aplicación, no de datos. Ante una migración fallida, detenerse, guardar diagnóstico/estado y revisar SQL; no encadenar operaciones de reparación destructiva.

## 6. Datos mínimos y prueba manual US-013

Estado real leído: cuatro usuarios, dos conductores, dos pedidos, cero vehículos y cero disponibilidades. No se modificó. Hacen falta un vehículo real DISPONIBLE con capacidad válida, al menos un conductor ACTIVO con intervalo DISPONIBLE que cubra toda la jornada y uno o más pedidos PENDIENTE con clientes habilitados, puntos dentro de cobertura y ventanas compatibles. Juan ACTIVO no implica disponibilidad; mantener su cuenta/vínculo/contraseña. Cualquier alta o actualización de estos recursos en desarrollo requiere autorización.

Para evaluar capacidad volumétrica deben conocerse capacidad y volúmenes positivos de todos los pedidos. NULL sigue siendo desconocido, no cero. Un recorrido puede calcularse y consultarse con advertencias sin considerarse confirmable. No alterar pedidos antiguos solo para satisfacer la demostración.

Tras habilitación autorizada:

1. Abrir http://localhost:5173 en perfil Administrador u Operador; ir a Preparar recorrido.
2. Indicar jornada America/Lima; consultar pedidos/recursos y seleccionar datos reales válidos.
3. Seleccionar explícitamente origen por sugerencia o mapa. Introducir atención por pedido y ordenar todas las paradas.
4. Elegir terminar en último pedido o regresar al origen. Marcar las tres confirmaciones; cambiar datos las invalida.
5. Preparar y después solicitar cálculo OSRM. No hay asignación ni optimización genética.
6. Abrir Consultar recorrido registrado; revisar geometría vial, marcadores numerados, pedidos, metros/segundos convertidos para visualización, atención/esperas, método y procedencia.
7. Recargar/consultar historial y lista: no debe generarse otra ruta ni volver a llamar a OSRM. Versión 0 debe devolver 400.
8. Probar proveedor caído en entorno de pruebas: error explícito, sin línea recta, tiempos cero de relleno ni rutas parciales. Repetir misma solicitud conserva idempotencia; un nuevo intento requiere acción expresa.
9. Para Juan, usar un perfil de navegador separado. El mismo perfil comparte cookies entre pestañas; no son sesiones independientes. Su panel sigue sin rutas asignadas porque US-015/016 no se implementan aquí.

## Siguiente documento / Siguiente trabajo recomendado

Revisar el informe de correcciones y autorizar separadamente la migración, el aprovisionamiento privado OSRM y los datos mínimos de la demostración. Hasta entonces conservar servicios y datos actuales.
