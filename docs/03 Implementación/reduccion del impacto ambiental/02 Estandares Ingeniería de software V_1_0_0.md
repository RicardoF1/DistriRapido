# Estándares de ingeniería de software y guía de desarrollo verde

| Campo | Valor |
|---|---|
| Proyecto | DistriRapido · EcoRuta Huancayo |
| Documento | 02 Estándares de ingeniería de software |
| Versión | 1.0.0 (V_1_0_0) |
| Fecha | 10 de noviembre de 2026, America/Lima |
| Rama | `feature/green-it` |
| Documento relacionado | [01 Informe de reduccion del impacto ambiental V_1_0_0](01%20Informe%20de%20reduccion%20del%20impacto%20ambiental%20V_1_0_0.md) |

## 1. Propósito y alcance

Este documento fundamenta las optimizaciones del informe 01 en normativas y marcos internacionales: ISO/IEC 25010, los principios de la Green Software Foundation (GSF) y las W3C Web Sustainability Guidelines (WSG). Además, establece las reglas de desarrollo verde que el equipo aplicará en las siguientes historias del proyecto y documenta la automatización CI/CD y la gestión de versiones del entregable.

Las reglas se expresan sobre el stack real de DistriRapido: NestJS, Prisma y PostgreSQL en el backend, y React, Vite y nginx en el frontend.

## 2. ISO/IEC 25010: modelo de calidad del producto

ISO/IEC 25010 define las características de calidad de un producto software. Las optimizaciones inciden en dos de ellas.

### 2.1 Eficiencia de desempeño

| Subcaracterística | Definición abreviada | Aplicación en DistriRapido | Evidencia |
|---|---|---|---|
| Comportamiento temporal | Tiempos de respuesta y procesamiento | LCP del login de 2,48 s a 0,53 s y FCP de 0,90 s a 0,32 s; carga diferida de páginas; índices en consultas frecuentes | Informe 01, secciones 5.4 y 6.1 |
| Utilización de recursos | Cantidad y tipo de recursos usados | Peso del login de 2.599,8 KB a 198,9 KB; JSON de la API comprimido hasta un 71,9 %; `select` mínimo en pedidos | Informe 01, secciones 5.1, 5.3 y 5.8 |
| Capacidad | Límites máximos que el sistema soporta | Paginación de 12 con un máximo de 100 por petición; caché `304` y en cliente, que reducen la carga del servidor | Informe 01, secciones 5.2 y 5.7 |

### 2.2 Mantenibilidad

| Subcaracterística | Aplicación en DistriRapido |
|---|---|
| Modularidad | Cada página es un módulo cargado de forma independiente (`lazyPage`); las políticas de caché viven en `common/cache-policy.ts` y la paginación en `common/pagination.ts` |
| Reusabilidad | `PaginationQueryDto`, `pageWindow`, el componente `Pagination` y `queryClient` se reutilizan en varios listados |
| Analizabilidad | Constantes con nombre (`DEFAULT_PAGE_SIZE`, `PRIVATE_REVALIDATE`, `COMPRESSION_OPTIONS`) en lugar de valores dispersos; comentarios que indican el área Green IT de cada cambio |
| Modificabilidad | Cambiar el tamaño de página o la política de caché exige editar una sola constante |
| Capacidad de prueba | `green-it.spec.ts` (backend), `green-it.test.tsx` (frontend), `swdm-v4.test.cjs` y la auditoría Lighthouse CI verifican cada optimización de forma automatizada |

## 3. Principios de la Green Software Foundation

La GSF plantea la **eficiencia de carbono** como objetivo general: emitir la menor cantidad de carbono posible por unidad de trabajo útil. Se alcanza mediante tres palancas, la eficiencia energética, la conciencia del carbono y la eficiencia del hardware, y se mide con la especificación *Software Carbon Intensity* (SCI).

