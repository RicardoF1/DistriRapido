# Contratos de planificación, cálculo OSRM y consulta de rutas V_1_1_0

Fecha: 2026-10-29. Proyecto: DistriRapido / EcoRuta Huancayo. Estado: diseño para aprobación; enfoque B aprobado, detalles siguientes propuestos. Esta fase no implementa servicios, no crea migraciones y no escribe en PostgreSQL. No autoriza crear rutas públicas, modificar pedidos existentes, publicar imágenes/GeoJSON privados ni cambiar autenticación.

## 1. Fuentes y trazabilidad

| Historia | Ticket comprobado en Evidencia2_Backlog_Priorizado.png | Fuente textual y aceptación original resumida |
|---|---|---|
| US-010 / RF-008 / ST-011 | HGR-28 | `docs/02 Planificación/01 Transformando a ágil V_1_0_0.md:459`: crear planificación preparada con pedidos pendientes y recursos disponibles; rechazar selección insuficiente. RF-008 V_1_1_0 también permite modificar selección antes de generar rutas. |
| US-011 / RF-009 / ST-012 | HGR-29 | Mismo backlog, línea 494: generar alternativas de una planificación preparada válida; impedir generación inválida. RF-009 también exige conservar planificación y admite nuevo conjunto de alternativas. |
| US-012 / RF-010 / ST-013 | HGR-31 | Línea 529: procesar alternativas y presentar solución; ante interrupción, conservar datos y comunicar resultado. RF-010 exige resultados de evaluación y rechazar soluciones inválidas. |
| US-013 / RF-011 / ST-014 | HGR-32 | Línea 564: consultar información de ruta generada; informar ruta inexistente. RF-011 añade búsqueda permitida y autorización por usuario. |

Fuente RF: `docs/01 Inicio/06. Requisitos funcionales V_1_1_0.md`, secciones RF-008 a RF-011. Reglas aplicables: `docs/01 Inicio/09. Reglas de negocio V_1_1_0.md`, RN-001/002/003/005/006/007/008/009/010/011/014/016. Arquitectura OSRM prevista en `docs/01 Inicio/10. Stack tecnológico V_1_1_0.md:331`. Modelo objetivo previo en `docs/01 Inicio/11. Base de datos V_1_1_0.md`, tablas rutas/paradas y sección 11.

### Sprints y discrepancias

La evidencia SprintPlanning muestra solo Sprint 1 y US-001 a US-005. Las evidencias de integración locales documentan US-006 a US-009 como Sprint 2. El backlog visual deja US-010 a US-013 en Backlog sin asignación de Sprint visible. El trabajo actual fue solicitado como Sprint 3, pero no se puede certificar la asignación original de las cuatro historias sin el tablero/acta actualizado. No se modificará Jira ni se declararán historias cerradas.

US-010/011/012 corresponden a EP-03 en el texto. US-013 corresponde a EP-04 en el backlog textual, pero aparece bajo EP-03 en la captura histórica. Mantener RF-011/ST-014 y registrar la discrepancia para validación del equipo; no corregir fuentes históricas silenciosamente.

RN-005 admite penalizaciones por ventanas incumplidas, mientras RN-011 prohíbe presentar soluciones que incumplan restricciones obligatorias. Propuesta: mostrar alternativas con violaciones identificadas para evaluación, pero no considerarlas confirmables; el equipo debe decidir expresamente si alguna ventana puede ser una restricción blanda. No introducir tolerancias tácitas.

## 2. Estado comprobado y alcance

Código existente: PostgreSQL/Prisma con Usuario, Rol, Cliente, Pedido, Vehiculo, Conductor y DisponibilidadConductor; CRUD de recursos, estados de pedidos, coordenadas, ventanas, cobertura v1.0.0 con hashes, Photon, Leaflet, sesiones y gestión de cuentas. DisponibilidadConductor registra intervalos DISPONIBLE/NO_DISPONIBLE; Vehiculo usa un estado actual, no un calendario de disponibilidad. Conductor no almacena hoy punto de partida. No hay modelos/servicios de planificación, alternativas, rutas, paradas, asignaciones, entregas, OSRM ni algoritmo genético implementados.

Revisados: `src/backend/prisma/schema.prisma`, `src/backend/src/app.module.ts`, módulos orders/coverage/drivers/availability/vehicles, y frontend AppRoutes/AppLayout/DriverAccessPage/DeliveryMap/geocoding. El panel de Juan sigue siendo preparación de acceso, no US-016 implementada.

