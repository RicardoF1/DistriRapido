import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ApiError } from '../../services/api';
import { driverProfileApi, type DeliveryIncident } from '../../services/driver-profile-api';
import { DeliveryIncidents } from './DeliveryIncidents';

vi.mock('../../services/driver-profile-api', async () => ({
  ...await vi.importActual<typeof import('../../services/driver-profile-api')>('../../services/driver-profile-api'),
  driverProfileApi: { createIncident: vi.fn() },
}));

const stored: DeliveryIncident = { incidencia_id: 'inc-1', tipo: 'VIA_BLOQUEADA', descripcion: 'Obra en la avenida', detalle_complementario: 'Desvío por Jr. Puno', registrado_en: '2030-01-01T15:00:00Z' };
const onRegistered = vi.fn();
const onUnauthorized = vi.fn();
function renderIncidents(props: Partial<Parameters<typeof DeliveryIncidents>[0]> = {}) {
  return render(<DeliveryIncidents deliveryId="stop" sequence={1} incidents={[]} canRegister onRegistered={onRegistered} onUnauthorized={onUnauthorized} {...props} />);
}
async function openForm() {
  await userEvent.click(screen.getByRole('button', { name: 'Registrar incidencia' }));
  return screen.getByRole('form', { name: 'Registrar incidencia de la parada 1' });
}

beforeEach(() => { vi.clearAllMocks(); vi.mocked(driverProfileApi.createIncident).mockResolvedValue({ parada_id: 'stop', incidencia: stored }); });

describe('US-018 / RF-015: registrar incidencias de entrega', () => {
  it('registra una incidencia con información complementaria y la notifica', async () => {
    renderIncidents();
    const form = await openForm();
    expect(within(form).getByLabelText('Tipo de incidencia *')).toHaveFocus();
    await userEvent.selectOptions(within(form).getByLabelText('Tipo de incidencia *'), 'Vía bloqueada');
    await userEvent.type(within(form).getByLabelText('Descripción *'), '  Obra en la avenida ');
    await userEvent.type(within(form).getByLabelText('Información complementaria (opcional)'), 'Desvío por Jr. Puno');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar incidencia' }));
    expect(driverProfileApi.createIncident).toHaveBeenCalledWith('stop', { tipo: 'VIA_BLOQUEADA', descripcion: 'Obra en la avenida', detalle_complementario: 'Desvío por Jr. Puno' });
    expect(onRegistered).toHaveBeenCalledWith(stored);
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar incidencia' })).toHaveFocus();
  });

  it('omite la información complementaria vacía', async () => {
    renderIncidents();
    const form = await openForm();
    await userEvent.selectOptions(within(form).getByLabelText('Tipo de incidencia *'), 'Cliente ausente');
    await userEvent.type(within(form).getByLabelText('Descripción *'), 'Nadie atiende');
    await userEvent.type(within(form).getByLabelText('Información complementaria (opcional)'), '   ');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar incidencia' }));
    expect(driverProfileApi.createIncident).toHaveBeenCalledWith('stop', { tipo: 'CLIENTE_AUSENTE', descripcion: 'Nadie atiende' });
  });

  it('rechaza información incompleta y señala cada dato faltante sin llamar al servidor', async () => {
    renderIncidents();
    const form = await openForm();
    await userEvent.type(within(form).getByLabelText('Descripción *'), '   ');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar incidencia' }));
    const type = within(form).getByLabelText('Tipo de incidencia *');
    const description = within(form).getByLabelText('Descripción *');
    expect(type).toHaveAttribute('aria-invalid', 'true');
    expect(type).toHaveAccessibleDescription('Selecciona el tipo de incidencia.');
    expect(description).toHaveAttribute('aria-invalid', 'true');
    expect(description).toHaveAccessibleDescription('Describe la incidencia.');
    expect(type).toHaveFocus();
    expect(driverProfileApi.createIncident).not.toHaveBeenCalled();
  });

  it('muestra junto a cada campo los datos faltantes que indica el backend', async () => {
    vi.mocked(driverProfileApi.createIncident).mockRejectedValue(new ApiError('descripcion: describe la incidencia.', 400));
    renderIncidents();
    const form = await openForm();
    await userEvent.selectOptions(within(form).getByLabelText('Tipo de incidencia *'), 'Otro');
    await userEvent.type(within(form).getByLabelText('Descripción *'), 'x');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar incidencia' }));
    expect(within(form).getByLabelText('Descripción *')).toHaveAccessibleDescription('Describe la incidencia.');
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it('muestra el rechazo del backend y conserva lo escrito', async () => {
    vi.mocked(driverProfileApi.createIncident).mockRejectedValue(new ApiError('La ruta no admite registrar incidencias en su estado actual.', 409));
    renderIncidents();
    const form = await openForm();
    await userEvent.selectOptions(within(form).getByLabelText('Tipo de incidencia *'), 'Otro');
    await userEvent.type(within(form).getByLabelText('Descripción *'), 'Detalle');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar incidencia' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('La ruta no admite registrar incidencias en su estado actual.');
    expect(within(form).getByLabelText('Descripción *')).toHaveValue('Detalle');
  });

  it('delega la sesión vencida', async () => {
    vi.mocked(driverProfileApi.createIncident).mockRejectedValue(new ApiError('Sesión vencida', 401));
    renderIncidents();
    const form = await openForm();
    await userEvent.selectOptions(within(form).getByLabelText('Tipo de incidencia *'), 'Otro');
    await userEvent.type(within(form).getByLabelText('Descripción *'), 'Detalle');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar incidencia' }));
    expect(onUnauthorized).toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('cancelar descarta el formulario y devuelve el foco', async () => {
    renderIncidents();
    const form = await openForm();
    await userEvent.type(within(form).getByLabelText('Descripción *'), 'Borrador');
    await userEvent.click(within(form).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar incidencia' })).toHaveFocus();
    await openForm();
    expect(screen.getByLabelText('Descripción *')).toHaveValue('');
  });

  it('lista las incidencias registradas y no permite registrar en rutas cerradas', () => {
    renderIncidents({ incidents: [stored], canRegister: false });
    const list = screen.getByRole('region', { name: 'Incidencias registradas (1)' });
    expect(within(list).getByText('Vía bloqueada')).toBeVisible();
    expect(within(list).getByText('Obra en la avenida')).toBeVisible();
    expect(within(list).getByText('Información complementaria: Desvío por Jr. Puno')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Registrar incidencia' })).not.toBeInTheDocument();
  });
});
