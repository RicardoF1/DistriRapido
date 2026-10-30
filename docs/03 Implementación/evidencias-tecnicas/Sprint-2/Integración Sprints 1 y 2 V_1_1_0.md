# Integración local de Sprints 1 y 2 V_1_1_0

Fecha: 29 de octubre de 2026, America/Lima. Integración local autorizada; sin publicación, commits nuevos ni cierre de tickets.

## Base integrada y protección

- Rama final: `main`, HEAD `128af98b7021655c39160a92121087023ed3f931`, igual a `origin/main` consultado.
- Rama original `feature/us-008-gestion-conductores` conservada en `fccd2b5783b948be0628cd0bf8a510180cc3c196`.
- Se cambió a la rama local `main` y se avanzó con `git merge --ff-only origin/main`. No se volvieron a fusionar las ramas de historias, no hubo conflictos y no se resolvieron archivos tomando una versión sobre otra.
- Los cambios locales viajaron sin stash ni commits. Se verificaron 115 archivos mediante SHA-256 antes y después: login, test del mapa, archivos nuevos, carpetas antiguas y recursos privados preservados.
- Respaldo privado: `.local/integration-20261029-160458/`. Contiene copias y manifiesto, parche binario y `history.bundle` verificado por Git. No debe publicarse.
- PostgreSQL: `distrirapido-before-integration-20261029.dump`, SHA-256 `1aacf403ce682a9b515b9ba465491c815a9f983ec550441ddb9acf348b50eacc`. Se verificaron listado y decodificación completa con `pg_restore`, sin restaurar sobre ninguna base.

## Aportes incorporados

| Historia | Aporte | Integración previa en GitHub |
|---|---|---|
| HGR-22 / US-006 | Transiciones y actualización de estado de pedidos | PR #7, `88b6d3e` |
| HGR-24 / US-007 | Gestión de vehículos y acceso administrativo | PR #7 y corrección `128af98` |
| HGR-26 / US-008 | Gestión administrativa de conductores | PR #5, `a1a00ae` |
| HGR-27 / US-009 | Disponibilidad de conductores por intervalo | PR #6 hacia US-008 y luego PR #5 hacia main |

La diferencia de contenido entre el HEAD anterior de US-008 y la base integrada comprende 55 archivos. El avance de la rama local main comprende 75 porque esa rama todavía no contenía US-008. No son dos integraciones distintas.

## Cambios locales y ajustes de integración

Se conservaron `LoginForm.tsx`, `LoginForm.test.tsx`, `login.spec.ts`, el nuevo `login-email.spec.ts` y la espera del marcador en `DeliveryMap.test.tsx`. El correo se guarda únicamente en `sessionStorage`; la contraseña y los tokens no se guardan allí ni en `localStorage`.

Ajustes adicionales realizados:

- `src/frontend/e2e/users.spec.ts` y `orders.spec.ts`: esperan exclusivamente el borrador de correo en sessionStorage; mantienen la comprobación de ausencia de credenciales.
- `src/frontend/e2e/sprint2-mocked.spec.ts`: aborta API no simulada y simula el resumen administrativo. Sin ello un HTTP 401 real del resumen cerraba la sesión del fixture.
- `src/frontend/e2e/login-background.spec.ts`: simula también el resumen para aislar el login visual de la API real.
- `src/frontend/e2e/order-navigation.spec.ts`: simula el resumen y comprueba que la sesión del navegador conserva solo el correo, sin contraseña ni tokens.
- `src/frontend/playwright.mock.config.ts`: lista explícita de specs con API simulada; excluye las pruebas de login, usuarios y pedidos que utilizan cuentas reales y pueden escribir registros.
- `src/frontend/nginx.conf`: añade únicamente `https://photon.komoot.io` a `connect-src`. La CSP anterior de Docker bloqueaba búsquedas e inversas incluso con datos geográficos válidos. Se reprodujo con E2E fallidos y se verificó la cabecera HTTP corregida.