Objetivo tras aprobación: preparar datos reales, calcular recorridos viales trazables, registrarlos y consultarlos sin recálculos al leer. El cálculo básico OSRM no acredita US-012 ni por sí solo todos los criterios de US-011. Comparar, confirmar, asignar y ejecutar entregas siguen siendo operaciones separadas.

Enfoques considerados: A, consulta sola con productor externo pendiente, mantiene alcance pero no entrega recorridos nuevos; B, productor mínimo real coordinado con US-010/011/012, permite flujo progresivo y exige nuevos contratos; elegido B por el usuario. No se contempla generar recorridos como efecto secundario de GET.

## 3. Preparación de pedidos y recursos — propuesta

Administrador y Operador seleccionan explícitamente pedidos PENDIENTE, vehículos DISPONIBLE y conductores ACTIVO con intervalos DISPONIBLE dentro de una jornada definida. Cuenta vinculada y ficha activa son necesarias para el futuro acceso operativo, pero no se exige cuenta para inventariar conductores o consultar rutas administrativas. Para asignación y visualización del conductor se verificará cuenta activa/rol correcto.

La primera entrega tendrá un vehículo candidato por recorrido y un conjunto de conductores elegibles sin asignación. La estructura admitirá múltiples recorridos por alternativa, pero no se declarará implementado un reparto multivehículo antes de sus pruebas y aprobación. Preparación exige al menos un pedido, vehículo y conductor elegible; si faltan recursos reales se muestra el motivo, sin seeds automáticos.

Decisión técnica del primer incremento: exactamente un vehículo seleccionado por versión preparada. DTO e interfaz rechazan seleccionar más de uno; no se elige silenciosamente el primero de una lista. El conjunto de conductores puede contener varios candidatos elegibles sin comprometer a ninguno. El reparto multivehículo requerirá ampliar ese límite explícitamente, con sus escenarios de capacidad y partición de pedidos.

El backend carga IDs desde PostgreSQL; el navegador no impone coordenadas/pesos de pedidos, capacidades, rol o métricas. Comprobar IDs únicos/existentes, peso positivo, volumen positivo cuando informado, cliente habilitado, ventanas válidas y vigentes para la jornada, cobertura administrativa v1.0.0 y precisión hasta seis decimales. No reescribir pedidos históricos fuera de cobertura; excluirlos de una planificación nueva con motivo explícito. No cambiar automáticamente PENDIENTE a EN_PREPARACION ni EN_RUTA.

Conservar NULL de volumen: una alternativa con información volumétrica incompleta no demuestra viabilidad completa. Se permite calcular su recorrido vial y mostrar que la validación volumétrica no es evaluable, pero no confirmarla/asignarla hasta completar datos o aprobar otra política. No convertir NULL a cero.

Una planificación preparada no reserva recursos. Revalidar antes del cálculo y antes de persistir su resultado; después revalidar de nuevo en confirmación/asignación. Un estado DISPONIBLE de vehículo no demuestra disponibilidad futura. US-015 necesitará comprobar conflictos temporales entre asignaciones tanto de conductor como de vehículo sin modificar el CRUD de US-007/009.

## 4. Origen, final, horario y orden — decisiones que requiere la aprobación

No se encontró una dirección/coordenada de depósito aprobada. No usar la cuenta de Juan, su ubicación, el centro del mapa ni el primer cliente como origen implícito.

Propuesta para el primer incremento: origen explícito por planificación (etiqueta y punto confirmado), dentro de cobertura y con precisión de seis decimales. Reutilizar Photon/Leaflet para seleccionarlo. Así no se añade una ubicación ficticia a Conductor ni un nuevo catálogo de sedes. Un origen fuera de cobertura requiere una política posterior expresa.

Final obligatorio: elegir RECORRIDO_ABIERTO, termina en último pedido, o RETORNO_AL_ORIGEN, añade el regreso al origen. Sin opción predeterminada silenciosa. Un depósito final diferente queda fuera del primer incremento, aunque el contrato de versión se prepara para un punto final explícito futuro.

Inicio operativo y límite de jornada se guardan como instantes con zona horaria; mostrar America/Lima y persistir TIMESTAMPTZ. Primera ruta secuencial: el usuario confirma una permutación completa de los pedidos seleccionados. Rechazar IDs repetidos, omitidos o ajenos. No usar orden de creación, cercanía en línea recta o prioridad para alterar silenciosamente el orden. Etiquetar ORDEN_MANUAL, CALCULADA_OSRM, no OPTIMIZADA.

