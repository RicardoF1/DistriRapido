# Informe de reducción del impacto ambiental (Green IT)

| Campo | Valor |
|---|---|
| Proyecto | DistriRapido · EcoRuta Huancayo |
| Documento | 01 Informe de reducción del impacto ambiental |
| Versión | 1.0.0 (V_1_0_0) |
| Fecha | 10 de noviembre de 2026, America/Lima |
| Rama | `feature/green-it`, creada desde `sprint-4` |
| Commits | `1cccb15` línea base · `77f63f4` backend · `2422573` frontend · `6c7a3f2` medición y SWDM v4 · `8db7d6d` CI · `f8327fc` estabilización de pruebas |
| Documento relacionado | [02 Estandares Ingeniería de software V_1_0_0](02%20Estandares%20Ingenier%C3%ADa%20de%20software%20V_1_0_0.md) |

## 1. Introducción y propósito

La eficiencia computacional de una aplicación web incide directamente en su consumo energético: cada byte que no se transfiere y cada ciclo de CPU que no se ejecuta reducen la energía consumida en los centros de datos, en las redes de telecomunicaciones y en los dispositivos de los usuarios. Este informe documenta la auditoría, la refactorización y la medición realizadas sobre DistriRapido con el fin de reducir su huella de carbono digital sin afectar la funcionalidad ni la seguridad del sistema.

Los objetivos son:

1. Diagnosticar con mediciones reales los principales cuellos de botella del sistema.
2. Aplicar optimizaciones en las 8 áreas definidas por la actividad, con código comparativo ANTES y DESPUÉS.
3. Medir el resultado con Google Lighthouse frente a los umbrales establecidos.
4. Cuantificar la energía y las emisiones con el Sustainable Web Design Model versión 4 (SWDM v4) y proyectar el ahorro anual.

## 2. Alcance y adaptación al stack del proyecto

La consigna describe las 8 áreas en términos del stack MERN (MongoDB, Express, React y Node.js). DistriRapido se construye con **NestJS + Prisma + PostgreSQL** en el backend y **React + Vite** servido por **nginx** en el frontend. Cada área se aplicó con la tecnología equivalente del proyecto real; no se añadió código de MongoDB ni de Express que el sistema no utiliza.

| # | Área de la consigna (MERN) | Equivalente aplicado en DistriRapido |
|---|---|---|
| 1 | Consultas magras `.select()` / `.lean()` e índices en MongoDB | `select` de Prisma con las columnas mínimas e índices de PostgreSQL mediante migración aditiva |
| 2 | Paginación backend y frontend de 12 registros | `DEFAULT_PAGE_SIZE = 12` en NestJS y `PAGE_SIZE = 12` en React; paginación nueva en usuarios y vehículos |
| 3 | Imágenes WebP/AVIF adaptativas con `<picture>` | Paisaje del login en AVIF y WebP en 3 anchos con respaldo JPEG |
| 4 | `React.lazy` / `Suspense` | Carga diferida de todas las páginas; Leaflet solo en las páginas con mapa |
| 5 | Sustitución de librerías por APIs nativas | Fuente web Inter sustituida por las fuentes nativas del sistema; formateo con `Intl` |
| 6 | Inlining de SVG | Logotipo como componente SVG en línea |
| 7 | `Cache-Control`, ETag y React Query | nginx `immutable` para recursos con hash, ETag con revalidación `304` en catálogos y TanStack Query en el cliente |
| 8 | Compresión Brotli/Gzip en Express | Middleware `compression` (Brotli y Gzip) en NestJS y gzip precomprimido en nginx |

## 3. Metodología de medición

- **Herramienta:** Google Lighthouse 12.6.1 en Chrome sin interfaz gráfica, categoría *Performance*.
- **Entorno:** imagen de producción del frontend (build de Vite servido por `nginx:1.28-alpine` con `src/frontend/nginx.conf`), API NestJS y PostgreSQL locales. No se midió el servidor de desarrollo de Vite.
- **Páginas auditadas:** inicio de sesión (`/login`), panel de administración (`/acceso/administrador`), seguimiento operativo (`/seguimiento`) y registro de pedidos con mapa (`/pedidos/nuevo`). Las páginas autenticadas se midieron con una sesión de administrador de prueba y se comprobó que la URL final correspondía a la página auditada.
- **Perfiles:** escritorio y móvil. **El perfil de escritorio es la referencia para los umbrales de la consigna** (score ≥ 90, FCP ≤ 1,0 s, LCP ≤ 1,4 s, TBT ≤ 85 ms, CLS ≤ 0,02 y peso ≤ 1,1 MB). En el perfil móvil Lighthouse simula una red 4G lenta y una CPU 4 veces más lenta, condiciones en las que un FCP de 1,0 s no es alcanzable para una aplicación de página única; los resultados móviles se informan como complemento.
- **Medición ANTES:** commit `853653c` (`sprint-4` con US-018 y US-019), previo a cualquier optimización.
- **Medición DESPUÉS:** build final de la rama `feature/green-it`, medido en las mismas condiciones.

