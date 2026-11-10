import type { ComponentType } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthLayout, LOGIN_LANDSCAPE } from '../layouts/AuthLayout';
import { BrandLogo } from '../components/BrandLogo';
import { Pagination } from '../components/ui/Pagination';
import { lazyPage } from '../routes/lazy-page';
import { request } from '../services/api';
import { usersApi } from '../services/users-api';
import { vehiclesApi } from '../services/vehicles-api';
import { PAGE_SIZE, pageQuery } from '../services/pagination';
import { CATALOG_STALE_TIME, catalogKeys, queryClient } from '../services/query-client';

// Green IT: comprobaciones de las optimizaciones del frontend (áreas 2 a 7).
afterEach(() => { vi.unstubAllGlobals(); });

describe('Área 3: imagen del login en formatos de nueva generación', () => {
  it('usa <picture> con AVIF y WebP adaptativos y respaldo JPEG decorativo', () => {
    const { container } = render(<AuthLayout><p>Formulario</p></AuthLayout>);
    const picture = container.querySelector('picture.login-backdrop')!;
    expect(picture).toHaveAttribute('aria-hidden', 'true');
    const sources = [...picture.querySelectorAll('source')];
    expect(sources.map(source => source.getAttribute('type'))).toEqual(['image/avif', 'image/webp']);
    for (const source of sources) {
      expect(source.getAttribute('srcset')!.split(',').map(entry => entry.trim().split(' ')[1])).toEqual(['640w', '1024w', '1672w']);
      expect(source).toHaveAttribute('sizes', '100vw');
    }
    const image = picture.querySelector('img')!;
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('width', '1672');
    expect(image).toHaveAttribute('height', '941');
    expect(image.getAttribute('src')).toMatch(/\.jpg$/);
    expect(LOGIN_LANDSCAPE.avif).toMatch(/\.avif 640w/);
    expect(container.innerHTML).not.toMatch(/\.png/);
  });
});

describe('Área 6: logotipo SVG en línea', () => {
  it('no genera una petición de imagen y mantiene el nombre accesible', () => {
    const { container } = render(<BrandLogo />);
    expect(screen.getByRole('img', { name: 'EcoRuta Huancayo' }).tagName.toLowerCase()).toBe('svg');
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('Área 4: carga diferida de páginas', () => {
  it('muestra un estado accesible mientras descarga y luego la página', async () => {
    let resolve!: (module: { Demo: ComponentType }) => void;
    const Demo = lazyPage(() => new Promise<{ Demo: ComponentType }>(done => { resolve = done; }), 'Demo');
    render(<MemoryRouter><Routes><Route path="/" element={<Demo />} /></Routes></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
    resolve({ Demo: () => <h1>Página diferida</h1> });
    expect(await screen.findByRole('heading', { name: 'Página diferida' })).toBeVisible();
  });
});

describe('Área 2: paginación de 12', () => {
  it('pide bloques de 12 y navega entre páginas', async () => {
    expect(PAGE_SIZE).toBe(12);
    expect(pageQuery(3)).toBe('page=3&pageSize=12');
    const onPage = vi.fn();
    render(<Pagination label="Paginación de prueba" page={1} pageSize={12} total={25} onPage={onPage} />);
    expect(screen.getByText('Página 1 de 3 · 25 registros')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onPage).toHaveBeenCalledWith(2);
  });
  it('se oculta cuando todo cabe en una página', () => {
    const { container } = render(<Pagination label="Sin páginas" page={1} pageSize={12} total={12} onPage={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('Área 7: caché HTTP y en cliente', () => {
  const reply = () => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"items":[],"total":0,"page":1,"pageSize":12}', { status: 200 })));
  it('los datos generales no se almacenan y los catálogos se revalidan con ETag', async () => {
    reply();
    await request('/users?page=1', {});
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ cache: 'no-store', credentials: 'include' });
    reply();
    await usersApi.roles();
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ cache: 'no-cache' });
    reply();
    await vehiclesApi.list(2);
    expect(vi.mocked(fetch).mock.calls[0][0]).toMatch(/\/vehicles\?page=2&pageSize=12$/);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ cache: 'no-cache' });
  });
  it('reutiliza el catálogo de roles durante 5 minutos', async () => {
    const roles = vi.spyOn(usersApi, 'roles').mockResolvedValue([{ rol_id: 'r', nombre: 'Administrador', descripcion: 'Rol de prueba' }]);
    const fetchRoles = () => queryClient.fetchQuery({ queryKey: catalogKeys.roles, queryFn: ({ signal }) => usersApi.roles(signal) });
    await fetchRoles(); await fetchRoles();
    expect(roles).toHaveBeenCalledTimes(1);
    expect(CATALOG_STALE_TIME).toBe(300_000);
    await queryClient.invalidateQueries({ queryKey: catalogKeys.roles });
    await waitFor(() => expect(roles).toHaveBeenCalledTimes(1));
    await fetchRoles();
    expect(roles).toHaveBeenCalledTimes(2);
  });
});
