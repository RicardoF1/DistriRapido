# Instalación del mapa real para el equipo — Windows V_1_1_0

Fecha de revisión: 2026-10-09. Cobertura administrativa aprobada provisionalmente: 1.0.0. Código verificado en feature/post-sprint1-ui-geocoverage, commit 1c8d55835585b1950081b8b78233568e48c0a909. Cada integrante debe realizar el procedimiento en su propia computadora.

## Permisos: ruta de instalación actual

El [portal institucional INEI](https://ide.inei.gob.pe/) ofrece acceso gratuito y la descarga «Distrital (Actualizado al 2023)», en [Distrito.rar](https://ide.inei.gob.pe/files/Distrito.rar). Su página advierte posibles inconsistencias y recomienda consultar exactitud/vigencia. En la revisión del portal, documentación local y búsqueda de condiciones específicas no se encontró una licencia explícita vinculada a este archivo que acredite compartir derivados entre los cuatro integrantes. Esto no demuestra que esté prohibido; significa que no podemos afirmar que está autorizado.

No se preparó ZIP ni se subieron geometrías. Cada integrante debe descargar directamente desde INEI y generar localmente sus recursos, revisando las condiciones que muestre el proveedor al descargar. Si no se permite extracción/uso local, o se presentan condiciones nuevas incompatibles, detenerse y consultar a INEI. La alternativa de un paquete compartido privado requiere primero una autorización que cubra ese uso y sus derivados; conservar esa evidencia. El contacto institucional publicado es infoinei@inei.gob.pe; no se envió ninguna solicitud desde esta tarea.

La descarga gratuita no se equipara con permiso de redistribución. No subir recursos, fuentes RAR/GPKG o builds/imágenes que los contengan a GitHub, mensajería o almacenamiento compartido mientras no se acredite autorización. La misma restricción alcanza los JSON privados con puntos/validación. geodata/coverage-release.json es referencia técnica, no licencia.

## Archivos exactos

Dentro de la raíz de cada clon, crear exclusivamente el paquete privado en `geodata\coverage\v1\`:

| Archivo | Uso |
|---|---|
| 120101.geojson | Huancayo, provincia Huancayo, Junín |
| 120114.geojson | El Tambo, misma provincia/departamento |
| 120107.geojson | Chilca |
| 120125.geojson | Pilcomayo |
| 120119.geojson | Huancán |
| coverage.geojson | Cinco Features combinados, recurso servido al frontend |
| manifest.json | Versión, procedencia, EPSG:4326, UBIGEO y hashes |
| test-points.json | Nueve puntos geométricos de referencia, sin clientes |
| validation.json | Evidencia de preparación topológica |

Son nueve archivos. El verificador/backend comprueba los ocho hashes contenidos en coverage-release.json y los campos version/enabled/files_sha256 del manifiesto; por eso se requiere el conjunto completo aunque el navegador descargue solo coverage.geojson. El manifiesto no está fijado por un hash propio en release: se comprueba su referencia técnica. Su SHA-256 observado localmente es 9532a997098ec0b83af743e3ac4c19b1ccc1cdc3fb6230e409ced74f3924e416, como evidencia adicional.

El clon ya contiene geodata/coverage-release.json, geodata/coverage.ts, geodata/tools/prepare_coverage.py, scripts/provision-coverage.cjs, scripts/check-geodata-publication.cjs y consumidores en src/frontend y src/backend. No copiar recursos a src/frontend/public ni mantener un segundo paquete en backend. Los TypeScript generados del backend se regeneran con su script y están ignorados por Git.

RAR y GPKG se necesitan solamente para preparar el paquete; guardarlos en una carpeta privada individual fuera del clon. No hacen falta en ejecución. Los distritos reservados Sapallanga, San Agustín y Sicaya permanecen fuera de cobertura; no añadirlos.

## 1. Preparar herramientas y código

Requisitos: Git, Node.js 24, npm compatible (CI verificado con 11.19.0), Python 3 con venv y Shapely 2.2.0, y una herramienta local que extraiga RAR (por ejemplo 7-Zip). No instalar dependencias de Python en el frontend o backend.

Para una instalación nueva, clonar directamente la rama en una carpeta que todavía no exista:

```powershell
git clone --branch feature/post-sprint1-ui-geocoverage --single-branch https://github.com/RicardoF1/DistriRapido.git C:\Proyectos\DistriRapido
if ($LASTEXITCODE -ne 0) { throw 'No se pudo clonar. No continuar.' }
```

Si ya existe un clon, conservarlo y revisar su estado antes de actualizarlo; no ejecutar el comando sobre él. Los cuatro scripts citados están versionados en la rama publicada.

En PowerShell, adaptar la ruta a cada computador:

```powershell
$ErrorActionPreference = 'Stop'
$repoMapa = 'C:\Proyectos\DistriRapido'
Set-Location -LiteralPath $repoMapa
git status --short
git branch --show-current
node --version
npm --version
```

Utilizar el código de feature/post-sprint1-ui-geocoverage. Conservar cambios existentes; no usar reset/clean. Si npm.cmd falla en un Windows que ya tiene Node, se puede invocar su CLI con `node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js'` seguido de los argumentos habituales. No alterar variables ni .env existentes.

## 2. Descarga individual y validación de fuente

Cada integrante entra al portal oficial y descarga Distrito.rar directamente, sin obtenerlo de otro compañero. Extraer DISTRITO.gpkg en una carpeta privada individual, por ejemplo `C:\DatosPrivados\DistriRapido\fuente-INEI`. Revisar los nombres extraídos; no confundir una capa provincial con la distrital.

```powershell
$fuenteMapa = 'C:\DatosPrivados\DistriRapido\fuente-INEI'
$rarMapa = Join-Path $fuenteMapa 'Distrito.rar'
$gpkgMapa = Join-Path $fuenteMapa 'DISTRITO.gpkg'
$hashRarMapa = (Get-FileHash -LiteralPath $rarMapa -Algorithm SHA256).Hash.ToLowerInvariant()
$hashGpkgMapa = (Get-FileHash -LiteralPath $gpkgMapa -Algorithm SHA256).Hash.ToLowerInvariant()
if ($hashRarMapa -ne 'ae22428029000d801b3d68afd0914ba94ca40a789a9b56231f6131a75abb9654') { throw 'El RAR no coincide con la fuente v1 aprobada. Detener y revisar.' }
if ($hashGpkgMapa -ne 'b4b6485e4161ce4413bf118f39411071f7627d979a4c271acb35103f1d3e2756') { throw 'El GPKG no coincide con la fuente v1 aprobada. Detener y revisar.' }
```

No se volvió a descargar el archivo nacional en esta tarea; no se garantiza que el enlace continúe entregando esos mismos bytes. Si INEI actualiza el RAR, puede cambiar solo la compresión o también los datos: no ignorar la diferencia ni actualizar los hashes automáticamente. Solicitar al proveedor la versión correcta, o auditar y aprobar una nueva versión antes de instalarla.

## 3. Generar sin sobrescribir cobertura existente

El generador escribe en coverage/v1 relativa a su propia ubicación. Ejecutarlo directamente sobre la carpeta del proyecto podría sobrescribir el paquete. Copiar solo el script a una carpeta temporal privada NUEVA e individual:

```powershell
$trabajoMapa = Join-Path $repoMapa ('.local\preparacion-mapa-' + [Guid]::NewGuid().ToString('N'))
$herramientasMapa = Join-Path $trabajoMapa 'geodata\tools'
New-Item -ItemType Directory -Path $herramientasMapa | Out-Null
Copy-Item -LiteralPath (Join-Path $repoMapa 'geodata\tools\prepare_coverage.py') -Destination $herramientasMapa
py -3 -m venv (Join-Path $trabajoMapa 'venv')
if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear el entorno Python.' }
$pythonMapa = Join-Path $trabajoMapa 'venv\Scripts\python.exe'
& $pythonMapa -m pip install 'shapely==2.2.0'
if ($LASTEXITCODE -ne 0) { throw 'No se pudo instalar Shapely.' }
& $pythonMapa (Join-Path $herramientasMapa 'prepare_coverage.py') $gpkgMapa $rarMapa
if ($LASTEXITCODE -ne 0) { throw 'La preparación falló. No instalar recursos.' }
$paqueteMapa = Join-Path $trabajoMapa 'geodata\coverage\v1'
node scripts/provision-coverage.cjs --source $paqueteMapa
if ($LASTEXITCODE -ne 0) { throw 'El paquete no coincide o existe una colisión. No sobrescribir.' }
node scripts/provision-coverage.cjs
if ($LASTEXITCODE -ne 0) { throw 'Cobertura local no verificada.' }
```

La extracción conserva límites administrativos, incluidos sectores rurales; selecciona códigos y verifica nombres, geometrías, anillos y solapamientos. No simplifica, recorta, redondea ni repara polígonos. El paquete original usa saltos CRLF de Windows: no reserializar JSON ni convertir saltos de línea; SHA-256 compara bytes exactos. Si otra versión de Python/GEOS, orden de registros o plataforma produce hashes diferentes, detenerse y revisar, aunque las formas parezcan iguales. No modificar release para hacer pasar un paquete distinto. El procedimiento de generación completo no se repitió durante esta tarea: se verificó el paquete ya existente y se revisó el generador.

provision-coverage comprueba todos los hashes y colisiones antes de copiar. Nunca reemplaza un archivo existente con bytes distintos. La carpeta temporal está ignorada por Git; no compartirla, contiene derivados y herramientas innecesarias para ejecución.

## 4. Instalar aplicación y verificar hashes

Con la configuración privada individual ya disponible (sin copiar credenciales de compañeros):

```powershell
Set-Location -LiteralPath (Join-Path $repoMapa 'src\backend')
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci falló. No continuar.' }
npm run prisma:generate
if ($LASTEXITCODE -ne 0) { throw 'Falló prisma:generate. No continuar.' }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw 'Falló typecheck. No continuar.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Falló build. No continuar.' }
Set-Location -LiteralPath (Join-Path $repoMapa 'src\frontend')
npm ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci falló. No continuar.' }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw 'Falló typecheck. No continuar.' }
Set-Location -LiteralPath $repoMapa
node scripts/provision-coverage.cjs
node scripts/check-geodata-publication.cjs
```

No ejecutar db:migrate, db:bootstrap, resets, Docker ni comandos de volúmenes para esta instalación de geometrías. prisma:generate genera el cliente local, no migra ni modifica registros. Si la base local aún no está preparada, coordinar esa instalación por separado; esta guía no cambia la base.

Comprobación explícita independiente con PowerShell:

```powershell
$releaseMapa = Get-Content -LiteralPath 'geodata\coverage-release.json' -Raw | ConvertFrom-Json
foreach ($entradaMapa in $releaseMapa.files_sha256.PSObject.Properties) {
  $archivoMapa = Join-Path 'geodata\coverage\v1' $entradaMapa.Name
  $actualMapa = (Get-FileHash -LiteralPath $archivoMapa -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualMapa -ne $entradaMapa.Value) { throw ('Hash incorrecto: ' + $entradaMapa.Name) }
  Write-Output ('OK ' + $entradaMapa.Name)
}
git check-ignore geodata/coverage/v1/coverage.geojson
git ls-files -- geodata/coverage/v1
```

El último comando debe devolver una lista vacía; check-ignore debe identificar el recurso. No usar git add -f para geometrías. El guard revisa el índice y no los contenidos de un ZIP o imagen externos: no es una licencia ni garantía universal contra filtraciones.

## 5. Carga real y prueba del mapa

Abrir dos terminales desde la raíz. Backend: `cd src/backend; npm run start:dev`. Frontend: `cd src/frontend; npm run dev`. Estos comandos de desarrollo no ejecutan migraciones. Si ya están activos, reiniciar solo los procesos de la aplicación tras aprovisionar: el backend carga al iniciar y el navegador cachea la promesa de cobertura. No detener PostgreSQL ni Docker.

Con puertos de desarrollo existentes (normalmente frontend 5173), abrir http://localhost:5173/pedidos/nuevo con una cuenta propia autorizada. No registrar pedidos para comprobar el mapa.

- Abrir http://localhost:5173/geodata/coverage/v1/coverage.geojson: debe responder 200, FeatureCollection con cinco distritos; no HTML ni un recurso sintético.
- Ver los cinco límites, leyenda y botón Ver cobertura. Acercar y seleccionar una sugerencia válida explícitamente; verificar marcador magenta, zoom 17 y confirmación.
- Elegir un punto exterior: debe marcar fuera de cobertura y bloquear confirmación. Probar nuevamente dentro y editar dirección: no debe conservar confirmación falsa.
- Sin envío, comprobar el formulario a 390 y 1440 px. No se necesita insertar registros para validar la visualización.
- Sin cobertura, el frontend bloquea confirmación y el backend rechaza registro con 503; un punto exterior con recursos válidos se rechaza con 400. No hay fallback sintético de producción.

El navegador necesita Internet para teselas OpenStreetMap y Photon; los polígonos y la validación backend son locales. Ausencia de teselas o sugerencias no significa necesariamente hashes inválidos. El cargador frontend verifica SHA-256 mediante Web Crypto; usar localhost o HTTPS.

La compilación frontend que encuentra cobertura emite una copia en dist/geodata/coverage/v1/coverage.geojson: ese dist también contiene datos privados y no debe compartirse/publicarse sin autorización.

## Verificaciones realizadas en este equipo

- Los nueve recursos existentes están presentes; version/enabled/files_sha256 y los ocho hashes fijados coinciden.
- CoverageService compilado carga por su ruta de producción los datos reales sin instanciar Prisma: cinco puntos interiores aceptados; tres distritos reservados y un punto exterior rechazados con 400, con precisión de seis decimales. Servicio sin carga devuelve 503.
- Edge carga por HTTP mediante Vite el GeoJSON real y el módulo frontend de producción verifica su SHA-256: los mismos nueve puntos y cinco UBIGEO coinciden. La primera comparación del script local trataba Feature como string; se corrigió a Feature.id y se repitió correctamente, sin cambios en aplicación.
- Leaflet dibuja cinco polígonos reales y muestra Ver cobertura a 1366 px. Solo se simuló identidad para abrir la pantalla; no se simularon geometrías. No se enviaron pedidos ni se leyó/modificó PostgreSQL. No se verificó una selección Photon en vivo en esta tarea.
- Guard de publicación aprobado, sin derivados en el índice. En la fase de preparación no se generó paquete para redistribución ni hubo commit/push; no se realizaron cambios en Docker, credenciales, .env u Óptica Bangalore.

## Siguiente documento / Siguiente trabajo recomendado

Cada integrante debe registrar descarga individual, hashes y resultado de instalación. Obtener de INEI una aclaración documentada sobre extracción, derivados y redistribución dentro del equipo antes de preparar un paquete compartido. Si la fuente actual difiere de v1, auditarla antes de autorizar una versión nueva.