Viaje y atención son diferentes: OSRM aporta duración vial. Para calcular llegadas y disponibilidad total se necesita tiempo de servicio por parada y política de esperas. Propuesta: solicitar tiempo de atención estimado no negativo por pedido al preparar, sin default cero; cero solo si el usuario lo confirma explícitamente. Llegada vial, inicio de servicio=max(llegada,inicio de ventana), espera y salida se distinguen; proponer que el inicio de servicio deba estar dentro de la ventana. Requerir que el periodo completo, incluyendo atención/esperas/regreso, termine antes del límite de jornada y quepa en un único intervalo DISPONIBLE del conductor. Descansos y jornadas fraccionadas no están configurados: bloquear confirmación si su cumplimiento es obligatorio y no evaluable. El cálculo de geometría por sí solo puede consultarse sin declararse confirmable.

## 5. Adaptador OSRM y procedencia

Adaptador backend `RoutingProvider` con `calculateRoute(orderedPoints, profile)` y futura `calculateMatrix(points, profile)`. Configuración de servidor por despliegue, nunca URL recibida desde el navegador. Recomendación: instancia privada/autohospedada con extracto OSM autorizado y perfil fijado; no se levantará en esta fase ni se tocará Docker. Proveedor remoto solo tras aprobar sus condiciones y el envío de coordenadas.

OSRM Route: `/route/v1/driving/{lon,lat;...}?geometries=geojson&overview=full&steps=false&alternatives=false`. Mantener orden, validar código Ok, geometría LineString, números finitos, rangos, cantidad de tramos, distancia en metros y duración en segundos no negativas. Cero es válido únicamente si lo devuelve un resultado verificado; nunca relleno por fallo. Verificar coordenadas ajustadas a la vía y conservar punto original y snapped separados. Proponer radio máximo inicial de ajuste 100 m configurable y registrado; rechazar NoSegment/exceso, y comprobar también cobertura del destino ajustado. El umbral requiere aprobación y no modifica el destino original.

La cobertura limita puntos operativos, no obliga a que todo tramo vial quede dentro de los polígonos. No recortar geometrías ni conectar segmentos ficticios. Si se requiere confinamiento vial total, será otra restricción y habrá que evaluar un perfil/motor que la soporte.

Guardar geometría detallada del proveedor, metros/segundos con unidades explícitas, tramos, fecha de cálculo, proveedor, perfil y su revisión desplegada, versión de datos OSM cuando el servidor la exponga, hash de entrada, cobertura versión/hash, puntos ajustados y avisos. Si no se expone la versión del grafo, marcarla desconocida y no afirmar reproducibilidad exacta. No reconstruir una ruta histórica consultando un grafo nuevo.

Propuesta inicial de límites: máximo 30 pedidos por recorrido, timeout de solicitud OSRM de 10 s, plazo total de operación de 20 s y máximo una operación de proveedor en curso por instancia. Sin reintentos automáticos del cálculo básico. Son límites conservadores configurables, no capacidad medida. Validar configuración al iniciar sin inutilizar login/pedidos si OSRM no está configurado: solo la generación responde 503. Limitar tamaño de respuesta, limitar JSON/geometría, bloquear redirecciones hacia destinos no aprobados y controlar SSRF en configuración. Secretos solo del servidor; no guardar URL con credenciales ni coordenadas en logs.

Registrar EjecucionCalculo con clave de idempotencia obligatoria por usuario, versión y solicitud. No mantener transacción DB durante llamadas de red. Primero registrar ejecución pendiente; calcular fuera de la transacción; finalmente comprobar versión y huella de pedidos/recursos bajo transacción y persistir alternativa/ruta/paradas/resultado juntos. La huella se recalcula con filas bloqueadas durante ese cierre corto, incluyendo cambios sobre clientes y disponibilidad; sus escritores existentes respetarán los bloqueos de PostgreSQL. Cambios concurrentes invalidan el resultado, sin usar datos obsoletos. Errores conservan la planificación y se registran sin resultados parciales. Duplicado con misma clave/datos devuelve la misma ejecución; clave reutilizada con otros datos da 409.

Primera operación es síncrona y acotada; si el proceso muere, una ejecución sin terminar se marca INTERRUMPIDA al recuperar, sin simular éxito ni reanudar con entradas nuevas. No crear infraestructura de colas ahora. El algoritmo genético posterior necesitará una ejecución controlada con cancelación y presupuestos propios antes de habilitarse; no insertarlo dentro de una petición corta sin esa revisión.

