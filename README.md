# DistriRapido

Sistema de Gestión de Distribución y Entregas Rápidas (PFA).

## Fase 02: Planificación del Proyecto

En esta fase se realiza la transformación ágil, configuración de herramientas ALM, gestión de riesgos y presupuesto del proyecto.

- [01 Transformando a ágil V_1_0_0](./docs/02%20Planificación/01%20Transformando%20a%20ágil%20V_1_0_0.md)
- [02 Artefactos Jira V_1_0_0](./docs/02%20Planificación/02%20Artefactos%20Jira%20V_1_0_0.md)
- [03 Registro de riesgos V_1_0_0](./docs/02%20Planificación/03%20Registro%20de%20riesgos%20V_1_0_0.md)
- [04 Presupuesto del proyecto V_1_0_0](./docs/02%20Planificación/04%20Presupuesto%20del%20proyecto%20V_1_0_0.md)

## Fase 03: Implementación — Sprint 1

- [01 Informe de estado del proyecto V_1_0_0](./docs/03%20Implementación/01%20Informe%20de%20estado%20del%20proyecto%20V_1_0_0.md)
- [02 Registro de Impedimentos V_1_0_0](./docs/03%20Implementación/02%20Registro%20de%20Impedimentos%20V_1_0_0.md)
- [03 Revisión del Sprint V_1_0_0](./docs/03%20Implementación/03%20Revisión%20del%20Sprint%20V_1_0_0.md)
- [04 Retrospectiva del Sprint V_1_0_0](./docs/03%20Implementación/04%20Retrospectiva%20del%20Sprint%20V_1_0_0.md)

## Estructura de implementación

```text
prototypes/  → referencias visuales de Stitch
src/frontend/ → aplicación React + TypeScript
src/backend/ → API NestJS + TypeScript
docs/        → documentación académica del proyecto
```

## Incremento US-001

Implementados infraestructura y login email/contraseña. Instrucciones completas, decisiones y verificación en [US-001.md](docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-001.md).

Inicio local: copia `.env.example` a `.env`, configura secretos propios y ejecuta `docker compose up -d postgres`. Sigue después los README de backend y frontend. Para el conjunto en contenedores, aprovisiona primero la cobertura privada y sigue el procedimiento explícito de migraciones documentado más abajo; el arranque habitual ya no aplica migraciones automáticamente.

## Incremento US-002

Persistencia mediante cookie HttpOnly, restauración con `/auth/me` y cierre explícito mediante `/auth/logout`. PostgreSQL de DistriRapido conserva el puerto configurado 5433. Decisiones, pruebas y pasos manuales en [US-002.md](docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-002.md). `start:dev` observa los cambios en `src/backend/src` y reinicia el backend automáticamente; los cambios en `.env` requieren reinicio manual.

## Incremento US-003

RF-002 → US-003: listado, creación y edición de cuentas, con asignación de roles de la línea base y estados documentados; acceso exclusivo de Administrador. Sin nuevas migraciones. Informe y pasos manuales en [US-003.md](docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-003.md). La cookie anterior se migra al comprobar sesión para permitir los endpoints de administración.

## Incremento US-004

RF-003 → US-004: registrar un pedido con sus datos documentados y el cliente/destino mínimo relacionado, dentro de una transacción. Acceso de Administrador y Operador / Técnico por decisión explícita del incremento; sin equivalencia con Planificador. El registro utiliza POST /orders y /pedidos/nuevo; la consulta posterior corresponde a US-005. Nueva migración aditiva, sin bootstrap. Informe, discrepancias documentales y prueba manual en [US-004.md](docs/03%20Implementación/evidencias-tecnicas/Sprint-1/US-004.md).

Estado del Sprint 1: US-001 a US-005 completadas según confirmación del equipo. El código incorpora registro y consulta de pedidos; los informes de incrementos anteriores conservan su contexto histórico. La aceptación formal y las evidencias académicas se revisan en los entregables de implementación.


## Sprint 1 — Implementación

