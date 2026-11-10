import { lazy, Suspense, type ComponentType } from 'react';

// Green IT (área 4): carga diferida de una página exportada con nombre.
// El Suspense queda dentro del layout, de modo que la navegación lateral no se desmonta mientras se descarga.
export function lazyPage<Name extends string>(loader: () => Promise<Record<Name, ComponentType>>, name: Name) {
  const Page = lazy(async (): Promise<{ default: ComponentType }> => ({ default: (await loader())[name] }));
  function LazyPage() {
    return <Suspense fallback={<p className="route-loading" role="status">Cargando…</p>}><Page /></Suspense>;
  }
  LazyPage.displayName = `Lazy(${name})`;
  return LazyPage;
}