Coordinación propuesta: primer despliegue del cálculo limitado a una instancia backend y una operación de proveedor a la vez; no prometer un límite global multirréplica. EjecucionCalculo registra token propietario y vencimiento de 60 s frente al plazo de operación de 20 s. Publicar resultados exige estado EN_CURSO, token coincidente y vigencia. Recuperación al iniciar y mantenimiento periódico marcan solo ejecuciones vencidas como INTERRUMPIDA mediante actualización condicional; los GET no realizan recuperación ni escrituras. Un proceso tardío no puede publicar después de perder vigencia. Si se requiere desplegar varias instancias, antes de habilitar generación se debe añadir coordinación de cupo en PostgreSQL y probar recuperación entre instancias; no basta con un semáforo en memoria.

## 6. Modelos mínimos propuestos, todavía sin Prisma/SQL generado

| Entidad | Contenido e invariantes |
|---|---|
| Planificacion | UUID, creador, estado PREPARADA, versión actual, fechas. No muta pedidos ni asigna recursos. |
| PlanificacionVersion | UUID, FK planificación, número UNIQUE por planificación, snapshot inmutable de IDs/datos utilizados: pedidos, vehículos, conductores/disponibilidades, origen/final/jornada/atención/criterios, cobertura y hash. No almacenar contraseñas ni datos personales innecesarios. |
| EjecucionCalculo | FK versión, método, estado EN_CURSO/COMPLETADA/FALLIDA/INTERRUMPIDA, actor, idempotencia UNIQUE, entrada/hash, tiempos, error sanitizado, parámetros/procedencia. |
| Alternativa | FK ejecución/versión, número, método, evaluación y restricciones; agrupa una o varias rutas bajo la misma entrada comparable. No llamar alternativa genética a cada respuesta del proveedor. |
| Ruta | Identidad lógica y referencia a versión vigente; no conductor obligatorio. Permite persistir revisiones sin reasignar históricamente una identidad diferente. |
| RutaVersion | FK ruta y alternativa, número UNIQUE por ruta, vehículo candidato, origen/final, geometría JSONB, métricas verificadas, procedencia, estado de validación/avisos y hash. Inmutable; cada nueva generación crea otra alternativa y nuevas rutas con su versión 1, sin sobreescribir versiones consultadas/asignadas. |
| ParadaRuta | FK RutaVersion y Pedido, secuencia UNIQUE por versión, pedido UNIQUE por versión, snapshot mínimo de dirección/punto/ventana y tiempos estimados cuando evaluables. Pedido y parada permanecen separados. |

Las referencias del snapshot se verifican contra entidades reales al preparar y publicar; no se tratan como autoridad proporcionada por el cliente. Las relaciones normalizadas RutaVersion/ParadaRuta usan FK y onDelete Restrict. Las selecciones históricas de recursos en JSON no permiten reservar ni demostrar disponibilidad actual. Antes de una asignación futura se resuelven siempre los IDs vivos y se comprueban todos los invariantes de negocio.

Identidad en este incremento: cada alternativa nueva crea sus propias Ruta lógicas, identificadas por UNIQUE(alternativa_id, indice_recorrido), con RutaVersion número 1. No reutilizar rutas de otra alternativa ni cambiar su versión vigente al solicitar una generación nueva. Ruta pertenece a una alternativa y RutaVersion referencia esa misma alternativa; verificar ese invariante transaccionalmente. GET /routes lista todas esas propuestas según filtro de alternativa y devuelve el identificador de versión exacta. El endpoint de historial funciona aunque inicialmente solo exista la versión 1. No se habilita todavía una operación que cree revisión 2: cualquier revisión futura exige contrato específico y jamás sustituirá la versión de una asignación existente. El sistema no selecciona automáticamente una nueva alternativa como confirmada.

RutaVersion llevará un identificador de vehículo candidato real para el incremento inicial de un vehículo. No crea un compromiso operativo con ese vehículo; cualquier cambio requiere otra evaluación. Métricas de combustible/CO2 quedan ausentes hasta definir y verificar las unidades de los factores y método. No añadir defaults ambientales de cero.

`AsignacionRuta` será un modelo posterior US-015: referencia a RutaVersion exacta, Conductor, vehículo real, periodo, actor, estado y control de concurrencia. `Entrega`/eventos pertenecen a US-017 y se relacionarán con asignación/parada, sin reutilizar el estado de la parada de planificación como resultado de entrega. No crear estas dos entidades en el primer incremento solo para mostrar pantallas.