## 4. Diagnóstico inicial

### 4.1 Métricas de referencia (ANTES, escritorio)

| Página | Score | FCP | LCP | TBT | CLS | Peso | Peticiones |
|---|---:|---:|---:|---:|---:|---:|---:|
| Login | 86 | 0,90 s | 2,48 s | 0 ms | 0 | 2.599,8 KB | 10 |
| Panel de administración | 98 | 0,90 s | 0,97 s | 0 ms | 0,011 | 691,0 KB | 11 |
| Seguimiento operativo | 98 | 0,82 s | 1,00 s | 0 ms | 0 | 691,9 KB | 12 |
| Registrar pedido (mapa) | 94 | 0,90 s | 1,46 s | 0 ms | 0 | 1.360,9 KB | 61 |

En móvil el login obtenía 63/100 con un LCP de 14,56 s.

### 4.2 Causas identificadas

1. **Imagen sin optimizar:** el fondo del login era un PNG de 1.956 KB (1.911 KB transferidos), el 73 % del peso de esa página. Se cargaba como `background-image` en CSS.
2. **Paquete JavaScript único:** 572 KB (559 KB transferidos) descargados en todas las páginas, Leaflet incluido, aunque la página no tuviera mapa.
3. **Sin compresión:** ni nginx ni la API comprimían las respuestas.
4. **Sin caché de recursos:** los archivos con hash no tenían `Cache-Control`, y todas las respuestas de la API usaban `no-store`, incluidos los catálogos de baja sensibilidad.
5. **Tipografías:** 5 variantes descargadas (77 KB), tres de ellas de Inter solo para el texto general.
6. **Consultas y listados:** el listado de pedidos traía el cliente completo (teléfono, correo, coordenadas y referencia) aunque la tabla solo muestra nombre y dirección; usuarios y vehículos no tenían paginación, y los demás listados usaban 10 o 20 registros.
7. **Índices ausentes** para el filtro y el orden del listado de pedidos, el orden del seguimiento y tres claves foráneas usadas en uniones.

## 5. Optimizaciones implementadas

### 5.1 Área 1: consultas con proyección mínima e índices

**Diagnóstico:** el listado de pedidos usaba `include: { cliente: true }` y transfería datos personales que la vista no muestra. Faltaban índices para las consultas más frecuentes.

**Implementación:** proyección explícita `ORDER_LIST_SELECT` y migración aditiva `202611100001_green_it_indices_consulta`, que solo crea índices.

ANTES (`src/backend/src/orders/orders.service.ts`):

```ts
this.prisma.pedido.findMany({
  where,
  include: { cliente: true }, // cliente completo: teléfono, correo, coordenadas, referencia…
  orderBy: [{ creado_en: 'desc' }, { pedido_id: 'desc' }],
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

DESPUÉS:

```ts
export const ORDER_LIST_SELECT = {
  pedido_id: true, estado: true, creado_en: true, ventana_inicio: true, ventana_fin: true,
  prioridad: true, tipo_producto: true, peso_kg: true, volumen_m3: true,
  cliente: { select: { nombre: true, direccion: true } },
} satisfies Prisma.PedidoSelect;

