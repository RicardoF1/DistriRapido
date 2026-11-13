# Correcciones del incremento de rutas y preparación de infraestructura

Versión documental: V_1_1_0. Fecha: 2026-10-29, America/Lima. Referencias: diseño aprobado de planificación/OSRM y `04 Auditoría del incremento parcial de rutas V_1_1_0.md`. Estado: código corregido y verificado; habilitación en desarrollo y recorrido OSRM real pendientes de autorización/infraestructura.

## 1. Alcance y resultados

Se resolvieron los defectos funcionales señalados en la auditoría sin implementar US-014/015/016/017 ni algoritmo genético. El cálculo sigue siendo secuencial OSRM; no se presenta como optimización. No se mezcló la etapa 2 de restablecimiento de contraseñas.

| Pendiente | Corrección |
|---|---|
| Response consumida en el mock | Cada fetch de la prueba recibe una Response nueva. Se mantienen las aserciones sobre versión, idempotencia y ausencia de métricas impuestas por cliente. |
| Aislamiento incompatible con CI | Guard probado que admite base explícita terminada en _test, como el workflow actual, o schema distrirapido_*_test. Rechaza public de desarrollo y destinos inválidos. No cambia el workflow para desactivar pruebas. |
| Versión cero/negativa/no entera | Rechazo 400 antes de consultar la base; una versión inválida ya no devuelve la versión más reciente. |
| Draft tras EN_CURSO → consulta COMPLETADA | La consulta de estado libera el draft igual que un POST completado. La siguiente preparación modificada crea otra planificación, conservando la anterior. |
| Advertencias históricas incompletas | Compara peso, volumen, ventanas, estado/dirección/coordenadas del cliente y pedido; verifica la huella completa de fuentes y disponibilidad/vehículo. Informa cambios sin regenerar ni modificar la versión guardada. No devuelve el snapshot interno en el detalle de ruta. |
| Mapa vacío silencioso por geometría corrupta | Render y efecto usan la misma validación de LineString, coordenadas finitas y rangos. Geometría corrupta produce error visible y no dibuja una línea sustitutiva. |
| Tiempo total de cálculo | Presupuesto desde la entrada del cálculo para lecturas de idempotencia, registro, proveedor y publicación. Transacciones usan el tiempo restante, statement_timeout y espera de pool acotada. Se revisa nuevamente antes de cerrar. |
| Fallo después de commit mal informado | La proyección pública de resultado se obtiene dentro de la transacción de publicación. No hay lectura posterior cuyo fallo pueda afirmar falsamente que no se publicó una ruta ya confirmada. |
| Estado de error sin retener respuesta | Mantenimiento FALLIDA con transacción de 1000 ms/espera de 200 ms, independiente del plazo HTTP y sin mantener busy. Si falla, recuperación de lease vencido; nunca publica resultados. |
| Configuración/procedencia OSRM | URL privada y origen explícitamente autorizado, demos conocidos rechazados, TLS para remoto, límites validados, perfil/revisión y parámetros guardados en procedencia. Configuración inválida inhabilita cálculo, no autenticación/pedidos. |

No hay reintentos automáticos de OSRM. Misma clave = misma ejecución, sin duplicación ni extensión de su cálculo. Un nuevo intento explícito con otra clave es una ejecución nueva con presupuesto propio. El timeout no implica que se sumen sucesivos intentos manuales como una única ejecución ilimitada.

Las advertencias FUENTES_DESACTUALIZADAS y RECURSOS_O_PEDIDOS_NO_DISPONIBLES son diagnósticos de los recursos actuales; no alteran los datos de ruta históricos ni implican asignación/confirmación vigente. Los GET no consultan OSRM ni crean rutas.

## 2. TDD, revisión y fallos resueltos

Se añadieron regresiones antes de corregir y se observaron los fallos de versión cero, campos históricos omitidos, draft retenido, geometría corrupta y publicación fuera de plazo. También se observó el fallo original Body has already been read. La compatibilidad CI y configuración privada se cubrieron mediante pruebas RED antes de añadir los helpers.