Cambios deliberados respecto al modelo objetivo histórico: geometría persistida, ruta sin conductor obligatorio y versiones/alternativas explícitas. Se documentarán en un addendum aprobado, sin editar retrospectivamente documentos históricos. No duplicar Usuario/Conductor/Pedido/DisponibilidadConductor ni introducir PostGIS como requisito nuevo.

## 7. API propuesta y permisos

Administrador y Operador realizan preparación, cálculo y consulta. JwtAuthGuard, guard por rol y RequestOriginGuard existentes; DTO whitelist, cookies HttpOnly y JWT intactos. Conductor y Auditor sin nuevos permisos administrativos. Lecturas no-store y selección mínima de datos. Un identificador adivinable no concede acceso.

| Operación | Contrato propuesto |
|---|---|
| GET `/planning/candidates` | Jornada obligatoria, paginación, pedidos PENDIENTE y recursos elegibles con motivos de exclusión no sensibles; no promete reserva. |
| POST `/planning` | IDs seleccionados, origen, modo final, inicio/límite, orden confirmado, atención por pedido; crea versión preparada, no cambia pedidos. |
| GET `/planning/:id` | Selección/versiones/ejecuciones disponibles; permisos administrativos. |
| PATCH `/planning/:id` | expected_version obligatoria; modificar selección solo mientras no exista alternativa completada ni cálculo EN_CURSO, según la política detallada debajo. Crea versión, no reescribe snapshot. |
| POST `/planning/:id/calculations` | expected_version, método SECUENCIAL_OSRM, Idempotency-Key; servidor obtiene puntos de snapshot y revalida. Devuelve 201 con ejecución/alternativa/ruta verificadas. No acepta métricas, geometría ni URL del proveedor del cliente. |
| GET `/planning/:id/calculations/:executionId` | Estado de una ejecución del mismo planning; respeta padre/hijo, no filtra otra planificación. |
| GET `/routes` | page/pageSize, planificación/alternativa, método, validación, rango de creación; búsqueda por UUID o etiqueta de planificación. Orden estable, total completo. |
| GET `/routes/:id` | Versión vigente, paradas/pedidos y datos disponibles. No calcula ni cambia nada. |
| GET `/routes/:id/versions/:version` | Historial exacto, sin sustituirlo por geometría recalculada. |

Edición de planificación: se permite mientras no exista ninguna alternativa completada, incluso después de FALLIDA/INTERRUMPIDA. Una ejecución EN_CURSO bloquea la edición con 409 hasta terminar/vencer; no se cancela por un GET. Una alternativa ya persistida bloquea PATCH en el primer incremento; para cambiar entradas se prepara otra planificación explícita. Las ejecuciones fallidas permanecen enlazadas a la versión que intentaron procesar. Se puede reintentar la misma versión con clave nueva cuando sus entradas siguen vigentes; si cambiaron los datos, crear una nueva versión preparada antes de calcular. Así un error de proveedor no deja la selección bloqueada permanentemente.

201: primer cálculo terminado; repetición terminada idéntica devuelve 200; 202 solo si esa misma ejecución sigue en curso, con URL del estado; no crear trabajo duplicado. Aplicar límite por usuario y presupuesto global, independientes del número de compañeros.

Errores: 400 DTO/precisión/selección inválida; 401 sin sesión; 403 rol/origen no autorizado; 404 recurso inexistente o ruta no visible para el contexto; 409 versión/recursos/idempotencia obsoletos o estado incompatible; 422 punto no conectable/NoRoute/orden no calculable válido sintácticamente; 429 límite; 502 proveedor con respuesta inválida; 503 proveedor/cobertura/configuración/tablas no disponibles; 504 timeout. Todos con código de error estable, mensaje seguro y execution_id cuando exista. No devolver respuesta completa del proveedor con potencial información interna.

Un conjunto vacío confirmado es 200, items=[], total=0. Falta de tablas/recursos de infraestructura es 503, no un vacío. Una ruta históricamente registrada conserva su información aun si cambió cobertura; mostrar versión y advertencias actuales. Una falta de cobertura bloquea nuevas preparaciones/cálculos, no obliga a borrar resultados anteriores.

## 8. US-011/012 y evolución hacia US-014 a US-017

OSRM solo calcula recorridos para un orden. US-011 necesita varias soluciones candidatas válidas: en un incremento posterior se generarán órdenes distintos por estrategias documentadas, se deduplicarán y se calcularán con el mismo proveedor/entrada y presupuesto. Si solo existe una alternativa se informa; duplicarla o invocar alternatives=true no acredita comparación logística ni asegura varias soluciones.