this.prisma.pedido.findMany({
  where,
  select: ORDER_LIST_SELECT, // solo las columnas que muestra el listado
  orderBy: [{ creado_en: 'desc' }, { pedido_id: 'desc' }],
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

Índices añadidos (`src/backend/prisma/migrations/202611100001_green_it_indices_consulta/migration.sql`):

```sql
CREATE INDEX "idx_pedidos_estado_creado" ON "pedidos"("estado", "creado_en" DESC);
CREATE INDEX "idx_pedidos_creado" ON "pedidos"("creado_en" DESC);
CREATE INDEX "idx_rutas_asignado" ON "rutas"("asignado_en" DESC);
CREATE INDEX "idx_paradas_ruta_pedido" ON "paradas_ruta"("pedido_id");
CREATE INDEX "idx_rutas_versiones_vehiculo" ON "rutas_versiones"("vehiculo_id");
CREATE INDEX "idx_ejecuciones_calculo_version" ON "ejecuciones_calculo"("version_id");
```

**Resultado:** cada fila del listado deja de transferir 7 campos del cliente y 2 del pedido. Además de reducir datos, se aplica minimización de datos personales. Los índices evitan recorridos secuenciales y ordenaciones en memoria a medida que crece el volumen de pedidos y rutas.

### 5.2 Área 2: paginación de 12 registros

**Diagnóstico:** usuarios y vehículos devolvían todos los registros en una sola respuesta; el resto de listados usaba 10 o 20 registros con el número repetido en cada archivo.

**Implementación:** constante única en backend y frontend (principio DRY), `PaginationQueryDto` reutilizable con un límite de 100 y componente `Pagination` accesible.

ANTES (`src/backend/src/users/users.service.ts`):

```ts
list() {
  return this.prisma.usuario.findMany({ select: PUBLIC_USER_SELECT, orderBy: [{ creado_en: 'desc' }, { usuario_id: 'asc' }] });
}
```

DESPUÉS (`src/backend/src/common/pagination.ts` y `users.service.ts`):

```ts
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;
export const pageWindow = (page: number, pageSize: number) => ({ skip: (page - 1) * pageSize, take: pageSize });

async list({ page = 1, pageSize = DEFAULT_PAGE_SIZE }: PaginationQueryDto = new PaginationQueryDto()) {
  const [items, total] = await this.prisma.$transaction([
    this.prisma.usuario.findMany({ select: PUBLIC_USER_SELECT, orderBy: [{ creado_en: 'desc' }, { usuario_id: 'asc' }], ...pageWindow(page, pageSize) }),
    this.prisma.usuario.count(),
  ]);
  return { items, total, page, pageSize };
}
```

Frontend (`src/frontend/src/services/pagination.ts`):

```ts
export const PAGE_SIZE = 12;
export const pageQuery = (page: number) => new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) }).toString();
```

**Resultado:** pedidos, usuarios, vehículos, conductores, disponibilidad, rutas, seguimiento y cuentas de conductor se consultan en bloques de 12. Se excluyen los candidatos de planificación, que son una herramienta de selección de pedidos para un recorrido y no un listado de consulta.

### 5.3 Área 3: imágenes AVIF/WebP adaptativas con `<picture>`

**Diagnóstico:** PNG de 1.672 × 941 px y 1.956 KB cargado como fondo CSS en el inicio de sesión.

**Implementación:** conversión a AVIF (calidad 50) y WebP (calidad 72) en 640, 1.024 y 1.672 px de ancho, más un JPEG progresivo de respaldo. La imagen es decorativa (`alt=""`, `aria-hidden`) y declara sus dimensiones para no provocar desplazamientos.

ANTES (`src/frontend/src/styles/app.css`):

```css
.login-background {
  min-height: 100dvh;
  background-image: url('../assets/login-landscape.png');
  background-size: cover;
  background-position: center;
}
```

DESPUÉS (`src/frontend/src/layouts/AuthLayout.tsx`):

```tsx
<picture className="login-backdrop" aria-hidden="true">
  <source type="image/avif" srcSet={LOGIN_LANDSCAPE.avif} sizes="100vw" />
  <source type="image/webp" srcSet={LOGIN_LANDSCAPE.webp} sizes="100vw" />
  <img src={LOGIN_LANDSCAPE.fallback} alt="" width={1672} height={941} decoding="async" fetchPriority="high" />
</picture>
```

| Archivo | Tamaño |
|---|---:|
| PNG original 1.672 px | 1.956,4 KB |
| AVIF 640 / 1.024 / 1.672 px | 22,7 / 42,5 / 70,8 KB |
| WebP 640 / 1.024 / 1.672 px | 25,5 / 52,0 / 94,9 KB |
| JPEG de respaldo 1.672 px | 150,2 KB |

**Resultado:** las imágenes transferidas en el login pasan de 1.911,2 KB a 69,8 KB en escritorio y a 42,1 KB en móvil (−96,3 % y −97,8 %). La comparación visual de un mismo recorte no mostró pérdida apreciable de calidad.

### 5.4 Área 4: carga diferida con `React.lazy` y `Suspense`

**Diagnóstico:** todas las páginas se importaban de forma estática y formaban un único paquete de 572 KB.

ANTES (`src/frontend/src/routes/AppRoutes.tsx`):

```tsx
import { UsersPage } from '../pages/UsersPage';
import { OrderRegistrationPage } from '../pages/OrderRegistrationPage';
import { RouteDetailPage } from '../pages/RouteDetailPage';
// … todas las páginas, incluidas las que usan Leaflet
```

DESPUÉS (`src/frontend/src/routes/lazy-page.tsx` y `AppRoutes.tsx`):

```tsx
export function lazyPage<Name extends string>(loader: () => Promise<Record<Name, ComponentType>>, name: Name) {
  const Page = lazy(async (): Promise<{ default: ComponentType }> => ({ default: (await loader())[name] }));
  function LazyPage() {
    return <Suspense fallback={<p className="route-loading" role="status">Cargando…</p>}><Page /></Suspense>;
  }
  return LazyPage;
}

const UsersPage = lazyPage(() => import('../pages/UsersPage'), 'UsersPage');
const OrderRegistrationPage = lazyPage(() => import('../pages/OrderRegistrationPage'), 'OrderRegistrationPage');
```

**Resultado:** el JavaScript inicial pasa de 572 KB a 288 KB sin comprimir (91 KB con gzip). Leaflet y sus estilos (150 KB y 16 KB) se descargan solo en las páginas con mapa. El `Suspense` se ubica dentro de cada layout, por lo que la navegación lateral no se desmonta durante la carga.

### 5.5 Área 5: sustitución de librerías por APIs nativas

**Diagnóstico:** el proyecto no usa librerías como `moment` o `lodash`; el formateo de fechas ya emplea `Intl.DateTimeFormat`. La dependencia prescindible era la fuente web Inter (`@fontsource/inter`), con tres variantes descargadas solo para el texto general.

ANTES (`src/frontend/src/main.tsx` y `tokens.css`):

```ts
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
```

```css
--font-body: 'Inter', sans-serif;
```

DESPUÉS:

```css
/* Fuentes nativas del sistema para el texto; sin descarga de Inter. */
--font-body: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Resultado:** se elimina una dependencia de producción y 3 descargas de fuentes; el peso de fuentes pasa de 76,9 KB a 28,8 KB (−62,5 %). Outfit se conserva para los títulos, como elemento de identidad visual, y sus dos archivos se precargan para evitar desplazamientos al sustituirse la fuente.

### 5.6 Área 6: SVG en línea

**Diagnóstico:** el logotipo se cargaba como `<img src="ecoruta-logo.svg">`, con una petición adicional en cada página.

ANTES (`src/frontend/src/components/BrandLogo.tsx`):

```tsx
import logo from '../assets/ecoruta-logo.svg';
export function BrandLogo() { return <img className="brand-logo" src={logo} alt="EcoRuta Huancayo" width="72" height="72" />; }
```

DESPUÉS:

```tsx
export function BrandLogo() {
  return <svg className="brand-logo" role="img" aria-label="EcoRuta Huancayo" viewBox="0 0 120 120" width="72" height="72" fill="none">
    <rect width="120" height="120" rx="28" fill="#065F46" />
    <path d="M28 84C28 84 38 48 54 48C70 48 62 76 78 76C90 76 94 36 94 36" stroke="#34D399" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    {/* … círculos y trazo del logotipo */}
  </svg>;
}
```

**Resultado:** una petición HTTP menos en cada página, con el nombre accesible intacto. Los marcadores del mapa ya eran elementos HTML (`L.divIcon`) y no requerían cambios.

### 5.7 Área 7: `Cache-Control`, ETag y TanStack Query

**Diagnóstico:** los recursos con hash no tenían política de caché y el cliente forzaba `cache: 'no-store'` en todas las peticiones.

**Implementación en tres niveles:**

1. **nginx:** `public, max-age=31536000, immutable` para `/assets/` (nombres con hash) y `no-cache` para el documento de la SPA.
2. **API:** las respuestas personales y operativas mantienen `no-store` por seguridad. Los catálogos de baja sensibilidad (roles y vehículos) usan `private, no-cache`: el navegador conserva una copia privada y la revalida con el ETag que genera Express, de modo que el servidor responde `304 Not Modified` sin cuerpo si nada cambió.
3. **Cliente:** TanStack Query 5.104.5 mantiene esos catálogos en memoria durante 5 minutos y los invalida al registrar o editar un vehículo.

ANTES:

```ts
// src/backend/src/vehicles/vehicles.controller.ts
@Get() @Header('Cache-Control', 'no-store') list() { return this.vehicles.list(); }

// src/frontend/src/services/api.ts
response = await fetch(`${baseUrl}${path}`, { ...options, credentials: 'include', cache: 'no-store' });
```

DESPUÉS:

```ts
// src/backend/src/common/cache-policy.ts
export const NO_STORE = 'no-store';
export const PRIVATE_REVALIDATE = 'private, no-cache';

// src/backend/src/vehicles/vehicles.controller.ts
@Get() @Header('Cache-Control', PRIVATE_REVALIDATE) list(@Query() query: PaginationQueryDto) { return this.vehicles.list(query); }

// src/frontend/src/services/api.ts
response = await fetch(`${baseUrl}${path}`, { ...options, credentials: 'include', cache: options.cache ?? 'no-store' });

// src/frontend/src/pages/VehiclesPage.tsx
const query = useQuery({ queryKey: catalogKeys.vehicles(page), queryFn: ({ signal }) => vehiclesApi.list(page, signal) }, queryClient);
```

```nginx
location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable" always;
  try_files $uri =404;
}
location = /index.html {
  add_header Cache-Control "no-cache" always;
}
```

**Resultado verificado:**

- La revalidación de `/roles` devuelve `304 Not Modified` con 0 bytes de cuerpo.
- Al recargar la aplicación, el JavaScript y el CSS principales se sirven desde la caché del navegador con 0 bytes transferidos.
- Al volver a la página de vehículos dentro de la SPA no se emite una nueva petición.

Como nginx sustituye las cabeceras heredadas cuando un bloque define `add_header`, la política de seguridad de contenido se repite en cada `location`, y se comprobó su presencia en todas las respuestas.

### 5.8 Área 8: compresión Brotli y Gzip

**Diagnóstico:** ninguna capa comprimía las respuestas: la API enviaba JSON sin comprimir y nginx enviaba el JavaScript de 572 KB tal cual.

ANTES (`src/backend/src/common/configure-app.ts`):

```ts
export function configureApp(app: INestApplication, origin: string) {
  app.use(helmet());
  app.enableCors({ origin, credentials: true /* … */ });
  // sin compresión
}
```

DESPUÉS:

```ts
export const COMPRESSION_OPTIONS: compression.CompressionOptions = {
  threshold: 1024,
  level: 6,
  brotli: { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } },
};

