# Corrección de sincronización de dirección y marcador

## Diagnóstico comprobado antes de modificar

Se inspeccionaron `useDeliveryAddress.ts`, `DeliveryMap.tsx`, `OrderForm.tsx`, `geocoding.ts` y las funciones de cobertura GeoJSON. Se reprodujo el flujo en Edge con sesión/API simuladas y se consultó Photon públicamente en modo de solo lectura.

- Escribir solo presenta sugerencias: no crea ni confirma un marcador. Esta selección explícita es intencional y se mantiene.
- La selección sí actualizaba las coordenadas y creaba el marcador. En móvil de 390×844, la reproducción encontró el mapa a `y≈1012` y el marcador a `y≈1188`: existían, pero quedaban fuera de la pantalla visible debajo del buscador.
- `selectExternal` omitía cualquier actualización cuando el marcador ya tenía las mismas coordenadas. Después de «Ver cobertura», seleccionar nuevamente esa dirección no volvía a centrar/acercar el mapa.
- El marcador anterior era pequeño y verde, parecido a la cobertura. Los polígonos no lo ocultaban por orden de capas: Leaflet ya utiliza un pane superior para los marcadores.
- Photon devolvió «Plaza de la Constitución», OSM way 88269258, coordenadas `[-75.2100731, -12.0680457]`. El punto redondeado a seis decimales pasa la cobertura HUANCAYO en los E2E. No se encontró un rechazo erróneo de este punto ni un fallo del evento de selección.
- `move` marcaba el punto como confirmado antes de resolver la búsqueda inversa y lo dejaba confirmado ante error. Esa confirmación prematura se corrigió.

La consulta se realizó en `https://photon.komoot.io/api/` con el texto del usuario y los parámetros geográficos existentes. Los casos E2E fijan esta respuesta para ser reproducibles; El Tambo y Chilca usan puntos de los fixtures administrativos, no direcciones reales inventadas en la aplicación.

## Cambios

- Cada selección explícita incrementa `focusRevision`. Leaflet centra y acerca el destino a zoom 17 aunque sean las mismas coordenadas; el arrastre y las respuestas de React no provocan recentrados innecesarios.
- Al elegir una sugerencia, se hace visible el mapa mediante scroll, se transfiere el foco al mapa y se actualiza su tamaño. Se conserva Enter en sugerencias y mapa, flechas, arrastre y «Ver cobertura».
- Marcador de 36 px, magenta, borde blanco y sombra, con prioridad visual adicional. Se distingue de los distritos y conserva el estado rojo fuera de cobertura; el borde discontinuo identifica una ubicación pendiente de confirmar.
- Una selección manual válida espera la búsqueda inversa. Solo una respuesta vigente y correcta confirma el punto; un error conserva las coordenadas para corregirlas, pero bloquea el envío. Editar la dirección y respuestas tardías tampoco restauran una confirmación anterior.
- El formulario sigue enviando exclusivamente las coordenadas del punto confirmado, con seis decimales y validación de cobertura previa al envío.

No se cambiaron Photon, polígonos, hashes, backend, Prisma, PostgreSQL, autenticación, contratos ni dependencias. No se realizaron commit ni push.

## Archivos de esta corrección

Implementación:

- `frontend/src/features/orders/useDeliveryAddress.ts`
- `frontend/src/features/orders/DeliveryMap.tsx`
- `frontend/src/features/orders/OrderForm.tsx`
- `frontend/src/styles/app.css`

Pruebas:

- `frontend/src/features/orders/useDeliveryAddress.test.tsx`
- `frontend/src/features/orders/DeliveryMap.test.tsx`
- `frontend/src/features/orders/orders.test.tsx`
- `frontend/e2e/order-marker-sync.spec.ts` (nuevo)
- `frontend/e2e/order-delivery-time.spec.ts` (la prueba de horarios ahora proporciona una respuesta inversa válida en vez de depender del comportamiento corregido de confirmar ante HTTP 503)

Informe: `geodata/MARKER-SYNC.md`. Se preservan los cambios pendientes anteriores.

## Verificación

Los resultados siguientes corresponden al cierre de esta corrección de sincronización, antes de reorganizar el formulario y mejorar el panel. La verificación actual del conjunto se encuentra en [el informe posterior al Sprint 1](../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/01%20Verificación%20y%20entrega%20V_1_1_0.md).

- ESLint y TypeScript `tsc --noEmit`: exit 0.
- Suite Vitest completa: 15 archivos y 192 pruebas aprobadas, 61.05 s.
- Build Vite: correcto, 94 módulos, 4.39 s.
- E2E seleccionados en Edge, móvil/escritorio: 40 pruebas aprobadas, 1.6 min; incluyen los cinco nuevos flujos de sincronización en ambos proyectos.
- SHA-256 de cobertura sin cambios: `ac5f8b3366d5e028e5acf51e74dfcea18ab0a8db1edbcf1cc6236c9634afd33b`.
- Captura móvil de 390 px revisada sobre teselas OSM reales: marcador visible y centrado en la plaza. La consulta Photon real fue de solo lectura; no se guardaron pedidos.

Los E2E usan sesiones y API simuladas; el POST se intercepta y comprueba sus coordenadas, sin escribir datos reales. La suite seleccionada incluye sincronización, cobertura a 390/768/1366/1440 px, fuera de cobertura, dirección inversa, horarios, consulta y navegación de los cuatro roles.

Para revisar localmente, abrir `http://localhost:5173/pedidos/nuevo`, escribir «Plaza Constitución, Huancayo, Junín», elegir la sugerencia con clic o Tab/Enter, usar «Ver cobertura» y volver a elegirla. El destino debe quedar centrado y visible. Editar la dirección debe invalidar la confirmación. Si Photon falla al mover el marcador, debe aparecer un mensaje y bloquearse el envío.

La validación final de cobertura en backend permanece pendiente de la siguiente fase autorizada.

## Estado visual posterior

El registro sigue siendo un formulario único. Cliente/carga y programación están en dos columnas de escritorio; la ubicación ocupa el ancho completo debajo. El mapa mide ahora 560–640 px en escritorio, 480 px en tablet y 400–460 px en celular. La confirmación aparece junto al buscador, la leyenda es compacta y el botón está al final. Estos cambios no sustituyen la sincronización y bloqueo descritos aquí.

La imagen del login y las mejoras de administración se documentan en el [addendum V_1_1_0](../docs/03%20Implementación/05%20Mejoras%20posteriores%20al%20Sprint%201%20V_1_1_0.md), sin presentarlas como parte del cierre histórico.

## Reconciliación de estructura posterior

La entrega preparada desde origin/main conserva geodata/ en la raíz y usa src/frontend y src/backend. Las rutas y comandos antiguos de este informe corresponden a su fase original. La carga frontend y los tests se adaptaron al nivel adicional de src; Docker mantiene su contexto limitado a src/frontend y no incluye geodata. La validación geográfica backend y los permisos INEI continúan pendientes. Véase [la evidencia vigente](../docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/04%20Reconciliación%20sobre%20main%20V_1_1_0.md).

## Siguiente documento / Siguiente trabajo recomendado

Completar la validación en backend una vez aclarada la distribución de los recursos. Reutilizar la misma política de seis decimales y bordes evita discrepancias entre marcador confirmado y persistencia del pedido.