Algoritmo genético propuesto: cromosoma = permutación completa de pedidos y, cuando se apruebe multivehículo, delimitación de recorridos/vehículos. Entradas inmutables = versión preparada + matriz vial dirigida de distancias/duraciones + recursos y parámetros. No asumir simetría de vías ni sustituir arcos inaccesibles por distancias rectas o velocidades supuestas.

Matriz OSRM Table sin fallback_speed; celdas null son arcos no disponibles. Cachear por perfil/revisión de grafo/entrada, con presupuesto de tamaño, fuera del bucle genético. Evaluar candidatos localmente; solo los finalistas viables obtienen geometría detallada Route y se reevalúan con sus métricas finales. Conservar matriz/procedencia/hash que permita auditar el cálculo, no solo una suma irreproducible.

Objetivos mínimos RN-010: distancia, duración operativa, combustible, CO2 y penalización de ventanas. Antes de habilitar GA, aprobar función/ponderaciones y normalización, unidades del factor ambiental, parámetros de población/generaciones/mutación/cruce/semilla, tiempos de atención, esperas/descansos y política de restricciones blandas. No inventar valores para cumplir un objetivo faltante. Si una unidad o parámetro requerido no está definido, resultado NO_EVALUABLE y no US-012 completada.

Restricciones duras: cubrir cada pedido una vez, capacidades evaluables, puntos alcanzables/cobertura, recursos activos y disponibles, jornada y asignaciones no solapadas. Proponer ventanas duras para confirmación, con violaciones visibles/penalizadas en candidatos. No prometer óptimo global: distinguir CALCULADA_OSRM, EVALUADA y OPTIMIZADA_AG con versión/semilla/función y comparación contra secuencia base de la misma entrada. Conservar mejor solución válida conocida si se cancela/interrumpe, identificando estado de ejecución.

US-014 compara solo alternativas de la misma versión de planificación y contexto de evaluación; no compara kilómetros de diferentes pedidos como supuesto ahorro. US-020 (confirmar ruta) es dependencia documental adicional antes de ejecutar/asignar una solución confirmable y debe coordinarse, no implementarse silenciosamente dentro de US-013.

US-015 validará nuevamente ruta confirmable, cuenta/ficha del conductor, disponibilidad que cubra todo el periodo, vehículo y pedidos vivos, y conflictos en transacción. Juan no está disponible por el solo hecho de estar ACTIVO. Una planificación preparada no lo reserva.

US-016 utilizará la identidad resuelta por DriverProfileService para filtrar asignaciones en SQL; no aceptará conductor_id arbitrario ni reutilizará los GET administrativos abiertos al Conductor. Sin asignaciones: mensaje veraz de ausencia. US-017 verificará pertenencia asignación/parada y transiciones permitidas; no expondrá al Conductor el PATCH genérico de estados de pedidos.

## 9. Interfaz de US-013

Listado `/rutas` y detalle `/rutas/:id`, con entrada al menú solo para Administrador/Operador. Mapa Leaflet de solo lectura, geometría registrada, origen y paradas numeradas; sin arrastre/clic que cambie destinos. Reutilizar carga de cobertura/teselas/estilos donde sea útil, sin modificar DeliveryMap de registro para convertirlo en visor de recorridos.

Mostrar orden/pedidos, versión, método, vehículo candidato, métricas con unidades y etiqueta de estimación, procedencia y restricciones no evaluables. Si geometría no está disponible, mostrar error de recorrido y datos disponibles; no dibujar una línea recta sustituta. Si fallan teselas, conservar tabla y ruta cuando sea posible. Cambio actual de pedido cancelado/cliente/recursos se muestra como advertencia de desactualización sin modificar snapshot ni regenerar.

Carga, reintento, vacío y 404 distintos. GET no escribe ni consulta OSRM. Mapas accesibles mediante tabla equivalente, controles de zoom/teclado, leyenda y fitBounds sobre geometría. Anchuras 390/768/1366/1440 y límites de breakpoints existentes. No habilitar botones de asignación, comparación o entregas que todavía no tengan backend verificado. Mantener panel de Juan y gestión de cuentas.

## 10. Disponibilidad, costos, privacidad y licencias

Documentación consultada 2026-10-29:

- API oficial: https://project-osrm.org/docs/v5.24.0/api/ — Route sigue el orden recibido, devuelve geometría y métricas; alternativas no garantizadas; Table puede devolver null. El API define coordenadas lon,lat.
- Política oficial enlazada por OSRM: https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy
- Servidor demo: https://routing.openstreetmap.de/about.html — publica máximo una solicitud/segundo, prohíbe uso intensivo y advierte que las solicitudes quedan en logs. No elegirlo como infraestructura operativa ni para matrices/GA. La revisión de una política no implica autorización para enviar datos de clientes.

Recomendación: OSRM privado, grafo OSM autorizado y sin GeoJSON INEI dentro de ese servicio. El backend conserva la cobertura privada para validar. No ejecutar aprovisionamiento, descargas grandes o modificaciones Docker en esta fase. Si se aprueba un remoto, enviar solo coordenadas, nunca nombres/correos/DNI/pedido_id, usar TLS y revisar proveedor/retención. Las coordenadas siguen siendo información potencialmente sensible.

No se da una cotización ficticia: los costos de autohospedado son CPU/RAM/disco de preparación y servicio, actualizaciones del grafo, transferencia, copias/operación y observabilidad; medir un extracto regional antes de dimensionar. Un proveedor gestionado puede añadir cuota/consumo y condiciones contractuales. No asumir coste cero ni SLA del demo. La caída de OSRM bloquea nuevos cálculos, no login, pedidos, cuentas ni consulta de resultados persistidos.

Conservar atribución OSM y verificar condiciones/licencias aplicables del software, extracto y proveedor antes de desplegar/publicar. La licencia de OSRM/OSM no acredita permiso para redistribuir derivados del INEI. No publicar recursos, coordenadas de clientes en evidencias ni imágenes que incluyan geodata privada. Sin cambios a .env, credenciales ni cuentas en esta fase.

## 11. Archivos previstos tras aprobación

No creados todavía, salvo este diseño:

- `src/backend/prisma/schema.prisma` y futura migración aditiva revisada; no aplicar sin autorización específica y respaldo verificable.
- `src/backend/src/planning/planning.module.ts`, `planning.controller.ts`, `planning.service.ts`, `planning.guard.ts`, `dto/planning.dto.ts`.
- `src/backend/src/routing/routing.module.ts`, `routing-provider.ts`, `osrm.adapter.ts`, `routing-calculations.service.ts`, `dto/routing-result.dto.ts`.
- `src/backend/src/routes/routes.module.ts`, `routes.controller.ts`, `routes.service.ts`, `routes.guard.ts`, `dto/route-query.dto.ts`, `dto/route-read.dto.ts`.
- Registro en `src/backend/src/app.module.ts` y validación opcional OSRM en `src/backend/src/common/environment.ts`; solo añadir configuración pública de ejemplo cuando se apruebe, no editar .env existente.
- Reutilizar `src/backend/src/coverage/coverage.service.ts`; separar sus mensajes por contexto si se requiere, sin cambiar polígonos/reglas/hash. Reutilizar Prisma, roles/guards e identidad de conductor.
- `src/frontend/src/pages/PlanningPage.tsx`, `RoutesPage.tsx`, `RouteDetailPage.tsx`; `features/routes/RouteMap.tsx`; `services/planning-api.ts`, `routes-api.ts`; `types/planning.ts`, `routes.ts`.
- Navegación en `src/frontend/src/routes/AppRoutes.tsx` y `layouts/AppLayout.tsx`; guard/layout de roles para rutas; estilos locales en app.css. Sin alterar páginas de cuentas, login, pedidos o Juan fuera de regresiones necesarias.
- Pruebas backend junto a cada módulo, `src/backend/test/routing.integration.ts`, pruebas React y `src/frontend/e2e/routes.spec.ts` con allowlist explícita para API simulada.

## 12. Aceptación propuesta y estrategia SDD/TDD

Los criterios originales de sección 1 se mantienen; los siguientes refinamientos necesitan aprobación. Cada escenario tendrá requisito/ID de prueba y contrato de entrada/salida antes de implementar. RED → GREEN → refactor; no sustituir pruebas de dominio por mocks que devuelvan éxito incondicional.

