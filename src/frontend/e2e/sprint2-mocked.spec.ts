import { expect, test } from '@playwright/test';

const user = { usuario_id: 'admin-id', email: 'admin@example.test', rol: { rol_id: 'role-id', nombre: 'Administrador' } };
const order = { pedido_id: 'order-id', cliente_id: 'client-id', peso_kg: '2.5', volumen_m3: null, descripcion_carga: 'Carga', estado: 'PENDIENTE', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', creado_en: '2026-10-01T12:00:00Z', ventana_inicio: '2026-10-02T14:00:00Z', ventana_fin: '2026-10-02T16:00:00Z', cliente: { cliente_id: 'client-id', nombre: 'Cliente', telefono: null, email: null, direccion: 'Destino', referencia: null, latitud: '-12', longitud: '-75' } };
const vehicle = { vehiculo_id: 'vehicle-id', placa: 'ABC-123', tipo: 'Furgón', capacidad_carga_kg: '1000', capacidad_volumen_m3: '12', consumo_km_l: '8', factor_emision_kg_co2_km: '0.25', anio_fabricacion: 2022, estado: 'DISPONIBLE' };

test.beforeEach(async ({ page }) => {
  let currentOrder = { ...order };
  let vehicles = [{ ...vehicle }];
  await page.route('http://localhost:3000/auth/me', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...user, expiresAt: Date.now() + 3600000 }) }));
  await page.route('http://localhost:3000/orders/order-id**', async route => {
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as { estado: string };
      currentOrder = { ...currentOrder, estado: body.estado };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentOrder) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentOrder) });
  });
  await page.route('http://localhost:3000/vehicles**', async route => {
    if (route.request().method() === 'POST') {
      const created = { ...route.request().postDataJSON(), vehiculo_id: 'new-vehicle' };
      vehicles = [...vehicles, created];
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
    }
    if (route.request().method() === 'PATCH') {
      const id = route.request().url().split('/').pop();
      const updated = { ...vehicles.find(item => item.vehiculo_id === id), ...route.request().postDataJSON() };
      vehicles = vehicles.map(item => item.vehiculo_id === id ? updated : item);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(updated) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(vehicles) });
  });
});

test('HGR-22 actualiza el estado y lo conserva al recargar', async ({ page }) => {
  await page.goto('/pedidos/order-id');
  await expect(page).not.toHaveURL(/login/);
  await expect(page.getByText('Pendiente')).toBeVisible();
  await page.getByLabel('Actualizar estado').selectOption('EN_PREPARACION');
  await page.getByRole('button', { name: 'Actualizar estado' }).click();
  await expect(page.getByRole('status')).toContainText('Estado actualizado correctamente.');
  await page.reload();
  await expect(page.getByText('En preparación')).toBeVisible();
});

test('HGR-24 registra y lista un vehículo', async ({ page }) => {
  await page.goto('/acceso/admin');
  await page.getByRole('link', { name: 'Gestionar vehículos' }).click();
  await expect(page).toHaveURL(/\/vehiculos$/);
  await expect(page.getByRole('cell', { name: 'ABC-123' })).toBeVisible();
  await page.getByLabel('Placa').fill('XYZ-999');
  await page.getByLabel('Tipo').fill('Camión');
  await page.getByLabel('Capacidad de carga (kg)').fill('1500');
  await page.getByLabel('Consumo (km/l)').fill('7');
  await page.getByLabel('Emisión (kg CO₂/km)').fill('0.3');
  await page.getByLabel('Año de fabricación').fill('2023');
  await page.getByRole('button', { name: 'Registrar vehículo' }).click();
  await expect(page.getByRole('status')).toContainText('Vehículo registrado correctamente.');
  await expect(page.getByRole('cell', { name: 'XYZ-999' })).toBeVisible();
});
