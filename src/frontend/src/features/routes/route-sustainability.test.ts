import { routeFixture } from '../../test/route-fixture';
import { checkSustainability, emissionsPreview, initialSustainabilityForm, sustainabilityProblem, type SustainabilityForm } from './route-sustainability';

const [version] = routeFixture.versiones;
const filled: SustainabilityForm = { distancia_km: '12.5', combustible_l: '1.25', factor_emision_kg_co2_km: '0.21', origen_datos: 'ESTIMADO', costo_combustible: '', observaciones: '' };

describe('US-021 formulario de sostenibilidad', () => {
  it('precarga distancia, combustible y factor desde la versión y su vehículo', () => {
    expect(initialSustainabilityForm({ ...version, distancia_m: '12345.678' })).toEqual({ distancia_km: '12.346', combustible_l: '1.235', factor_emision_kg_co2_km: '0.21', origen_datos: '', costo_combustible: '', observaciones: '' });
  });

  it('deja vacíos los datos que no puede deducir si la respuesta no trae vehículo', () => {
    expect(initialSustainabilityForm({ ...version, vehiculo: undefined })).toMatchObject({ distancia_km: '0.1', combustible_l: '', factor_emision_kg_co2_km: '' });
  });

  it('acepta cero combustible y cero factor (vehículo eléctrico) y omite opcionales vacíos', () => {
    expect(checkSustainability({ ...filled, combustible_l: '0', factor_emision_kg_co2_km: '0' }, 'CONFIRMADA').input).toEqual({ distancia_km: 12.5, combustible_l: 0, factor_emision_kg_co2_km: 0, origen_datos: 'ESTIMADO' });
  });

  it('combina en un solo mensaje lo que falta y lo que hay que corregir', () => {
    const check = checkSustainability({ ...filled, distancia_km: '0', origen_datos: '' }, 'CONFIRMADA');
    expect(check.input).toBeUndefined();
    expect(check.missing).toEqual(['origen_datos']);
    expect(sustainabilityProblem(check)).toBe('Falta información requerida: origen de los datos. Revisa: distancia recorrida (km).');
  });

  it('solo admite datos medidos en una ruta completada', () => {
    const measured = { ...filled, origen_datos: 'MEDIDO' as const };
    expect(checkSustainability(measured, 'EN_CURSO').invalid).toEqual({ origen_datos: 'Los datos medidos solo se pueden registrar cuando la ruta está completada. Registra datos estimados o espera a que la ruta termine.' });
    expect(checkSustainability(measured, 'COMPLETADA').input).toMatchObject({ origen_datos: 'MEDIDO' });
  });

  it.each(['abc', '1e3', '10000.5', '-1'])('rechaza la distancia %s', distancia_km => {
    expect(checkSustainability({ ...filled, distancia_km }, 'CONFIRMADA').invalid).toHaveProperty('distancia_km');
  });

  it('calcula la vista previa de emisiones solo con distancia y factor válidos', () => {
    expect(emissionsPreview(filled)).toBe('2.625');
    expect(emissionsPreview({ ...filled, factor_emision_kg_co2_km: '' })).toBeUndefined();
  });
});