| Principio GSF | Significado | Aplicación en DistriRapido | Grado |
|---|---|---|---|
| Eficiencia de carbono | Mínimas emisiones por unidad de trabajo | Emisiones por visita al login de 0,3945 a 0,0302 g CO2e (−92,3 %) según SWDM v4; el resultado se mide de forma continua en CI | Aplicado y medido |
| Eficiencia energética | Consumir la menor electricidad posible eliminando código y recursos innecesarios | Menos bytes transferidos y procesados: imágenes AVIF/WebP, división de código, fuentes nativas y compresión. La precompresión se hace una vez en el build y no en cada petición | Aplicado |
| Eficiencia del hardware (carbono incorporado) | Reducir la demanda de hardware y prolongar su vida útil | Menos JavaScript que interpretar en los dispositivos (−83,9 % en el login) y menos datos por petición, lo que favorece equipos de gama baja y reduce la presión sobre servidores. SWDM v4 incluye explícitamente la energía incorporada (0,106 kWh/GB) | Aplicado |
| Conciencia del carbono | Hacer más cuando la electricidad es más limpia y menos cuando es más sucia | No se desplazan cargas según la intensidad de la red: DistriRapido es una herramienta operativa que debe responder cuando el usuario la necesita. El cálculo usa la intensidad media mundial (494 g/kWh) y admite intensidades regionales. Los trabajos diferibles, como la auditoría Lighthouse, se cancelan si llega una ejecución más reciente (`concurrency`) | Parcial; ver sección 8 |
| Medición (SCI) | Calcular la tasa de carbono por unidad funcional | Tasa por visita: g CO2e/visita con SWDM v4, que aplica la misma idea de una tasa por unidad funcional | Aplicado con SWDM v4 |

## 4. W3C Web Sustainability Guidelines (WSG)

### 4.1 Correspondencia con la consigna

La consigna cita las pautas «1.2», «2.4» y «3.1». En el borrador vigente de la WSG (*W3C Group Note Draft*, 16 de octubre de 2026) esa numeración corresponde a otros contenidos: 1.2 es el apartado «WSG layers of guidance» de la introducción, no una pauta. Para mantener la trazabilidad con la consigna sin atribuir contenidos incorrectos a la norma, se establece esta correspondencia:

| Tema según la consigna | Pautas WSG reales que lo cubren | Aplicación en DistriRapido |
|---|---|---|
| «1.2» Interfaz y medios: formatos comprimidos de nueva generación | **2.9** Optimize media to reduce resource use · **2.11** Use optimized web typography | AVIF/WebP con `<picture>`; fuentes nativas y precarga de las fuentes de título |
| «2.4» Arquitectura: caché determinista e inmutable | **4.2** Optimize caching and support offline access · **3.3** Modularize bandwidth-heavy components · **3.7** Defer the loading of non-critical resources | `immutable` en recursos con hash, ETag y TanStack Query; `React.lazy` y Leaflet bajo demanda |
| «3.1» Red: reducción de *payloads* con compresión y proyecciones | **4.3** Reduce data transfer with compression · **3.16** Reduce the number and complexity of database queries | Brotli/Gzip en la API, gzip precomprimido en nginx; `select` mínimo, paginación de 12 e índices |

Las pautas que la WSG numera realmente como 2.4 y 3.1 también se cumplen:

- **2.4 Design efficient and streamlined user journeys:** listados de 12 registros, filtros en la URL y carga de cada página solo cuando se visita.
- **3.1 Set goals based on performance and energy impact:** los umbrales de la consigna se fijan como presupuesto de rendimiento obligatorio en `lighthouserc.json`.

### 4.2 Pautas aplicadas

| Pauta WSG | Título | Cómo se aplica |
|---|---|---|
| 2.4 | Design efficient and streamlined user journeys | Paginación de 12 y carga por página |
| 2.9 | Optimize media to reduce resource use | Imagen del login de 1.911 KB a 69,8 KB transferidos |
| 2.11 | Use optimized web typography | Fuentes del sistema para el texto; dos archivos `woff2` precargados para los títulos |
| 3.1 | Set goals based on performance and energy impact | Presupuesto Lighthouse obligatorio y cálculo SWDM v4 en CI |
| 3.2 | Minify and remove unused code | Build minificado; eliminación de la PNG, del SVG externo y de `@fontsource/inter` |
| 3.3 | Modularize bandwidth-heavy components | Mapa (Leaflet) y páginas en módulos independientes |
| 3.7 | Defer the loading of non-critical resources | `React.lazy` y `Suspense` |
| 3.12 | Use dependencies sparingly and maintain them | Una dependencia retirada; las nuevas (`compression`, TanStack Query) se fijan a versiones exactas y se justifican |
| 3.16 | Reduce the number and complexity of database queries | Proyección mínima, índices y conteo junto al listado en una sola transacción |
| 4.2 | Optimize caching and support offline access | `immutable`, `no-cache` con ETag y caché en memoria |
| 4.3 | Reduce data transfer with compression | Brotli y Gzip |
| 4.6 | Use automation wisely | Una auditoría por cambio, cancelación de ejecuciones obsoletas e informes conservados solo 14 días |

