import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AppRoutes } from '../routes/AppRoutes';
import { AuthContext } from '../features/auth/auth-context';
import { ApiError } from '../services/api';
import { loginResponse } from '../test/fixtures';
import { indicatorsApi, indicatorsQuery, type Indicators } from '../services/indicators-api';
import { show } from './IndicatorsPage';

vi.mock('../services/indicators-api', async () => ({
  ...await vi.importActual<typeof import('../services/indicators-api')>('../services/indicators-api'),
  indicatorsApi: { get: vi.fn() },
}));
vi.mock('../services/driver-profile-api', async () => ({
  ...await vi.importActual<typeof import('../services/driver-profile-api')>('../services/driver-profile-api'),
  driverProfileApi: { me: vi.fn().mockResolvedValue({ conductor_id: 'd', nombre_completo: 'Conductor', estado: 'ACTIVO' }), routes: vi.fn().mockResolvedValue([]), route: vi.fn(), updateDelivery: vi.fn(), createIncident: vi.fn() },
}));

const indicators: Indicators = {
  periodo: { desde: '2031-06-01', hasta: '2031-06-30' },
  datos_suficientes: true,
  operacion: {
    rutas_completadas: 4,
    entregas: { realizadas: 9, no_realizadas: 3, pendientes: 0, tasa_exito: 75 },
    incidencias: { total: 3, por_tipo: { CLIENTE_AUSENTE: 2, DIRECCION_INCORRECTA: 0, ACCESO_RESTRINGIDO: 0, VIA_BLOQUEADA: 1, VEHICULO_AVERIADO: 0, CARGA_DANADA: 0, OTRO: 0 } },
    duracion_media_min: 82.5,
  },
  sostenibilidad: {
    rutas_con_registro: 2, cobertura: 50, distancia_km: 25.125, combustible_l: 2.5, co2_kg: 5.025, co2_por_entrega_kg: 0.8375,
    costo_combustible: 40.5, registros_con_costo: 1, origen: { ESTIMADO: 1, MEDIDO: 1 },
  },
};
const empty: Indicators = {
  periodo: { desde: '2031-07-01', hasta: '2031-07-05' },
  datos_suficientes: false,
  operacion: { rutas_completadas: 0, entregas: { realizadas: 0, no_realizadas: 0, pendientes: 0, tasa_exito: null }, incidencias: { total: 0, por_tipo: indicators.operacion.incidencias.por_tipo }, duracion_media_min: null },
  sostenibilidad: { rutas_con_registro: 0, cobertura: null, distancia_km: null, combustible_l: null, co2_kg: null, co2_por_entrega_kg: null, costo_combustible: null, registros_con_costo: 0, origen: { ESTIMADO: 0, MEDIDO: 0 } },
};

let currentSearch = '';
function LocationProbe() { currentSearch = useLocation().search; return null; }
function renderPage(path = '/indicadores', role = 'Administrador') {
  const acceptSession = vi.fn();
  const session = { expiresAt: Date.now() + 900000, user: { ...loginResponse.user, rol: { ...loginResponse.user.rol, nombre: role } } };
  render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ session, acceptSession, restoring: false, restoreError: '', retryRestore: vi.fn(), logout: vi.fn() }}><AppRoutes /><LocationProbe /></AuthContext.Provider></MemoryRouter>);
  return { acceptSession };
}
const metric = (section: string, label: string) => within(screen.getByRole('region', { name: section })).getByText(label).nextSibling;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(indicatorsApi.get).mockResolvedValue(indicators);
});