export function configureApp(app: INestApplication, origin: string) {
  app.use(helmet());
  app.use(compression(COMPRESSION_OPTIONS)); // Brotli si el cliente lo acepta; si no, Gzip
  // …
}
```

En el frontend, el build genera archivos `.gz` con nivel 9 mediante un plugin de Vite basado en `node:zlib`, y nginx los sirve con `gzip_static on` sin coste de CPU por petición. La imagen oficial de nginx no incluye el módulo Brotli, por lo que Brotli se aplica en la API y Gzip en los recursos estáticos.

| Recurso | Sin comprimir | Gzip | Brotli |
|---|---:|---:|---:|
| Detalle de ruta (API) | 10.467 B | 3.121 B (−70,2 %) | 2.937 B (−71,9 %) |
| JavaScript inicial | 287.771 B | 91.375 B (−68,2 %) | — |
| Cobertura GeoJSON | 266.201 B | 27.272 B (−89,8 %) | — |

## 6. Resultados comparativos ANTES y DESPUÉS

### 6.1 Escritorio (perfil de referencia)

| Página | Métrica | ANTES | DESPUÉS | Variación | Umbral | Cumple |
|---|---|---:|---:|---:|---:|:---:|
| Login | Score | 86 | 100 | +16,3 % | ≥ 90 | Sí |
| Login | FCP | 0,90 s | 0,32 s | −64,4 % | ≤ 1,0 s | Sí |
| Login | LCP | 2,48 s | 0,53 s | −78,6 % | ≤ 1,4 s | Sí |
| Login | TBT | 0 ms | 0 ms | — | ≤ 85 ms | Sí |
| Login | CLS | 0 | 0 | — | ≤ 0,02 | Sí |
| Login | Peso | 2.599,8 KB | 198,9 KB | −92,3 % | ≤ 1,1 MB | Sí |
| Login | Peticiones | 10 | 7 | −30,0 % | — | — |
| Panel de administración | Score | 98 | 100 | +2,0 % | ≥ 90 | Sí |
| Panel de administración | FCP / LCP | 0,90 / 0,97 s | 0,34 / 0,53 s | −62,2 % / −45,4 % | ≤ 1,0 / ≤ 1,4 s | Sí |
| Panel de administración | TBT / CLS | 0 ms / 0,011 | 0 ms / 0,013 | — | ≤ 85 ms / ≤ 0,02 | Sí |
| Panel de administración | Peso | 691,0 KB | 134,7 KB | −80,5 % | ≤ 1,1 MB | Sí |
| Seguimiento operativo | Score | 98 | 100 | +2,0 % | ≥ 90 | Sí |
| Seguimiento operativo | FCP / LCP | 0,82 / 1,00 s | 0,37 / 0,56 s | −54,9 % / −44,0 % | ≤ 1,0 / ≤ 1,4 s | Sí |
| Seguimiento operativo | TBT / CLS | 0 ms / 0 | 0 ms / 0 | — | ≤ 85 ms / ≤ 0,02 | Sí |
| Seguimiento operativo | Peso | 691,9 KB | 138,8 KB | −79,9 % | ≤ 1,1 MB | Sí |
| Registrar pedido | Score | 94 | 100 | +6,4 % | ≥ 90 | Sí |
| Registrar pedido | FCP / LCP | 0,90 / 1,46 s | 0,41 / 0,59 s | −54,4 % / −59,6 % | ≤ 1,0 / ≤ 1,4 s | Sí |
| Registrar pedido | TBT / CLS | 0 ms / 0 | 0 ms / 0,012 | — | ≤ 85 ms / ≤ 0,02 | Sí |
| Registrar pedido | Peso | 1.360,9 KB | 627,0 KB | −53,9 % | ≤ 1,1 MB | Sí |

**Las cuatro páginas cumplen todos los umbrales de la consigna en el perfil de referencia.**

### 6.2 Móvil (complementario)

| Página | Score | FCP | LCP | TBT | CLS | Peso |
|---|---:|---:|---:|---:|---:|---:|
| Login | 63 → 98 | 4,70 → 1,36 s | 14,56 → 2,26 s | 0 → 0 ms | 0 → 0 | 2.599,8 → 171,2 KB |
| Panel de administración | 70 → 98 | 4,70 → 1,43 s | 4,96 → 2,27 s | 0 → 0 ms | 0 → 0 | 691,0 → 134,7 KB |
| Seguimiento operativo | 70 → 98 | 4,43 → 1,52 s | 5,07 → 2,16 s | 31 → 0 ms | 0,001 → 0 | 691,9 → 138,8 KB |
| Registrar pedido | 66 → 92 | 4,40 → 1,75 s | 6,35 → 2,94 s | 89 → 139 ms | 0,001 → 0 | 1.071,8 → 341,0 KB |

El TBT móvil de «Registrar pedido» aumenta porque Leaflet y las geometrías de cobertura se procesan ahora al visitar la página, en lugar de durante la carga inicial de toda la aplicación. El coste se traslada a la única página que lo necesita, y el resto de páginas deja de pagarlo.

### 6.3 Composición del peso del login (escritorio)

| Tipo de recurso | ANTES | DESPUÉS | Variación |
|---|---:|---:|---:|
| Imágenes | 1.911,2 KB | 69,8 KB | −96,3 % |
| JavaScript | 558,9 KB | 89,9 KB | −83,9 % |
| Fuentes | 76,9 KB | 28,8 KB | −62,5 % |
| CSS | 50,5 KB | 7,8 KB | −84,6 % |
| Documento, API y otros | 2,3 KB | 2,6 KB | — |
| **Total** | **2.599,8 KB** | **198,9 KB** | **−92,3 %** |

## 7. Análisis de impacto ambiental con SWDM v4

### 7.1 Coeficientes oficiales

Fuente: [Sustainable Web Design, «Estimating digital emissions»](https://sustainablewebdesign.org/estimating-digital-emissions/), versión 4 del modelo.

| Segmento | Energía operativa (kWh/GB) | Energía incorporada (kWh/GB) |
|---|---:|---:|
| Centros de datos | 0,055 | 0,012 |
| Redes | 0,059 | 0,013 |
| Dispositivos de usuario | 0,080 | 0,081 |
| **Total** | **0,194** | **0,106** |

- Intensidad energética total: 0,194 + 0,106 = **0,300 kWh/GB**.
- Intensidad de carbono de la red eléctrica: **494 g CO2e/kWh** (media mundial, Ember), valor por defecto del modelo.
- Factor de emisión resultante: 0,300 × 494 = **148,2 g CO2e/GB**.

### 7.2 Fórmulas

Para cada segmento:

```text
Emisiones (g CO2e) = Datos transferidos (GB) × Intensidad energética (kWh/GB) × 494 g CO2e/kWh
```

Y en total:

```text
E (kWh)     = GB × (0,055 + 0,059 + 0,080 + 0,012 + 0,013 + 0,081) = GB × 0,300
CO2e (g)    = E × 494
```

**Supuestos declarados:**

- Primera visita, sin caché (ratio de visitante nuevo = 1).
- Factor de hosting verde = 0, porque el hosting no está certificado.
- 1 GB = 10⁹ bytes.
- El peso es la transferencia total medida por Lighthouse (`transferSize`) en escritorio.

### 7.3 Cálculo paso a paso: login (escritorio)

| Paso | ANTES | DESPUÉS |
|---|---:|---:|
| Transferencia | 2.599,8 KiB = 2.662.195 B | 198,9 KiB = 203.674 B |
| Datos (GB) | 0,0026622 GB | 0,0002037 GB |
| Energía (× 0,300 kWh/GB) | 0,000799 kWh | 0,0000611 kWh |
| Emisiones (× 494 g/kWh) | **0,3945 g CO2e** | **0,0302 g CO2e** |
| Reducción | — | **−92,3 %** |

### 7.4 Resultados por página (escritorio)

| Página | Energía ANTES | Energía DESPUÉS | g CO2e ANTES | g CO2e DESPUÉS | Reducción |
|---|---:|---:|---:|---:|---:|
| Login | 0,000799 kWh | 0,0000611 kWh | 0,3945 | 0,0302 | −92,3 % |
| Panel de administración | 0,000212 kWh | 0,0000414 kWh | 0,1049 | 0,0204 | −80,5 % |
| Seguimiento operativo | 0,000213 kWh | 0,0000426 kWh | 0,1050 | 0,0211 | −79,9 % |
| Registrar pedido | 0,000418 kWh | 0,000193 kWh | 0,2065 | 0,0952 | −53,9 % |
| **Media de las 4 páginas** | — | — | **0,2027** | **0,0417** | **−79,4 %** |

### 7.5 Proyección anual

Base de cálculo: 500.000 visitas al año, la misma del modelo de referencia de la actividad. Es un supuesto de dimensionamiento, no una medición de tráfico real; el resultado se recalcula con `node scripts/swdm-v4.cjs <antes.json> <despues.json> <visitas>`.

| Escenario | ANTES | DESPUÉS | Ahorro anual |
|---|---:|---:|---:|
| Login (página de entrada) | 197,27 kg CO2e | 15,09 kg CO2e | **182,18 kg CO2e** |
| Media de las 4 páginas | 101,37 kg CO2e | 20,86 kg CO2e | **80,51 kg CO2e** |

En visitas recurrentes el ahorro es mayor: los recursos con hash se sirven desde la caché `immutable` sin transferencia, lo que en el modelo equivale a un *Data Cache Ratio* cercano a la totalidad de los recursos estáticos. Este efecto no se incluye en la tabla anterior, que considera solo primeras visitas.

### 7.6 Verificación del cálculo

- El script [`scripts/swdm-v4.cjs`](../../../scripts/swdm-v4.cjs) contiene los coeficientes y las fórmulas, y genera [`evidencias/swdm-v4-resultados.json`](evidencias/swdm-v4-resultados.json).
- Las pruebas [`scripts/swdm-v4.test.cjs`](../../../scripts/swdm-v4.test.cjs) fijan los coeficientes y comprueban que 1 GB equivale a 0,300 kWh y 148,2 g CO2e, y que el login ANTES equivale a 0,3945 g CO2e. Se ejecutan en cada pipeline de CI.

## 8. Evidencias y auditoría automatizada

| Evidencia | Ubicación |
|---|---|
| Resumen Lighthouse ANTES (8 mediciones) | [`evidencias/lighthouse/antes/resumen-antes.json`](evidencias/lighthouse/antes/resumen-antes.json) |
| Informes Lighthouse del login ANTES | [`login-escritorio.html`](evidencias/lighthouse/antes/login-escritorio.html) · [`login-movil.html`](evidencias/lighthouse/antes/login-movil.html) |
| Resumen Lighthouse DESPUÉS (8 mediciones) | [`evidencias/lighthouse/despues/resumen-despues.json`](evidencias/lighthouse/despues/resumen-despues.json) |
| Informes Lighthouse del login DESPUÉS | [`login-escritorio.html`](evidencias/lighthouse/despues/login-escritorio.html) · [`login-movil.html`](evidencias/lighthouse/despues/login-movil.html) |
| Cálculo SWDM v4 | [`evidencias/swdm-v4-resultados.json`](evidencias/swdm-v4-resultados.json) |
| Auditoría continua | Workflow «Green IT & Performance Audit» ([`.github/workflows/green-audit.yml`](../../../.github/workflows/green-audit.yml)), ejecución #2 aprobada; informes en el artefacto `lighthouse-reports` |
| Pruebas automatizadas | Backend: `src/common/green-it.spec.ts` (9 pruebas). Frontend: `src/test/green-it.test.tsx` (7 pruebas). Batería completa: 547 unitarias y 139 de integración en backend, 396 en frontend |

Los 32 informes completos (16 ANTES y 16 DESPUÉS) se conservan en la carpeta local `.local/lighthouse/`, excluida del repositorio por su tamaño (8,5 MB).

## 9. Limitaciones y decisiones

1. **Perfil de referencia:** los umbrales se evalúan en escritorio por la razón expuesta en la sección 3. En móvil todas las páginas mejoran de forma sustancial (scores de 92 a 98), aunque FCP y LCP superan 1,0 s y 1,4 s.
2. **Mosaicos del mapa:** el peso de «Registrar pedido» incluye mosaicos de OpenStreetMap servidos por un tercero, cuya cantidad varía entre mediciones (entre unos 437 y 627 KB en total). No dependen del proyecto.
3. **Brotli en estáticos:** la imagen oficial de nginx no incluye el módulo Brotli; se aplica Gzip precomprimido a los estáticos y Brotli a la API.
4. **Seguridad frente a caché:** la caché privada se limita a catálogos de baja sensibilidad; los datos personales y operativos conservan `no-store`, conforme al análisis OWASP del proyecto.
5. **Cambio tipográfico:** el texto general usa la fuente del sistema operativo en lugar de Inter; los títulos mantienen Outfit.
6. **Estabilidad visual:** la aceleración del renderizado reveló desplazamientos que antes no se apreciaban (CLS de 0,282 en móvil en el seguimiento). Se corrigieron precargando las fuentes de título y reservando el espacio de los resúmenes mientras cargan.
7. **Proyección anual:** depende del supuesto de 500.000 visitas y de la intensidad media mundial de la red; con valores regionales el resultado varía proporcionalmente.

## 10. Conclusiones

Las 8 optimizaciones se implementaron sobre el stack real del proyecto, con código comparativo, pruebas automatizadas y mediciones reproducibles. En el perfil de referencia, las cuatro páginas auditadas alcanzan 100/100 y cumplen todos los umbrales de la consigna. El peso del login se reduce un 92,3 % y sus emisiones por visita pasan de 0,3945 a 0,0302 g CO2e según SWDM v4. Con una base de 500.000 visitas anuales, esto supone un ahorro estimado de 182,18 kg CO2e al año en la página de entrada. La auditoría queda automatizada en GitHub Actions para impedir regresiones.

## Referencias

- Sustainable Web Design. *Estimating digital emissions* (SWDM v4). <https://sustainablewebdesign.org/estimating-digital-emissions/>
- W3C Sustainable Web Design Community Group. *Web Sustainability Guidelines (WSG)*. <https://www.w3.org/TR/web-sustainability-guidelines/>
- Google. *Lighthouse* y *Lighthouse CI*. <https://github.com/GoogleChrome/lighthouse-ci>