## 5. Guía de desarrollo verde

Las reglas siguientes son obligatorias para las nuevas historias de usuario. Cada una indica el principio de código que la sustenta.

### 5.1 Backend (NestJS, Prisma y PostgreSQL)

| # | Regla | Principio | Ejemplo en el código |
|---|---|---|---|
| B1 | Todo `findMany` de un listado declara un `select` con las columnas que muestra la vista; `include` completo solo en el detalle | Clean Code (intención explícita), YAGNI | `ORDER_LIST_SELECT` |
| B2 | Todo endpoint de listado acepta `page` y `pageSize`, con `DEFAULT_PAGE_SIZE = 12` y un máximo de 100, y devuelve `{ items, total, page, pageSize }` | DRY, SOLID (responsabilidad única de `PaginationQueryDto`) | `common/pagination.ts` |
| B3 | Cada filtro u orden nuevo sobre una tabla en crecimiento se acompaña de su índice en una migración aditiva | Clean Code (rendimiento previsible) | `202611100001_green_it_indices_consulta` |
| B4 | La política de caché se elige entre las constantes de `common/cache-policy.ts`: `NO_STORE` para datos personales, operativos o de sesión, y `PRIVATE_REVALIDATE` solo para catálogos de baja sensibilidad | DRY, SOLID (abierto/cerrado: nuevas políticas sin modificar los controladores) | `RolesController`, `VehiclesController` |
| B5 | La compresión es global (`configureApp`); ningún controlador comprime por su cuenta | SOLID (responsabilidad única), DRY | `COMPRESSION_OPTIONS` |
| B6 | No se añaden dependencias para lo que resuelven la plataforma o Node.js (`node:zlib`, `Intl`, `crypto`); las que se añadan se fijan a una versión exacta con al menos dos semanas de antigüedad | YAGNI | `compression@1.8.2` |

### 5.2 Frontend (React, Vite y nginx)

| # | Regla | Principio | Ejemplo en el código |
|---|---|---|---|
| F1 | Ninguna imagen de mapa de bits supera 200 KB: se entrega en AVIF o WebP con `<picture>`, `srcset`, `sizes`, `width` y `height`; las decorativas llevan `alt=""` | Clean Code, accesibilidad | `AuthLayout` |
| F2 | Toda página nueva se registra con `lazyPage`; las librerías pesadas solo se importan desde las páginas que las usan | SOLID (responsabilidad única por página), YAGNI | `AppRoutes`, `lazy-page.tsx` |
| F3 | El texto usa la pila de fuentes del sistema; una fuente web nueva requiere justificación y precarga | YAGNI | `tokens.css`, plugin `green-it-preload-fonts` |
| F4 | Logotipos e iconos se escriben como SVG en línea con `role="img"` y nombre accesible, o con `aria-hidden` si son decorativos | Clean Code | `BrandLogo` |
| F5 | Las peticiones usan `request()`; por defecto `no-store`. Solo los catálogos usan `cache: 'no-cache'` y TanStack Query con claves de `catalogKeys` | DRY, SOLID | `api.ts`, `query-client.ts` |
| F6 | Los listados usan `PAGE_SIZE` y el componente `Pagination`; no se escribe el número 12 en ninguna página | DRY | `UsersPage`, `VehiclesPage` |
| F7 | Los contenidos que llegan de la API reservan su espacio mientras cargan, para mantener CLS ≤ 0,02 | Clean Code (comportamiento predecible) | `AdminSummary`, `OperationsPage` |
| F8 | nginx sirve `/assets/` con `immutable` y gzip precomprimido; toda `location` nueva repite las cabeceras de seguridad | DRY de la política, seguridad | `nginx.conf` |

