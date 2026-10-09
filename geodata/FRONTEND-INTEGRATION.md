# Integración de cobertura en el frontend — Fase 2

Cobertura administrativa v1.0.0 aprobada provisionalmente por el usuario. Integración limitada al registro de pedidos `/pedidos/nuevo`. Este informe conserva la evidencia de la integración frontend original. La validación backend se implementó en una fase posterior documentada abajo; la publicación permanece bloqueada.

## Verificación previa y preservación

Se revisaron los cambios pendientes de Git y `tools/prepare_coverage.py` antes de modificar la aplicación. Se verificaron los hashes SHA-256 del manifiesto, incluidos los cinco archivos distritales, `coverage.geojson`, los fixtures, el informe de validación y las fuentes temporales RAR/GeoPackage. Se comprobaron los cinco UBIGEO, nombres, provincia HUANCAYO, departamento JUNIN, equivalencia entre archivos individuales y conjunto combinado, anillos y validez topológica con Shapely. No se detectaron problemas de integridad ni solapamientos de superficie.

UBIGEO habilitados: 120101 Huancayo, 120107 Chilca, 120114 El Tambo, 120119 Huancán y 120125 Pilcomayo. Los cinco archivos originales son MultiPolygon.

Hash de `coverage/v1/coverage.geojson`:

```text
ac5f8b3366d5e028e5acf51e74dfcea18ab0a8db1edbcf1cc6236c9634afd33b
```

En la integración inicial no se regeneraron las geometrías ni se modificaron `prepare_coverage.py` o el manifiesto. El estado del manifiesto describe el snapshot de preparación de la Fase 1; el README actual registra la aprobación provisional y la integración posterior. Se preservan la fecha de consulta, la etiqueta INEI «Actualizado al 2023», el `last_change` interno de 2026 y la incertidumbre sobre redistribución. No se afirma que los límites hayan sido actualizados a 2026.

## Implementación visual y comportamiento

