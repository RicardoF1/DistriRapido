# Cobertura administrativa preparada — v1.0.0

Estado actual: v1.0.0 aprobada provisionalmente e integrada en frontend y backend. La publicación pública de datos e imágenes permanece bloqueada hasta aclarar permisos de redistribución.
Consulta: 8 de octubre de 2026, America/Lima.

## Fuente institucional

- Proveedor: Instituto Nacional de Estadística e Informática (INEI).
- Catálogo: https://ide.inei.gob.pe/ (Descarga de capas cartográficas).
- Descarga: https://ide.inei.gob.pe/files/Distrito.rar
- Etiqueta del portal: Distrital (Actualizado al 2023).
- Contenido: DISTRITO.gpkg, tabla DISTRITO, geometría geom.
- Atributo fuente en los cinco registros: V Censo Nacional Economico.
- GeoPackage last_change: 2026-03-06T16:55:35.154Z. Esta fecha interna no demuestra una actualización administrativa de límites posterior a 2023.
- Referencia espacial de origen: EPSG:4326, WGS 84; salida GeoJSON en longitud, latitud, grados decimales, sin miembro crs.
- Se verificó también la capa MINAM ServicioBase/MapServer/12; la consulta de registros agotó el plazo de 30 segundos. No se mezclaron fuentes.

## Archivos y distritos

| UBIGEO | Distrito | Provincia | Departamento | Archivo |
|---|---|---|---|---|
| 120101 | Huancayo | Huancayo | Junín | coverage/v1/120101.geojson |
| 120114 | El Tambo | Huancayo | Junín | coverage/v1/120114.geojson |
| 120107 | Chilca | Huancayo | Junín | coverage/v1/120107.geojson |
| 120125 | Pilcomayo | Huancayo | Junín | coverage/v1/120125.geojson |
| 120119 | Huancán | Huancayo | Junín | coverage/v1/120119.geojson |

coverage/v1/coverage.geojson es la fuente combinada de cinco Features, sin disolver los distritos. Los archivos individuales son extractos de esa misma versión. Se preservaron los atributos originales, incluido el nombre HUANCAN sin tilde.

Reservados y excluidos del conjunto habilitado: 120133 SAPALLANGA, 120129 SAN AGUSTIN (denominación en la fuente para San Agustín de Cajas), 120134 SICAYA.

No se recortaron zonas rurales ni se inventaron zonas urbanas. No se simplificaron, redondearon ni repararon las geometrías. Solo se extrajeron por código y se orientaron los anillos para GeoJSON: exteriores antihorarios e interiores horarios.

## Validación ejecutada

- SQLite integrity_check: ok; archivo fuente EPSG:4326.
- Cinco registros únicos seleccionados por UBIGEO y comprobación ccdd + ccpp + ccdi.
- Coincidencia de nombres, departamento JUNIN y provincia HUANCAYO.
- Cinco MultiPolygon válidos, cada uno con una parte; se conserva ese tipo aunque tenga una parte.
- Validación topológica Shapely/GEOS: sin geometrías vacías o inválidas.
- Anillos cerrados, al menos cuatro coordenadas, números finitos y rangos geográficos válidos.
- Sin solapamientos de superficie entre los cinco distritos. Esto no prueba precisión cartográfica ni ausencia de huecos territoriales no esperados.
- Conversión GeoJSON reversible a geometría equivalente.
- SHA-256 del RAR, GeoPackage y archivos exportados en manifest.json.
- Resultados detallados: coverage/v1/validation.json.

Herramienta reproducible: tools/prepare_coverage.py. Requiere Python y Shapely 2.2.0 (utilizado solo como herramienta temporal de preparación; no se modificaron dependencias de la aplicación). Ejecución con fuentes descargadas y extraídas:

    python geodata/tools/prepare_coverage.py /ruta/DISTRITO.gpkg /ruta/Distrito.rar

La herramienta no repara errores; ante nombres incorrectos, geometrías inválidas o solapamientos, falla antes de exportar. Escribe directamente en `coverage/v1/`: no ejecutarla sobre el paquete aprobado para esta entrega. Para reproducir, trabajar en una copia temporal del repositorio, comparar los hashes y revisar una nueva versión antes de reemplazar recursos.

## Puntos de prueba

coverage/v1/test-points.json contiene nueve puntos con coordenadas en orden longitud, latitud y expectativas verificadas:

- Cinco puntos interiores calculados (uno por distrito habilitado).
- Tres puntos interiores de los distritos reservados, fuera de cobertura.
- Un punto numérico exterior al noroeste, sin atribución administrativa.

Son fixtures geométricos, no direcciones, clientes ni entregas reales. representative_point garantiza interior, pero no localización urbana, acceso vial ni identidad de un establecimiento. No son geocodificaciones.

## Reutilización actual y pendiente

`geodata/coverage/v1/coverage.geojson` y `manifest.json` son la fuente canónica. Vite ya emite el mismo GeoJSON como recurso y el navegador verifica su SHA-256, versión, códigos y estructura. El backend carga y verifica el mismo paquete antes de aceptar altas. Reutiliza una copia generada exacta de `geodata/coverage.ts`, sin límites manuales ni descargas externas. Ambos Dockerfiles usan contexto raíz con copia selectiva de recursos privados.