### 5.3 Revisión antes de integrar

1. El workflow «Green IT & Performance Audit» debe pasar: un umbral incumplido bloquea la integración.
2. Las pruebas de `green-it.spec.ts` y `green-it.test.tsx` deben pasar.
3. Toda dependencia nueva se justifica en el pull request con su peso y su alternativa nativa.

## 6. Matriz de mapeo directo

| # | Optimización | ISO/IEC 25010 | Principio GSF | Pauta W3C WSG | Principio de código |
|---|---|---|---|---|---|
| 1 | `select` mínimo e índices (PostgreSQL) | Eficiencia de desempeño: utilización de recursos y comportamiento temporal | Eficiencia energética | 3.16 · tema «3.1» de la consigna | YAGNI, Clean Code |
| 2 | Paginación de 12 en backend y frontend | Eficiencia de desempeño: capacidad | Eficiencia energética | 2.4 | DRY, SOLID (SRP) |
| 3 | AVIF/WebP con `<picture>` | Eficiencia de desempeño: comportamiento temporal y utilización de recursos | Eficiencia de carbono | 2.9 · tema «1.2» de la consigna | Clean Code |
| 4 | `React.lazy` y `Suspense` | Mantenibilidad: modularidad | Eficiencia del hardware | 3.3, 3.7 · tema «2.4» de la consigna | SOLID (SRP), YAGNI |
| 5 | Fuentes nativas en lugar de `@fontsource/inter` | Mantenibilidad: analizabilidad | Eficiencia energética | 2.11, 3.12 · tema «1.2» de la consigna | YAGNI |
| 6 | Logotipo SVG en línea | Eficiencia de desempeño: comportamiento temporal | Eficiencia de carbono | 3.2 | Clean Code |
| 7 | `immutable`, ETag y TanStack Query | Eficiencia de desempeño: comportamiento temporal y capacidad | Eficiencia energética | 4.2 · tema «2.4» de la consigna | DRY, SOLID (OCP) |
| 8 | Brotli/Gzip en la API y gzip en nginx | Eficiencia de desempeño: utilización de recursos | Eficiencia de carbono | 4.3 · tema «3.1» de la consigna | SOLID (SRP), DRY |

## 7. Integración continua verde

El workflow [`.github/workflows/green-audit.yml`](../../../.github/workflows/green-audit.yml) se ejecuta en cada `push`, en cada `pull_request` y a demanda. Levanta PostgreSQL efímero, aplica las migraciones, crea un administrador con credenciales generadas en la ejecución, inicia la API, construye el frontend, lo sirve con nginx y la configuración de producción, y audita las páginas con Lighthouse CI 0.15.1 (perfil escritorio, mediana de 3 ejecuciones).

```yaml
name: Green IT & Performance Audit
on:
  push:
  pull_request:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # … PostgreSQL de servicio, API NestJS y frontend servido por nginx …
      - name: Install Lighthouse CI
        run: npm install -g "@lhci/cli@${LHCI_VERSION}"
      - name: Audit public page (login)
        run: |
          lhci collect --url=http://localhost:5173/login
          lhci assert
          lhci upload --upload.outputDir=.lighthouseci/reports/publicas
      - name: Upload Lighthouse reports (private workflow artifact)
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-reports
          path: .lighthouseci/reports
          retention-days: 14
```

Presupuesto de rendimiento en [`lighthouserc.json`](../../../lighthouserc.json):

| Aserción | Umbral | Nivel |
|---|---|---|
| `categories:performance` | ≥ 0,90 | error |
| `first-contentful-paint` | ≤ 1.000 ms | error |
| `largest-contentful-paint` | ≤ 1.400 ms | error |
| `total-blocking-time` | ≤ 85 ms | error |
| `cumulative-layout-shift` | ≤ 0,02 | error |
| `total-byte-weight` | ≤ 1.153.434 B (1,1 MB) | error |

**Decisiones respecto al ejemplo de la consigna:**