No se cambiaron dependencias, contratos API, reglas de estados, algoritmos geométricos, polígonos ni funcionalidades del Sprint 3.

Inventario completo de archivos locales nuevos o modificados respecto a la base integrada:

```text
src/frontend/src/features/auth/LoginForm.tsx
src/frontend/src/features/auth/LoginForm.test.tsx
src/frontend/src/features/orders/DeliveryMap.test.tsx
src/frontend/e2e/login.spec.ts
src/frontend/e2e/login-email.spec.ts
src/frontend/e2e/login-background.spec.ts
src/frontend/e2e/order-navigation.spec.ts
src/frontend/e2e/orders.spec.ts
src/frontend/e2e/users.spec.ts
src/frontend/e2e/sprint2-mocked.spec.ts
src/frontend/playwright.mock.config.ts
src/frontend/nginx.conf
docs/03 Implementación/evidencias-tecnicas/Sprint-2/Integración Sprints 1 y 2 V_1_1_0.md
```

Las carpetas antiguas no rastreadas `backend/` y `frontend/` ya existían y no forman parte de este inventario de cambios.

## Migraciones y conservación de datos

US-008 ya estaba aplicada. Con autorización específica posterior al respaldo se aplicaron únicamente las pendientes a `public`:

1. `202610090001_sprint2_us006_us007`: crea `vehiculos`, CHECK e índices; no depende de conductores.
2. `202610090002_us009_disponibilidad_conductores`: crea disponibilidad con FK a conductores; US-008 ya satisface esa dependencia.

El prefijo compartido de vehículos y US-008 no produce una dependencia circular: sus nombres completos son diferentes y vehículos no necesita conductores. No se alteraron las migraciones anteriores. Prisma informa seis migraciones al día; sus checksums coinciden considerando finales de línea LF/CRLF, están finalizadas y no revertidas.

Comparación de SHA-256 de filas, sin exponer contenido: usuarios 3, roles 4, clientes 2, pedidos 2 y conductores 2 permanecen exactamente iguales. Vehículos y disponibilidad se crean vacíos. No se eliminaron cuentas, registros ni volúmenes.

Las pruebas con escrituras utilizan exclusivamente el esquema separado `distrirapido_integration_20261029_test` en PostgreSQL local. Se conserva ese esquema con sus fixtures, sin eliminarlo. Las migraciones iniciales se aplicaron también en ese esquema vacío para preparar las pruebas; esto no repite migraciones sobre public.

## Verificaciones ejecutadas

Se invocaron los scripts configurados mediante npm CLI de Node, sin cambiar package.json:

| Verificación | Resultado |
|---|---|
| Backend `prisma:generate`, `typecheck`, `lint`, `build` | Aprobados |
| Backend `test:coverage` | 27 suites, 312 pruebas aprobadas; cobertura global superior al umbral existente |
| Frontend `typecheck`, `lint`, `build` | Aprobados |
| Frontend `test:coverage -- --pool=forks --maxWorkers=1` | 24 archivos, 250 pruebas aprobadas; umbrales conservados |
| Backend `test:integration` | 3 suites, 71 pruebas HTTP con PostgreSQL aprobadas en esquema aislado; cobertura geográfica sintética de pruebas |
| Comprobaciones HTTP adicionales | 41 aprobadas en esquema aislado: roles, CRUD, transiciones, superposición, persistencia y 9 puntos de cobertura real |
| `node --test scripts/geodata-tools.test.cjs` | 4 pruebas aprobadas |
| `node scripts/check-geodata-publication.cjs` | Índice sin derivados geográficos privados |
| Docker Compose y builds de aplicaciones | Configuración válida; imágenes construidas localmente; backend/frontend actualizados sin recrear PostgreSQL |
| Acceso real de desarrollo | Login original HTTP 200; GET de identidad, drivers, vehicles, availability, orders y resumen HTTP 200; logout HTTP 204 |
| Photon externo | Consulta de solo lectura respondida con un resultado; sin carga de datos personales |
| `git diff --check` | Sin errores; aviso de normalización CRLF en el test previo del mapa |
| E2E mock sobre Docker | Corrida final completa: 62 aprobados, 0 fallos, en 1,3 minutos; 390, 768, 1366 y 1440 px y límites 767/1023/1024; API/Photon simulados y polígonos reales locales |
| Auditoría backend | No aprobada: 10 vulnerabilidades, 6 bajas, 1 moderada y 3 altas |
| Auditoría frontend | No aprobada: 5 vulnerabilidades, 3 moderadas y 2 altas |