| ID | Escenario verificable |
|---|---|
| P-01 | Preparación válida conserva snapshot de pedidos PENDIENTE y recursos reales; no cambia sus filas. |
| P-02 | IDs inválidos/duplicados, sin vehículo/conductor, cobertura ausente, origen/final no confirmados, ventanas/datos inválidos: rechazo sin planificación parcial. |
| P-03 | Modificar antes de generar exige versión; edición concurrente y recursos cambiados: 409, sin sobreescritura. |
| R-01 | Orden confirmado origina llamada OSRM lon,lat correcta y conserva secuencia; ruta abierta/retorno producen puntos finales correctos. |
| R-02 | Resultado válido persiste geometría, metros/segundos, tramos y procedencia; todos los pedidos aparecen una vez. |
| R-03 | NoRoute/NoSegment, snapping excesivo, JSON/geometría/unidades inválidos, timeout/caída: error correcto; ningún recorrido parcial o dato inventado. |
| R-04 | Falla de persistencia, conflicto de versión y dos solicitudes concurrentes: atomicidad, idempotencia y ningún duplicado/huérfano. |
| C-01 | GET listado/detalle/historial no llama al proveedor ni escribe; paginación y búsqueda con total completo. |
| C-02 | 400/401/403/404/503 diferenciados, roles y origen; Conductor/Auditor no acceden por IDs adivinados. |
| C-03 | Mapas/tablas responsive y accesibles; sin geometría no se dibuja sustituto; fallos de carga no se presentan como cero rutas. |
| G-01 | Futuro GA: permutaciones, matriz dirigida/null, capacidades, atención/esperas/ventanas, disponibilidad y unidades; semilla reproducible y mejor válido conservado al interrumpir. |
| G-02 | Sin función/objetivos verificables, no etiqueta OPTIMIZADA_AG; Route solo no cumple US-012. |
| F-01 | Regresión de autenticación, Juan/vínculo/cuenta/hash, conductores, disponibilidad, pedidos y cobertura. |

Unitarias del adaptador con respuestas sintéticas propias y claramente identificadas; HTTP con proveedor simulado para casos de error. Integración real Prisma/PostgreSQL únicamente en base/esquema aislado validado, con respaldo previo de desarrollo y comparación de datos públicos; ninguna escritura en public. Geometrías sintéticas exclusivamente de prueba, nunca como fallback de producción.

Prueba real de OSRM: después de aprobar servidor y entorno, usar puntos de prueba públicos no personales autorizados; registrar petición/resultados/red y versión, sin crear rutas de clientes reales. Si no hay proveedor disponible, informar integración real NO EJECUTADA, sin convertir el mock en evidencia del servicio. Las rutas de prueba persistidas solo en esquema aislado.

E2E mock: preparar/calcular/consultar, errores/reintento, permisos, paradas y responsive; interceptar todas las mutaciones. Luego tipos/lint/unitarias/integración/build backend/frontend, diff --check y comprobación de publicación geográfica. Pruebas Docker o entorno real solo en la fase autorizada y sin operaciones destructivas. En esta fase de diseño no se ejecutaron suites ni builds y no se reutilizan resultados anteriores como pruebas de estas capacidades nuevas.

## 13. Secuencia y aprobaciones

1. Aprobar este contrato y resolver origen operativo, final/atención, ventanas y proveedor. Confirmar asignación de Sprint con el equipo.
2. Preparar pruebas y borrador de migración aditiva/contratos. Revisar SQL sin aplicarlo; respaldo y autorización específica antes de cualquier aplicación al entorno elegido.
3. US-010 mínimo y cálculo secuencial OSRM, persistencia y errores; después consulta US-013 sobre ese resultado. No cerrar US-011/012 por este incremento.
4. Generación de múltiples alternativas e integración genética con evaluación verificable y presupuestos aprobados; US-014 y US-020 coordinadas.
5. US-015, luego US-016/017 con autorización por pertenencia, concurrencia y pruebas separadas. Solo entonces Juan verá sus rutas reales asignadas.

No hay commit, push, merge, cambio de rama, modificaciones de Docker/volúmenes ni datos reales en esta fase. Se conservaron los cambios locales existentes. El mensaje del usuario termina truncado en «No alterar autentic»; se mantiene la restricción de no alterar autenticación y se solicita el resto solo si contiene condiciones adicionales.

Revisión independiente de diseño: identificó ambigüedades sobre vehículo único, identidad de rutas entre alternativas, recuperación de ejecuciones y edición tras fallo. Se resolvieron explícitamente en secciones 3, 5, 6 y 7. Son decisiones técnicas propuestas para aprobación junto al documento, no capacidades ya implementadas.

## Siguiente documento / Siguiente trabajo recomendado

Revisar/aprobar el diseño y sus decisiones operativas. Una vez aprobado, preparar el plan ejecutable y pruebas RED del primer incremento, incluyendo SQL aditivo solo para revisión; cualquier aplicación de migración necesita autorización específica adicional.