- **Sin `|| true`:** el incumplimiento de un umbral hace fallar el job. Se comprobó en local que con un umbral imposible `lhci assert` termina con código 1.
- **Sin `temporary-public-storage`:** los informes se guardan como artefacto privado del workflow. El repositorio es privado y sus datos de cobertura no están autorizados para publicación.
- **Versiones fijadas:** `@lhci/cli@0.15.1` y `actions/*@v4`, en lugar de versiones flotantes.

**Resultado:** la ejecución #2 del workflow sobre `feature/green-it` (commit `f8327fc`) se aprobó en 3 minutos, junto con la CI general «DistriRapido checks» #113.

## 8. Gestión de versiones con Git

### 8.1 Estructura y nombres

```text
docs/
└── 03 Implementación/
    └── reduccion del impacto ambiental/
        ├── 01 Informe de reduccion del impacto ambiental V_1_0_0.md
        ├── 02 Estandares Ingeniería de software V_1_0_0.md
        └── evidencias/
            ├── lighthouse/antes/    (resumen-antes.json, login-escritorio.html, login-movil.html)
            ├── lighthouse/despues/  (resumen-despues.json, login-escritorio.html, login-movil.html)
            └── swdm-v4-resultados.json
```

Ambos documentos usan la versión semántica **1.0.0** (`V_1_0_0` en el nombre de archivo), igual que la cabecera del workflow `green-audit.yml`.

### 8.2 Secuencia de comandos Git CLI

El proyecto integra el trabajo por ramas: cada historia o actividad se desarrolla en su propia rama y se integra en `sprint-4` mediante pull request; `sprint-4` se integra en `main` al cerrar el sprint. Por eso el `push` se hace a la rama de trabajo y no directamente a `main`.

```bash
# 1. Verificar el estado del repositorio
git status

# 2. Crear la rama de trabajo desde la integración del sprint
git fetch origin
git switch -c feature/green-it --no-track origin/sprint-4

# 3. Crear la estructura de directorios
mkdir -p "docs/03 Implementación/reduccion del impacto ambiental/evidencias"

# 4. Guardar los documentos en la ruta exacta:
#    docs/03 Implementación/reduccion del impacto ambiental/01 Informe de reduccion del impacto ambiental V_1_0_0.md
#    docs/03 Implementación/reduccion del impacto ambiental/02 Estandares Ingeniería de software V_1_0_0.md

# 5. Añadir los documentos y las evidencias al área de preparación
git add "docs/03 Implementación/reduccion del impacto ambiental/"

# 6. Registrar el commit
git commit -m "docs(green-it): add environmental impact report and software engineering standards v1.0.0"

# 7. Publicar la rama y fijar su seguimiento
git push -u origin feature/green-it

# 8. Abrir el pull request feature/green-it → sprint-4 en GitHub; al cierre del sprint, sprint-4 → main.
```

## 9. Trabajo futuro

1. **Conciencia del carbono:** usar la intensidad de carbono regional de la red eléctrica de Perú en lugar de la media mundial cuando se disponga de una fuente verificable, y programar las tareas no urgentes (por ejemplo, recálculos masivos de rutas) en franjas de menor intensidad.
2. **Brotli en estáticos:** evaluar una imagen de nginx con el módulo Brotli o un CDN que lo ofrezca.
3. **Mosaicos del mapa:** evaluar un servidor de mosaicos propio o vectorial con caché, para reducir la dependencia de un tercero y el peso de «Registrar pedido».
4. **Perfil móvil:** reducir el JavaScript inicial (91 KB con gzip) para acercar el FCP móvil a 1,0 s.

## Referencias

- ISO/IEC 25010:2023. *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model*.
- Green Software Foundation. *Green Software Practitioner* y *Software Carbon Intensity (SCI) Specification*. <https://greensoftware.foundation/>
- W3C Sustainable Web Design Community Group. *Web Sustainability Guidelines (WSG)*, Group Note Draft, 16 de octubre de 2026. <https://www.w3.org/TR/web-sustainability-guidelines/>
- Sustainable Web Design. *Estimating digital emissions* (SWDM v4). <https://sustainablewebdesign.org/estimating-digital-emissions/>
- Google. *Lighthouse CI*. <https://github.com/GoogleChrome/lighthouse-ci>