describe('US-022 / RF-020: indicadores de la operación', () => {
  it('escenario 1: muestra los indicadores de operación, sostenibilidad e incidencias por tipo', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Indicadores de la operación', level: 1 })).toBeVisible();
    expect(await screen.findByText('Periodo del 01/06/2031 al 30/06/2031.')).toHaveAttribute('role', 'status');
    expect(metric('Operación', 'Rutas completadas')).toHaveTextContent('4');
    expect(metric('Operación', 'Tasa de entregas exitosas')).toHaveTextContent('75 %');
    expect(metric('Operación', 'Duración media de la ruta')).toHaveTextContent('82.5 min');
    expect(metric('Sostenibilidad', 'Cobertura del registro')).toHaveTextContent('50 %');
    expect(screen.getByText('2 de 4 rutas con registro de sostenibilidad')).toBeVisible();
    expect(metric('Sostenibilidad', 'Emisiones de CO₂')).toHaveTextContent('5.025 kg');
    expect(metric('Sostenibilidad', 'CO₂ por entrega exitosa')).toHaveTextContent('0.8375 kg');
    expect(metric('Sostenibilidad', 'Costo de combustible')).toHaveTextContent('S/ 40.5');
    expect(metric('Sostenibilidad', 'Origen de los datos')).toHaveTextContent('1 estimados · 1 medidos');
    const table = screen.getByRole('region', { name: 'Tabla de incidencias por tipo' });
    expect(within(table).getByRole('row', { name: /Cliente ausente/ })).toHaveTextContent('2');
    expect(within(table).getAllByRole('row')).toHaveLength(8);
    expect(indicatorsApi.get).toHaveBeenCalledWith({}, expect.any(AbortSignal));
    expect(screen.getByRole('link', { name: 'Indicadores' })).toHaveAttribute('aria-current', 'page');
  });

  it('reserva el espacio de las tarjetas mientras calcula (sin desplazamientos)', async () => {
    let finish!: (value: Indicators) => void;
    vi.mocked(indicatorsApi.get).mockReturnValue(new Promise(done => { finish = done; }));
    renderPage();
    expect(await screen.findByText('Calculando indicadores…')).toBeVisible();
    expect(metric('Operación', 'Rutas completadas')).toHaveTextContent('…');
    expect(screen.getByRole('region', { name: 'Operación' }).querySelector('dl')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('term')).toHaveLength(13);
    finish(indicators);
    await waitFor(() => expect(metric('Operación', 'Rutas completadas')).toHaveTextContent('4'));
  });

  it('escenario 2: consulta el periodo elegido y lo guarda en la URL', async () => {
    renderPage();
    await screen.findByText('Periodo del 01/06/2031 al 30/06/2031.');
    await userEvent.type(screen.getByLabelText('Desde'), '2031-06-10');
    await userEvent.type(screen.getByLabelText('Hasta'), '2031-06-20');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar periodo' }));
    await waitFor(() => expect(indicatorsApi.get).toHaveBeenLastCalledWith({ desde: '2031-06-10', hasta: '2031-06-20' }, expect.any(AbortSignal)));
    expect(currentSearch).toBe('?desde=2031-06-10&hasta=2031-06-20');
    await userEvent.click(screen.getByRole('button', { name: 'Últimos 30 días' }));
    await waitFor(() => expect(currentSearch).toBe(''));
    expect(indicatorsApi.get).toHaveBeenLastCalledWith({}, expect.any(AbortSignal));
  });

  it('lee el periodo de la URL e ignora fechas mal formadas', async () => {
    renderPage('/indicadores?desde=2031-06-10&hasta=junio');
    await screen.findByText('Periodo del 01/06/2031 al 30/06/2031.');
    expect(indicatorsApi.get).toHaveBeenCalledWith({ desde: '2031-06-10' }, expect.any(AbortSignal));
    expect(screen.getByLabelText('Desde')).toHaveValue('2031-06-10');
  });

  it('valida el rango antes de consultar', async () => {
    renderPage();
    await screen.findByText('Periodo del 01/06/2031 al 30/06/2031.');
    await userEvent.type(screen.getByLabelText('Desde'), '2031-06-20');
    await userEvent.type(screen.getByLabelText('Hasta'), '2031-06-10');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar periodo' }));
    expect(screen.getByRole('alert')).toHaveTextContent('La fecha «desde» no puede ser posterior a «hasta».');
    expect(screen.getByLabelText('Desde')).toHaveAttribute('aria-invalid', 'true');
    expect(indicatorsApi.get).toHaveBeenCalledTimes(1);
  });

  it('ruta infeliz: sin rutas completadas informa datos insuficientes y no muestra ceros engañosos', async () => {
    vi.mocked(indicatorsApi.get).mockResolvedValue(empty);
    renderPage();
    expect(await screen.findByText(/No existen datos suficientes para presentar indicadores en este periodo/)).toHaveAttribute('role', 'status');
    expect(metric('Operación', 'Tasa de entregas exitosas')).toHaveTextContent('Sin datos suficientes');
    expect(metric('Operación', 'Duración media de la ruta')).toHaveTextContent('Sin datos suficientes');
    expect(metric('Sostenibilidad', 'Emisiones de CO₂')).toHaveTextContent('Sin datos suficientes');
    expect(metric('Sostenibilidad', 'Costo de combustible')).toHaveTextContent('Sin datos suficientes');
    expect(metric('Operación', 'Rutas completadas')).toHaveTextContent('0');
  });

  it('muestra el error del backend con opción de reintentar y cierra la sesión expirada', async () => {
    vi.mocked(indicatorsApi.get).mockRejectedValueOnce(new ApiError('El periodo no puede superar 366 días.', 400));
    renderPage('/indicadores?desde=2020-01-01');
    expect(await screen.findByRole('alert')).toHaveTextContent('El periodo no puede superar 366 días.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }));
    await screen.findByText('Periodo del 01/06/2031 al 30/06/2031.');
    vi.mocked(indicatorsApi.get).mockRejectedValueOnce(new ApiError('Sesión expirada', 401));
    const { acceptSession } = renderPage();
    await waitFor(() => expect(acceptSession).toHaveBeenCalledWith(null));
  });

  it('usa un mensaje genérico si el fallo no es del backend', async () => {
    vi.mocked(indicatorsApi.get).mockRejectedValueOnce('fallo');
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron consultar los indicadores.');
  });

  it.each(['Usuario Final / Conductor', 'Auditor Externo'])('%s no accede a los indicadores', async role => {
    renderPage('/indicadores', role);
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Indicadores de la operación' })).not.toBeInTheDocument());
    expect(indicatorsApi.get).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'Indicadores' })).not.toBeInTheDocument();
  });

  it('el Operador / Técnico accede a los indicadores', async () => {
    renderPage('/indicadores', 'Operador / Técnico');
    expect(await screen.findByRole('heading', { name: 'Indicadores de la operación', level: 1 })).toBeVisible();
  });
});

describe('US-022: utilidades', () => {
  it('arma la consulta solo con las fechas presentes', () => {
    expect(indicatorsQuery({})).toBe('');
    expect(indicatorsQuery({ desde: '2031-06-01' })).toBe('?desde=2031-06-01');
    expect(indicatorsQuery({ desde: '2031-06-01', hasta: '2031-06-30' })).toBe('?desde=2031-06-01&hasta=2031-06-30');
  });

  it('formatea valores y nunca convierte null en 0', () => {
    expect(show(null)).toBe('Sin datos suficientes');
    expect(show(undefined)).toBe('…');
    expect(show(0)).toBe('0');
    expect(show(12.345, ' km', 3)).toBe('12.345 km');
  });
});
