# 06. Corrección CI y fixtures sintéticos V_1_1_0

Fecha: 2026-10-09, America/Lima. Rama: `feature/post-sprint1-ui-geocoverage`. Incremento posterior al Sprint 1; no modifica los informes históricos ni recursos INEI.

## Causa comprobada

La ejecución [37889190142](https://github.com/RicardoF1/DistriRapido/actions/runs/37889190142) falló en test:coverage de ambos jobs. Backend leía test-points y cargaba cobertura privada ausente. El setup global de Vitest frontend importaba el GeoJSON privado y hacía fallar todas las suites; sus importaciones estáticas también impedían el build de un clon limpio.

El audit posterior del backend habría fallado por handlebars 4.7.9. Se fija su versión transitiva 4.7.10 y se actualiza el lockfile, sin reducir el nivel high del audit. Permanecen 20 avisos moderados; audit --audit-level=high devuelve éxito.

## Corrección

- Paquete sintético versionable en `test-fixtures/coverage-synthetic.json`: cuadrícula inventada cerca de 0,0, cinco áreas ficticias, hueco, MultiPolygon, puntos y hashes calculados. Ninguna geometría deriva del INEI.
- Backend usa paquetes temporales y referencia sintética explícita solo en pruebas. El loader normal mantiene release v1.0.0 aprobado; una prueba confirma que rechaza el paquete sintético con su configuración de producción.
- Prisma/Auth simulados en HTTP: punto aprobado persistido exactamente; exteriores y ausencia de cobertura devuelven 400/503 sin iniciar transacción ni escribir.
- Vitest inyecta únicamente en pruebas los datos y hashes sintéticos. Los mocks de direcciones/mapa usan puntos de la cuadrícula; no acreditan pertenencia territorial real.
- Frontend solicita el recurso operativo en runtime. El plugin Vite emite/sirve datos privados solo si existen y tienen hash correcto; sin paquete, build exitoso sin cobertura, UI con error y confirmación bloqueada. Nunca emite fixtures de prueba como fallback operativo.
- `prepare-coverage.cjs` sigue requiriendo solo política y metadatos públicos, sin GeoJSON privados. Los tests de aprovisionamiento ya no copian INEI.
- CI mantiene pruebas, umbrales y audit; añade pruebas sintéticas del aprovisionamiento y guard de publicación. Los E2E del mapa de producción no forman parte de este workflow y requieren entorno privado autorizado; no se ejecutaron en esta corrección.
- Se incorporó el nuevo archivo de configuración al COPY selectivo/allowlist para conservar compatibilidad del empaquetado, sin ejecutar Docker.

## Verificación ejecutada

| Verificación | Resultado |
|---|---|
| Backend lint, typecheck, build y Jest con cobertura | Aprobados antes de la suspensión; 243 pruebas en 20 suites. No repetidas al retomar. |
| Backend cobertura | Statements/functions/lines 100%; branches 99.49%, mismo umbral 80%. |
| Herramientas sintéticas / lint | Cuatro pruebas aprobadas antes de la suspensión. |
| Frontend completo con cobertura | 216 pruebas aprobadas; métricas conservadas: 97.13% statements, 91.59% branches, 98.68% functions, 99.62% lines. |
| Typecheck y lint frontend después del nuevo test | Aprobados; resuelto el tipo del contexto simulado del hook. |
| Pruebas nuevas de assets | Tres aprobadas en entorno Node adecuado al plugin: ausencia, hash correcto y corrupción. |
| Copia de clon limpio | 179 archivos de código/configuración copiados sin geodata/coverage/v1; dependencias locales enlazadas, no reinstaladas. Typecheck frontend, tres pruebas de assets y build aprobados. No GeoJSON en dist de esa copia. |
| Build frontend con recursos privados locales | Aprobado antes de la suspensión; emite únicamente cobertura cuyo hash coincide. |
| Audit backend | Exit 0 con audit-level=high; handlebars corregido, 20 avisos moderados pendientes. |

La copia local aislada usa dependencias ya instaladas; GitHub Actions realiza npm ci en runner limpio y su resultado debe consultarse separadamente. No se declaran pruebas PostgreSQL locales ni Docker ejecutados. No se modificaron datos de PostgreSQL, main ni el checkout original. No se redujeron umbrales ni se omitieron suites.

## Archivos afectados

Workflow CI, override/lockfile backend, loader y tests geográficos backend, helper de paquetes temporales, tests de aprovisionamiento, datos/documentación sintéticos, configuración Vite/TypeScript, plugin y tests de assets, setup y tests frontend con coordenadas ficticias, README raíz/backend/frontend, Dockerfile frontend y .dockerignore (solo compatibilidad de entradas).

## Limitaciones y publicación

Los nueve recursos privados siguen excluidos de Git, igual que secretos, .env, dependencias, outputs y temporales. La referencia de producción no se sustituye ni se deshabilita por variables CI. Aprovisionamiento privado autorizado obligatorio para operar selección de destinos; permisos INEI siguen pendientes. La prueba sintética demuestra reglas geométricas/contratos, no exactitud administrativa.

El commit/push de esta corrección fue autorizado condicionado a verificaciones satisfactorias. El resultado remoto de GitHub Actions se informará con el SHA publicado; esta evidencia registra las verificaciones locales, no anticipa un resultado remoto.

## Siguiente documento / Siguiente trabajo recomendado

Comprobar la ejecución de Actions del commit publicado. Mantener tests públicos sintéticos separados de validación territorial privada y revisar los avisos moderados restantes sin cambios destructivos ni publicar datos INEI.