- Estado visual vigente: cliente/carga y programación en dos columnas de escritorio; ubicación debajo a todo el ancho. Mapa de 560–640 px en escritorio, 480 px en tablet y 400–460 px en celular, según espacio y viewport. Leyenda compacta, confirmación junto al buscador y botón final destacado. Los estilos se limitan a esta sección.
- Cinco polígonos con colores distintos, leyenda, etiquetas de distrito/UBIGEO, vista inicial de toda la cobertura y botón «Ver cobertura». Se conservan controles de zoom, marcador arrastrable, flechas y selección del centro con Enter. `ResizeObserver` llama a `invalidateSize` sin remontar el formulario.
- El GeoJSON canónico se importa como URL de recurso de Vite. Se descarga una vez por sesión de página, con timeout de 10 segundos, y se comprueban SHA-256, versión, estructura, distritos, anillos y coordenadas antes de habilitar selección. Archivo ausente, corrupto o no verificable bloquea la confirmación y solicita recargar. No se consulta INEI durante el uso de la aplicación.
- Photon recibe `countrycode=PE`, foco Huancayo, `zoom=13`, `location_bias_scale=0.1`, `bbox` calculado de los polígonos y `limit=15`. Son parámetros documentados en la [API oficial de Photon](https://github.com/komoot/photon/blob/master/docs/api-v1.md). El bbox es una primera restricción rectangular; la autorización final se determina por polígonos.
- Se filtran las coordenadas de las respuestas, independientemente de sus nombres o metadatos: un resultado de Jauja se rechaza aunque su etiqueta diga Huancayo. Se conservan los metadatos administrativos disponibles y se añade el distrito determinado por geometría. Las sugerencias muestran distrito, provincia, departamento y país.
- Escribir no cambia automáticamente el texto. Solo elegir una sugerencia o la geocodificación inversa de un punto seleccionado puede actualizarlo, como antes. Se conservan debounce de 700 ms, cancelación, caché de 50 consultas, timeout y mensajes de error. No se realiza geocodificación inversa de puntos fuera de cobertura.
- Clic, arrastre, Enter, elección de sugerencia y envío del formulario comprueban la cobertura. Un marcador arrastrado fuera queda rojo y sin confirmar; no se conserva la confirmación anterior. El envío revisa nuevamente las coordenadas, además de las validaciones de Sprint 1.
- Refinamiento posterior: marcador magenta de 36 px, centrado a zoom 17 y mapa visible al elegir una sugerencia, incluso si repite el destino. Clic/arrastre/Enter confirman solo después de una búsqueda inversa vigente y correcta; un fallo conserva el punto para corregirlo, pero bloquea el envío. Véase [MARKER-SYNC.md](MARKER-SYNC.md).

## Política geográfica compartida

`geodata/coverage.ts` contiene funciones puras sin coordenadas ni límites duplicados. Admite Polygon, MultiPolygon y huecos. La geometría administrativa se conserva con su precisión original; el punto se redondea a seis decimales antes de comprobarse y enviarse.

Se acepta el borde exterior y el borde de los huecos; el interior de un hueco se rechaza. Si varios distritos cubren un borde compartido, se elige el menor UBIGEO para la etiqueta. La tolerancia numérica de 1e-12 grados evita errores de coma flotante y no constituye un buffer de servicio. Un punto que deje de estar sobre el borde al redondearse se evalúa en su posición redondeada. No se han excluido zonas rurales ni creado polígonos urbanos.

La validación estructural del navegador no sustituye una auditoría topológica general: esa auditoría se realizó previamente sobre los archivos aprobados, cuya integridad se verifica en tiempo de carga.

## Archivos de esta fase

Nuevos:

- `geodata/coverage.ts` y este informe.
- `frontend/src/services/coverage.ts`, `frontend/src/hooks/useCoverage.ts`.
- `frontend/src/services/coverage.test.ts`.
- `frontend/src/features/orders/coverage-failure.test.tsx`.
- `frontend/e2e/order-coverage.spec.ts`.

Modificados:

- `frontend/src/features/orders/DeliveryMap.tsx`, `OrderForm.tsx`, `useDeliveryAddress.ts`.
- `frontend/src/services/geocoding.ts`.
- `frontend/src/styles/app.css` (reglas nuevas para ubicación y mapa).
- Pruebas `DeliveryMap.test.tsx`, `useDeliveryAddress.test.tsx`, `orders.test.tsx`, `geocoding.test.ts`.
- `frontend/src/test/setup.ts`, `frontend/vitest.config.ts` para cargar recursos canónicos y Web Crypto en pruebas.
- `frontend/e2e/order-address.spec.ts` y `order-navigation.spec.ts` para las etiquetas de sugerencias y apertura del menú móvil existente.

Se preservan los cambios pendientes de fases anteriores. No se modificaron backend, contratos API, Prisma, migraciones, PostgreSQL, autenticación, permisos ni dependencias. Sin commit ni push.

## Validaciones ejecutadas

Resultados ejecutados al finalizar la primera integración, antes de los ajustes posteriores de marcador, formulario y panel. Son evidencia histórica de esa fase; los resultados actuales se registran en [la verificación posterior al Sprint 1](../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/01%20Verificación%20y%20entrega%20V_1_1_0.md).

| Verificación | Resultado |
|---|---|
| ESLint del frontend | Correcto, exit 0 |
| TypeScript `tsc --noEmit` | Correcto, exit 0 |
| Vitest completo, un worker | 15 archivos, 190 pruebas aprobadas; 57.75 s |
| Build Vite | Correcto, 94 módulos; 2.96 s |
| E2E seleccionados en Edge, proyectos móvil/escritorio | 30 pruebas aprobadas; 1.1 min |
| Anchuras 390, 768, 1366, 1440 px | E2E y capturas revisadas; sin desbordamiento horizontal |
| Bordes 767/768 y 1023/1024 px | Comprobación adicional con Playwright: alturas 380/440/440/522 px a 900 px de alto, sin desbordamiento y conservando el borrador |
| Integridad del GeoJSON emitido en `dist/assets` | SHA-256 idéntico al canónico y al manifiesto |
| `git diff --check` | Sin errores de espacios; avisos habituales LF/CRLF de Git |

Las primeras ejecuciones detectaron problemas de las pruebas (espera de animación Leaflet, apertura del menú móvil y aislamiento de búsquedas de preparación), corregidos antes de la ejecución final. Una ejecución unitaria concurrente sufrió además un timeout de restauración de sesión; el caso y la suite completa pasaron en la ejecución final de un worker, sin modificar autenticación.

Las pruebas usan fixtures y respuestas simuladas; no crean ni eliminan usuarios o pedidos reales. Los E2E bloquean las teselas OSM en las pruebas del mapa, por lo que comprueban Leaflet, polígonos e interacción, pero no la disponibilidad ni cartografía remota. Photon también se simula para verificar de manera determinista ambigüedad, parámetros y filtrado. No se ejecutó toda la colección E2E del proyecto ni pruebas de backend en esta fase; se ejecutaron los cinco archivos indicados en los comandos.

Los casos geográficos cubren un punto por distrito, tres distritos reservados, Jauja, resultados ambiguos, bordes, redondeo, huecos, MultiPolygon y carga corrupta. Los E2E de cobertura comprueban 390, 768, 1366 y 1440 px sin desbordamiento horizontal, selección, arrastre exterior y fallo de carga. Las regresiones seleccionadas cubren dirección inversa, horarios de Lima, consulta/filtros/paginación y navegación/permisos de los cuatro roles.

## Verificación local

Con backend y frontend iniciados por el procedimiento habitual, abrir `http://localhost:5173/pedidos/nuevo` con un Administrador u Operador/Técnico. Si hay que iniciar solo el frontend y `npm` local no funciona, desde `frontend` ejecutar:

```powershell
node node_modules/vite/bin/vite.js --host 0.0.0.0
```

Comprobar las cuatro anchuras, pulsar «Ver cobertura», buscar «Tambo», elegir un destino autorizado, moverlo fuera de los polígonos y confirmar que desaparece «Ubicación confirmada». Probar Enter con el foco en el mapa y abrir/cerrar el menú conservando los campos. Para revisar el bloqueo sin crear datos reales, no enviar un formulario válido al backend real.

Comandos equivalentes a lint, typecheck, pruebas y build desde `frontend`:

```powershell
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run --maxWorkers=1
node node_modules/vite/bin/vite.js build
node node_modules/@playwright/test/cli.js test e2e/order-coverage.spec.ts e2e/order-address.spec.ts e2e/order-navigation.spec.ts e2e/order-delivery-time.spec.ts e2e/order-consultation.spec.ts --project=desktop --project=mobile
```

## Plan concreto de validación en backend (requiere siguiente autorización)

1. Incorporar un servicio de cobertura en el módulo de pedidos que cargue los mismos bytes de `coverage/v1/coverage.geojson` y el manifiesto al iniciar. Copiar ambos recursos desde su ubicación canónica durante el build y reutilizar las funciones puras de `geodata/coverage.ts` mediante un artefacto compartido compilado para el backend. Evitar un segundo juego manual de límites o reglas; verificar versión y hash también en el artefacto distribuido.
2. Mantener las validaciones DTO actuales, incluyendo hasta seis decimales. Comprobar `dto.cliente.latitud/longitud` con la misma política de borde/redondeo en `OrdersService.create`, antes de `prisma.$transaction` y de crear Cliente/Pedido. No hace falta modificar Prisma ni las tablas.
3. Rechazar un destino exterior con HTTP 400 y mensaje claro; si la cobertura no está disponible o falla su integridad, rechazar nuevas altas con HTTP 503. Mantener consulta de pedidos históricos, sesiones y guards de roles. No revalidar ni eliminar registros existentes.
4. Añadir pruebas de servicio y HTTP para los cinco puntos interiores, Jauja, distritos reservados, límites/huecos/MultiPolygon, precisión e integridad, y demostrar que no se llama a la transacción al rechazar. Reutilizar los mismos fixtures para comprobar paridad frontend/backend.
5. Ejecutar lint, typecheck, tests y build del backend, y pruebas integradas de registro con base de datos aislada de pruebas. Solo después podrá declararse validación completa de extremo a extremo.

## Riesgos pendientes

- La protección actual del navegador puede eludirse mediante llamadas directas a la API: la validación del backend sigue pendiente.
- Referencia administrativa provisional: no garantiza accesibilidad vial ni actualidad jurídica; se conservan las incertidumbres INEI y de redistribución de la Fase 1.
- Web Crypto requiere contexto seguro (HTTPS o localhost). Si no está disponible, se bloquea la confirmación, como cualquier fallo de integridad.
- No se probó un alta real ni disponibilidad externa de Photon/OSM en los E2E simulados. Una revisión manual posterior consultó Photon y teselas OSM en modo de solo lectura, sin demostrar disponibilidad permanente. Si falla la consulta inversa de una selección manual, el punto queda sin confirmar y no se envía.
- El remoto es público y la licencia INEI sigue sin aclararse. El contexto Docker `./frontend` no incluye los recursos `geodata/`: requiere un ajuste de empaquetado autorizado; no se ejecutó ni aprobó un build Docker.

## Reconciliación de estructura posterior

La entrega preparada desde origin/main conserva geodata/ en la raíz y usa src/frontend y src/backend. Las rutas y comandos antiguos de este informe corresponden a su fase original. La carga frontend y los tests se adaptaron al nivel adicional de src. La fase posterior incorporó validación backend y contexto Docker raíz selectivo; los permisos INEI continúan pendientes. Véase [la evidencia vigente](../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/04%20Reconciliación%20sobre%20main%20V_1_1_0.md).

## Actualización posterior: validación backend

El frontend contrasta ahora versión, cinco UBIGEO y tabla de hashes con `coverage-release.json`, además del hash del recurso. El backend aplica la misma política geométrica generada reproduciblemente desde `coverage.ts`, antes de cualquier transacción de creación; HTTP 400 para punto exterior/invalidado y 503 ante cobertura no verificable. El cliente presenta este último error de forma explícita.

No se alteraron mapa, Photon, marcador ni formularios en esta fase. El paquete original permanece intacto y privado; los contextos Docker lo incluyen selectivamente tras aprovisionamiento autorizado. Los resultados antiguos de este informe conservan su alcance histórico. Evidencia actual: [informe 05](../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/05%20Validación%20backend%20y%20empaquetado%20V_1_1_0.md).

## Siguiente documento / Siguiente trabajo recomendado

Resolver y documentar los permisos de redistribución INEI antes de publicar datos o imágenes. Revisar la evidencia técnica 05 y verificar persistencia en una base exclusivamente de pruebas, sin utilizar los registros existentes.