- [01 Informe de estado del proyecto V_1_0_0](./docs/03%20Implementación/01%20Informe%20de%20estado%20del%20proyecto%20V_1_0_0.md)
- [02 Registro de Impedimentos V_1_0_0](./docs/03%20Implementación/02%20Registro%20de%20Impedimentos%20V_1_0_0.md)
- [03 Revisión del Sprint V_1_0_0](./docs/03%20Implementación/03%20Revisi%C3%B3n%20del%20Sprint%20V_1_0_0.md)
- [04 Retrospectiva del Sprint V_1_0_0](./docs/03%20Implementación/04%20Retrospectiva%20del%20Sprint%20V_1_0_0.md)

US-005 incorpora GET /orders y GET /orders/:id, búsqueda, filtros, paginación y detalle de solo lectura. Edición y eliminación de pedidos no forman parte de este incremento.

## Mejoras posteriores al cierre del Sprint 1

La línea base del cierre permanece en los informes anteriores. Las mejoras siguientes son posteriores, refinan US-001 a US-005 y no representan inicio de Sprint 2:

- `AppLayout` compartido: sidebar en escritorio desde 1024 px y menú plegable en tablet/móvil; abrir/cerrar el menú conserva formularios y mapa montados.
- Login con la imagen decorativa proporcionada por el usuario, fondo `cover`, sin capa blanquecina añadida; marca EcoRuta Huancayo a la izquierda y tarjeta de acceso a la derecha en escritorio, apiladas en pantallas pequeñas.
- Panel de administración con bienvenida y tres accesos rápidos reales: usuarios/roles, registro y consulta. Incluye «Resumen general» con indicadores visibles durante carga/error, actualización manual y conteos reales y distribución por estados almacenados mediante GET /admin/summary, exclusivo del Administrador. Los otros roles conservan sus opciones autorizadas.
- Registro en un formulario único: cliente/carga y entrega en dos columnas de escritorio; ubicación debajo, a todo el ancho; mapa más alto, leyenda compacta y botón final destacado.
- Leaflet/OpenStreetMap y Photon: cobertura administrativa v1.0.0 de Huancayo, El Tambo, Chilca, Pilcomayo y Huancán; filtrado por polígonos, sugerencia explícita, marcador magenta, centrado a zoom 17 y bloqueo del punto exterior o no confirmado.

**El backend valida la cobertura antes de la transacción de creación.** Rechaza puntos exteriores o coordenadas inválidas con HTTP 400 y recursos ausentes/no verificables con HTTP 503, sin crear clientes ni pedidos. El incremento autorizado de indicadores añade un módulo de resumen en NestJS; no cambia Prisma, PostgreSQL, migraciones, autenticación ni los endpoints existentes.

Documentación vigente:

- [Mejoras posteriores al Sprint 1 V_1_1_0](docs/03%20Implementación/05%20Mejoras%20posteriores%20al%20Sprint%201%20V_1_1_0.md): arquitectura, requisitos y reglas complementarias, con trazabilidad.
- [Verificación y preparación de entrega V_1_1_0](docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/01%20Verificación%20y%20entrega%20V_1_1_0.md): evidencia de la fase inicial; sus 54 archivos son un inventario histórico, no la selección final actual.
- [Frontend](src/frontend/README.md), [geodata](geodata/README.md), [integración de cobertura](geodata/FRONTEND-INTEGRATION.md) y [sincronización del marcador](geodata/MARKER-SYNC.md).

La fuente INEI es provisional: su portal etiqueta los límites como actualizados al 2023. El `last_change` interno de 2026 no demuestra vigencia administrativa a 2026. No se verificó una licencia explícita de redistribución del archivo; revisar ese permiso antes de incorporar los GeoJSON al repositorio público. RAR y GeoPackage fuente no se incluyen.

Frontend y backend utilizan el paquete privado `geodata/coverage/v1/`, con metadatos aprobados en `geodata/coverage-release.json` y política única en `geodata/coverage.ts`. Docker usa contexto raíz y copias selectivas con `.dockerignore`; la disponibilidad del paquete se comprueba antes de construir. Las imágenes contienen derivados INEI y no están autorizadas para publicación.