La revisión independiente encontró consultas sin presupuesto y una lectura de confirmación posterior al commit. Se corrigieron, añadieron pruebas de vencimiento en la lectura inicial y fallo de confirmación, y se verificaron nuevamente. La revisión posterior no dejó defectos concretos adicionales en esos cambios.

Primera regresión E2E completa: 86 aprobadas y una fallida. El test del fondo del login no interceptaba /auth/me y dependía del CORS del backend real desde el preview. Se corrigió el arnés para simular sesión anónima; se conservan las comprobaciones de imagen existente, HTTP 200, content-type y tamaño. La segunda ejecución completa aprobó las 87. No se ocultó ni eliminó el fallo.

## 3. Verificaciones ejecutadas

| Comando/verificación | Resultado final |
|---|---|
| Backend npm run typecheck | Aprobado |
| Backend npm run lint | Aprobado |
| Backend npm run test:coverage | **426 aprobadas, 37 suites**; statements 91.35%, branches 83.15%, functions 90.03%, lines 94.42% |
| Backend npm run build | Aprobado |
| Frontend npm run typecheck | Aprobado |
| Frontend npm run lint | Aprobado |
| Frontend npm run test:coverage -- --pool=forks --maxWorkers=1 | **289 aprobadas, 31 archivos**; statements 87.94%, branches 82.48%, functions 85.11%, lines 93.42% |
| Frontend npm run build | Aprobado; advertencia de bundle 523.76 kB mayor de 500 kB |
| Backend npm run test:integration | **106 aprobadas, 6 suites** contra PostgreSQL aislado |
| Frontend npm run test:e2e -- --config playwright.mock.config.ts | **87 aprobadas**, API simulada, regresión de autenticación, usuarios/cuentas, conductores, disponibilidad, pedidos, cobertura y rutas |
| Prisma validate | Schema válido |
| Prisma migrate status en public | Exit 1 esperado: una migración pendiente, no aplicada |
| Compose base + OSRM y base + migraciones, config --quiet | Sintaxis aprobada; no pull/build/up/migración. Se usaron parámetros temporales de validación de imagen/carpeta, no una imagen/grafo operativo. |
| Respaldo pg_restore --list y decodificación a /dev/null | Aprobados, sin restauración |
| Login real de Juan | Aprobado con PostgreSQL/Docker existentes, incluyendo restauración, HttpOnly, denegación de administración y logout; cuatro anchuras |
| Integridad datos públicos | Ocho tablas con hashes/conteos idénticos a antes del incremento |
| git diff --check | Sin errores; aviso previo LF/CRLF de DeliveryMap.test.tsx |
| check-geodata-publication.cjs | Índice sin derivados privados |

Los umbrales de cobertura no se redujeron. No se actualizaron dependencias ni se deshabilitaron auditorías. GitHub Actions remoto no se ejecutó porque no hubo commit/push; la compatibilidad de su URL de pruebas se verificó localmente, no se presenta como ejecución remota aprobada.

Las integraciones usan Prisma/PostgreSQL reales en `distrirapido_routing_20261029_test`, con proveedor y cobertura sintéticos inyectados exclusivamente en pruebas. Comprueban rollback tras INSERT real si vence el presupuesto, persistencia/historial, confirmación transaccional, idempotencia/concurrencia y cambios de pedidos/vehículo/disponibilidad. No acreditan un cálculo contra OSRM real.

## 4. Verificación visual

Se ejecutaron vistas 390, 768, 1366 y 1440 px. El fixture del visor contiene giros; la prueba comprueba el trazado SVG completo, paradas, controles y ausencia de overflow horizontal. Se inspeccionaron las capturas de 390 y 1440. Otra prueba verifica que geometría inválida muestre error sin polyline.

Capturas locales, no destinadas a publicación automática:

- `.local/routing-corrections-visual/route-390.png`
- `.local/routing-corrections-visual/route-768.png`
- `.local/routing-corrections-visual/route-1366.png`
- `.local/routing-corrections-visual/route-1440.png`