Las corridas E2E previas fallidas no se cuentan como aprobadas: una contra Vite sufrió interceptación de archivos fuente; otra sobre Docker detectó la CSP y mocks incompletos. La revisión automática de seguridad rechazó una corrida amplia que podía incluir escrituras reales; se sustituyó por el perfil mock explícito. No se ejecutó esa acción rechazada.

Una corrida intermedia tuvo 60 aprobados y 2 fallos de navegación por mocks incompletos y la expectativa anterior de almacenamiento vacío. Se corrigieron, se repitieron los cuatro casos de navegación y luego se ejecutó el perfil completo: 62/62. No se desactivaron pruebas ni se redujeron umbrales.

El comprobador HTTP privado confirma el defecto conocido de filtros: `GET /orders?estado=EN_PREPARACION` devuelve 400. Esa observación no se contabiliza como funcionalidad correcta del filtro, aunque la comprobación diagnóstica haya obtenido la respuesta prevista.

## Pendientes priorizados

1. **Alta: auditoría de dependencias.** Evaluar actualizaciones dirigidas de body-parser, multer y dependencias transitivas; frontend Vite/Vitest y transitivas. No ejecutar npm audit fix --force: la propuesta automática de Jest puede introducir un cambio incompatible. No se modificaron lockfiles.
2. **Alta: filtros de pedidos.** Unificar los estados del DTO de consulta backend con los cinco del frontend y añadir regresión HTTP. HGR-22 cambia estados correctamente, pero los filtros distintos de PENDIENTE siguen rechazándose.
3. **Alta: concurrencia.** Evaluar actualización condicional del estado de pedido y protección transaccional de intervalos superpuestos. No se declara corregida ni probada la carrera concurrente; no se introdujeron cambios arquitectónicos.
4. **Funcional/documental:** validar decisiones provisionales de roles/cuenta opcional y completar disponibilidad de vehículos y bloqueo por planificación cuando sus contratos estén acordados.
5. **Licencia:** la redistribución de INEI sigue pendiente. Las imágenes locales contienen cobertura privada y no deben publicarse. Cada entorno requiere aprovisionamiento autorizado.
6. **Aceptación:** integración técnica no equivale a cerrar Jira, aprobar el Sprint ni habilitar un despliegue público. Se puede planificar Sprint 3 incluyendo estos pendientes; no se declara una liberación sin incidencias.

## Verificación local

Abrir `http://localhost:5173/login` con la cuenta original ya configurada. Administrador puede consultar Conductores, Vehículos, Disponibilidad y Pedidos; Operador conserva Conductores, Disponibilidad y Pedidos, y no obtiene acceso a Vehículos. No crear registros de aceptación en public sin acordarlo con el equipo.

Para repetir pruebas que escriben, configurar TEST_DATABASE_URL para una base _test o un esquema aislado con el patrón exigido por los tests. No dirigirlas a public. Los comandos y fixtures privados auxiliares de esta ejecución están en el respaldo local y no deben incorporarse a Git.

## Siguiente documento / Siguiente trabajo recomendado

Preparar la estabilización previa al Sprint 3: resolver auditorías con cambios acotados, corregir filtros de estado y diseñar pruebas de concurrencia. Actualizar los criterios de aceptación y la trazabilidad de Sprint 2 antes de declarar su cierre funcional.