El frontend admite Polygon/MultiPolygon y huecos. Redondea el punto a seis decimales antes de evaluar; acepta los bordes exteriores y de huecos, excluye el interior de huecos y elige el menor UBIGEO si hay un borde compartido. No aplica buffer operativo ni excluye zonas rurales. El backend aplica esta misma política, descrita en [FRONTEND-INTEGRATION.md](FRONTEND-INTEGRATION.md).

## Incertidumbres y límites de uso

- La descarga institucional es una referencia cartográfica administrativa, no certificación jurídica de un límite ni garantía de cobertura vial.
- La etiqueta 2023 y last_change 2026 son metadatos diferentes. No se afirma que los límites estén actualizados a 2026.
- No se contrastaron vértices con levantamientos de campo ni instrumentos legales de demarcación.
- La página INEI permite acceso gratuito, pero no se encontró una licencia de redistribución explícita asociada al archivo: revisar condiciones antes de publicación externa.
- El portal INEI advierte posibles diferencias o inconsistencias y recomienda consultar exactitud/vigencia ante dudas.
- En la preparación inicial no se modificó la aplicación. La integración posterior sí cambió mapa, Photon y confirmación frontend; no cambió endpoints, Prisma, base de datos o validación geográfica de backend.

## Estado del manifiesto y publicación

El `status: prepared-awaiting-user-approval` del manifiesto conserva el snapshot de preparación de la Fase 1. No se altera el paquete versionado ni sus hashes para actualizar ese texto; la aprobación provisional y estado vigente se documentan aquí. El paquete contiene cinco extractos distritales, conjunto combinado, manifiesto, fixtures y validación. Los RAR/GPKG originales permanecen fuera del repositorio.

La revisión actual del [portal INEI](https://ide.inei.gob.pe/) confirma acceso gratuito y advertencias de exactitud/vigencia; no se identificó allí una licencia explícita asociada al archivo que aclare su redistribución en GitHub. No se equipara acceso gratuito con permiso verificado de republicación. El remoto actual es público: los GeoJSON quedan condicionados a aclarar esa autorización. No se asigna una licencia propia a datos de terceros.

La regla global anterior `coverage/` ocultaba accidentalmente este paquete. Se ajustó `.gitignore` para ignorar los informes de cobertura de frontend/backend sin ocultar los recursos canónicos. Ese ajuste pertenecía a la fase documental anterior. Ahora `/geodata/coverage/v1/` queda excluido expresamente de Git para impedir su publicación accidental; los nueve archivos permanecen intactos en disco.

Las evidencias de preparación se conservan; la verificación vigente y lista exacta propuesta están en [el informe posterior al Sprint 1](../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/01%20Verificación%20y%20entrega%20V_1_1_0.md).

## Reconciliación de estructura posterior

La entrega preparada desde origin/main conserva geodata/ en la raíz y usa src/frontend y src/backend. Las rutas y comandos antiguos de este informe corresponden a su fase original. La carga frontend y los tests se adaptaron al nivel adicional de src. La fase posterior añade validación backend y empaquetado privado desde contexto raíz; los permisos INEI continúan pendientes. Véase [la evidencia vigente](../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/04%20Reconciliación%20sobre%20main%20V_1_1_0.md).

## Aprovisionamiento privado y metadatos fijados

`coverage-release.json` contiene versión, códigos y hashes aprobados, sin polígonos, y expresa `publicReleaseAllowed: false`. Es la referencia de integridad para consumidores y aprovisionamiento. El manifiesto original se conserva sin reescribir sus fechas, procedencia, estado o limitaciones.

Desde la raíz: `node scripts/provision-coverage.cjs --source "/directorio/privado/autorizado/v1"`. Copia únicamente los nueve recursos si sus hashes coinciden; comprueba todas las colisiones antes de escribir y no reemplaza bytes existentes diferentes. Sin `--source`, solo verifica el paquete local. No descarga INEI ni concede permisos.

`node scripts/check-geodata-publication.cjs` inspecciona el índice Git y falla ante derivados geográficos mientras no exista autorización documentada. Ejecutarlo antes de una entrega y después de seleccionar archivos. No protege una publicación manual de imágenes fuera de Git: las imágenes construidas contienen datos y deben permanecer privadas. Un clon público sin aprovisionamiento autorizado no puede construir ni desplegar completamente esta funcionalidad.

Detalles y resultados de esta fase: [informe 05](../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/05%20Validación%20backend%20y%20empaquetado%20V_1_1_0.md).

## Instalación individual para el equipo (Windows)

Consultar [la guía V_1_1_0](EQUIPO-WINDOWS-V_1_1_0.md): nueve recursos exactos, descarga directa individual desde INEI, generación aislada, comprobación de hashes y prueba del mapa sin registrar pedidos. No se acreditó redistribución interna y no se preparó paquete compartido.

## Siguiente documento / Siguiente trabajo recomendado

Resolver y documentar los permisos de redistribución INEI antes de publicar datos o imágenes. Revisar la evidencia técnica 05 y verificar persistencia en una base exclusivamente de pruebas, sin utilizar los registros existentes.