Estas capturas usan datos sintéticos y bloquean teselas para no depender de red externa; el aviso de teselas es intencional. Demuestran que Leaflet representa la geometría recibida, no que ese fixture sea una ruta vial real de producción. La comprobación de calles reales continúa pendiente de OSRM privado aprovisionado.

## 5. Prisma, respaldo y datos protegidos

La migración `202610290001_planificacion_rutas` y schema.prisma **no cambiaron durante esta fase**. SQL revisado: siete tablas nuevas, índices/UNIQUE y FK RESTRICT, sin DELETE/TRUNCATE/operación de sustitución de datos. SHA-256 SQL: `0e58dd51d0217d1074ca75743a6cb57ad233fafef2ec5632d3dbd92dac8f722e`.

Desarrollo conserva seis migraciones aplicadas; la de rutas sigue pendiente y no existe public.rutas. No se aplicó ninguna migración, tampoco nueva en el esquema de pruebas: se usó el que ya estaba aprovisionado.

Public mantiene 4 usuarios, 2 conductores, 2 pedidos, 2 clientes, 4 roles, 0 vehículos y 0 disponibilidades. Se verificaron hashes del contenido de las ocho tablas, incluidos usuarios/credenciales/vínculos, antes y después. No se crearon datos públicos para las demostraciones.

Se conservaron y verificaron por hash .env, credencial DPAPI de Juan, LoginForm, DriverAccessPage y DriverProfileService. No se modificaron autenticación, contraseñas ni vínculos de Juan. Las pruebas de roles usan contextos/cookie jars distintos; pestañas del mismo perfil comparten cookies. No se implementan sesiones independientes por pestaña.

Respaldo adicional de trabajo anterior: `.local/current-routing-corrections-backup.txt` señala la carpeta con **206 archivos** copiados y verificados, manifest y patch. El dump previo `.local/routing-increment-20261029-175242/before-routing.dump` tiene 57137 bytes y SHA-256 `90c500d5b6c87b957b6ebb9d3de280450218c8e9add84f3579493aa4b2ff6d6f`; listado y decodificación aprobados. Antes de una migración futura se requerirá respaldo actualizado y autorización específica.

## 6. Docker y OSRM

Los tres contenedores originales siguen activos; PostgreSQL healthy. No se reconstruyeron ni recrearon y no se eliminaron volúmenes. El frontend/backend Docker actuales siguen siendo la entrega anterior: no afirmar que la versión nueva esté desplegada allí.

Se prepararon:

- Variables OSRM opcionales en docker-compose.yml, sin cambiar PostgreSQL/credenciales/puertos existentes.
- `docker-compose.osrm.yml`: servicio privado opt-in, imagen fijada por operador, carpeta MLD existente read-only y puerto loopback 5000; no descarga ni preprocesa automáticamente.
- `infra/osrm/.env.example`: variables públicas de ejemplo, no reemplaza .env.
- `infra/osrm/README.md`: fuente vial, hashes/procedencia, comandos Windows de preparación futura, aplicación/reversión y prueba manual.

No hay imagen ni grafo OSRM aprovisionados y no se llamó a un servidor público. Espacio libre observado: aproximadamente 3.18 GB en C:, insuficiente para asumir sin medición que cabe un proceso nacional completo. No se borró ningún archivo para liberar espacio. CPU/RAM/disco y actualizaciones del grafo deben dimensionarse antes de descargar/preprocesar.

## 7. Habilitación y prueba manual pendientes

La guía completa está en `infra/osrm/README.md`. Orden propuesto, **no ejecutado**:

1. Revisar SQL, único pendiente y respaldo actualizado; autorizar específicamente su aplicación.
2. Autorizar/provisionar OSRM privado con PBF OSM y perfil/imagen/hashes verificados; conservar INEI separado y privado.
3. Disponer de un vehículo real DISPONIBLE, conductor ACTIVO con disponibilidad que cubra la jornada y pedidos PENDIENTE con destinos/ventanas válidos. No crear recursos ni alterar pedidos sin autorización.
4. Preparar/etiquetar imágenes anteriores para rollback, construir y actualizar solo aplicaciones/OSRM. PostgreSQL/volúmenes se conservan. La migración se ejecutaría por el servicio maintenance explícito, nunca al iniciar normalmente backend.
5. En http://localhost:5173, Administrador u Operador abre Preparar recorrido: jornada, selección de recursos/pedidos, origen, atención/orden y modalidad de regreso. Confirmar las tres decisiones, preparar y calcular.
6. Abrir ruta persistida, revisar trazado, paradas, métricas/procedencia y advertencias; recargar/listar/historial no debe recalcular ni escribir. Probar roles en perfiles separados.

Reversión ordinaria: volver a imágenes anteriores de frontend/backend conservando tablas y datos aditivos. No borrar tablas ni falsificar _prisma_migrations. Si se requiere restaurar datos, probar el dump en destino aislado y solicitar autorización separada; nunca reemplazar desarrollo automáticamente.

## 8. Riesgos y límites pendientes

- Falta prueba con OSRM real y habilitación en desarrollo; no puede declararse US-013 aceptada de extremo a extremo ni cerrada en Jira.
- Migración y recursos operativos requieren autorización específica. Que Juan esté ACTIVO no implica disponibilidad.
- El despliegue inicial de cálculo sigue siendo mono-instancia. Se conserva throttling por IP y cupo local; antes de exposición amplia o múltiples réplicas deben resolverse cuotas por usuario y coordinación global. No se presenta esa ampliación como implementada.
- La calidad vial y duraciones son estimaciones dependientes del grafo/perfil; no equivalen a tráfico en tiempo real, optimización genética o rutas asignadas.
- Se mantiene advertencia de tamaño de bundle y la deuda de dependencias no se aborda con actualizaciones masivas en este cambio. No se afirma un npm audit remoto nuevo aprobado.
- Las condiciones de redistribución INEI siguen sin aclararse; no publicar sus derivados ni imágenes que los incluyan.

## 9. Archivos de esta fase y Git

Los siguientes archivos se añadieron o cambiaron respecto al respaldo de inicio de estas correcciones; el diff general conserva además trabajos anteriores:

- `docker-compose.yml`, `docker-compose.osrm.yml`.
- `src/backend/src/common/test-database.ts`, `test-database.spec.ts`.
- `src/backend/src/planning/planning.module.ts`, `planning.service.ts`, `planning.service.spec.ts`.
- `src/backend/src/routes/routes.service.ts`, `routes.service.spec.ts`.
- `src/backend/src/routing/osrm.adapter.ts`, `routing-config.ts`, `routing-config.spec.ts`.
- `src/backend/test/routing.integration.ts`.
- `src/frontend/src/services/routing-api.test.ts`.
- `src/frontend/src/pages/PlanningPage.tsx`, `PlanningPage.test.tsx`.
- `src/frontend/src/features/routes/RouteMap.tsx`, `RouteMap.test.tsx`.
- `src/frontend/e2e/routes.spec.ts`, `drivers.spec.ts`.
- `infra/osrm/.env.example`, `infra/osrm/README.md`.
- `docs/otros/superpowers/plans/2026-10-29-routing-corrections.md` y este informe.

Rama `main`; HEAD `128af98b7021655c39160a92121087023ed3f931` conservado. Sin staging, commits, push ni merge. No se eliminaron carpetas antiguas, copias de trabajo, recursos privados o datos existentes. El preview temporal de pruebas se cerró.

## Siguiente documento / Siguiente trabajo recomendado

Revisar estos resultados y la guía de infraestructura. Autorizar por separado la migración y los recursos privados/operativos necesarios para una prueba real de US-013. Detener la implementación aquí; mantener la etapa 2 de contraseñas y US-014/015/016/017 como trabajos independientes todavía no ejecutados.

[← Volver al README principal](../../../README.md)