- [Resumen administrativo V_1_1_0](docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/02%20Resumen%20administrativo%20V_1_1_0.md).
- [Reconciliación sobre main V_1_1_0](docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/04%20Reconciliación%20sobre%20main%20V_1_1_0.md): rutas vigentes, verificaciones e inventario final.

## Validación backend y empaquetado privado

Desde la raíz del repositorio:

```sh
node scripts/provision-coverage.cjs --source "/directorio/privado/autorizado/v1"
node scripts/provision-coverage.cjs
node scripts/check-geodata-publication.cjs
```

El aprovisionamiento compara versión, cinco UBIGEO y hashes; no sobrescribe recursos existentes diferentes. El paquete privado y los artefactos TypeScript generados están excluidos de Git. La comprobación del índice detecta recursos geográficos incluidos accidentalmente; ejecutarla nuevamente después de cualquier selección manual de archivos. No se equipara descarga gratuita con permiso de redistribución.

El perfil de mantenimiento de `docker-compose.migrations.yml` sustituye el antiguo `prisma migrate deploy` automático. Solo para inicialización o actualización expresamente autorizada, con respaldo y revisión previa, ejecutar `docker compose -f docker-compose.yml -f docker-compose.migrations.yml --profile maintenance run --rm migrate` antes de arrancar la API. No se ejecutó esta operación sobre la base existente. Procedimiento completo, errores, pruebas y limitaciones: [Validación backend y empaquetado V_1_1_0](docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/05%20Validación%20backend%20y%20empaquetado%20V_1_1_0.md).

## Rama compartida para desarrollo

La rama `feature/post-sprint1-ui-geocoverage` comparte código, documentación, configuración y pruebas; no distribuye los nueve recursos privados de `geodata/coverage/v1/` ni imágenes Docker con ellos. Cada integrante necesita obtener el paquete aprobado por un canal privado autorizado y ejecutar el procedimiento de aprovisionamiento anterior.

Sin esos recursos, frontend y backend pueden compilar y las pruebas unitarias/HTTP de CI usan exclusivamente fixtures sintéticos. El frontend muestra un error de cobertura y bloquea la confirmación; el build no incorpora ningún polígono de prueba como recurso operativo. El backend puede compilar la política, pero responde HTTP 503 al registrar pedidos si no logra cargar/verificar el paquete. Login y consulta no dependen de la cobertura, siempre que se configure normalmente la API y su base. Esta entrega de código no autoriza redistribuir los datos INEI ni publicar imágenes que los contengan.

## CI reproducible sin recursos privados

Los fixtures de `test-fixtures/coverage-synthetic.json` contienen únicamente rectángulos y puntos inventados en una cuadrícula cerca de 0,0; no proceden del INEI. Se inyectan en pruebas backend, Vitest y pruebas de aprovisionamiento, nunca como fallback de producción. Los cinco códigos administrativos prueban la estructura del contrato, sin afirmar que esas geometrías representen distritos. Los umbrales de pruebas y audit se mantienen.

Vite carga recursos privados solo si están aprovisionados y su SHA-256 coincide con el release. Sin el paquete, compila sin emitir cobertura; la carga en navegador falla cerrada. Los E2E que ejercitan el mapa de producción necesitan un entorno privado autorizado; no forman parte del workflow actual ni se declara que hayan sido ejecutados en esta corrección.

La corrección y sus verificaciones están documentadas en [Corrección CI y fixtures sintéticos V_1_1_0](docs/03%20Implementación/evidencias-tecnicas/Post-Sprint-1/06%20Corrección%20CI%20y%20fixtures%20sintéticos%20V_1_1_0.md).

## Siguiente documento / Siguiente trabajo recomendado

Resolver y documentar los permisos de redistribución INEI antes de publicar datos o imágenes. Revisar la evidencia técnica 05 y verificar persistencia en una base exclusivamente de pruebas, sin utilizar los registros existentes.
