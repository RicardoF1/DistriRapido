import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DriverDataDto } from './driver-data.dto';

const valid = { nombre_completo: 'Conductor de prueba', dni: 'fixture-documento', licencia_categoria: 'fixture', anios_experiencia: 0, telefono: 'fixture-telefono' };
describe('US-008 / HGR-26: datos documentados del conductor', () => {
  it('acepta y normaliza datos sin imponer catálogos no aprobados', async () => {
    const dto = plainToInstance(DriverDataDto, { ...valid, nombre_completo: '  Conductor de prueba  ' });
    expect(dto.nombre_completo).toBe(valid.nombre_completo);
    expect(await validate(dto)).toHaveLength(0);
  });
  it.each(['nombre_completo', 'dni', 'licencia_categoria', 'telefono', 'anios_experiencia'])('rechaza ausencia de %s', async field => {
    const data: Record<string, unknown> = { ...valid }; delete data[field];
    expect((await validate(plainToInstance(DriverDataDto, data))).length).toBeGreaterThan(0);
  });
  it.each([
    { nombre_completo: '   ' }, { nombre_completo: 'a'.repeat(151) }, { dni: null }, { dni: 'a'.repeat(21) },
    { licencia_categoria: '' }, { licencia_categoria: 'a'.repeat(21) }, { telefono: 'a'.repeat(31) },
    { anios_experiencia: -1 }, { anios_experiencia: 1.5 }, { anios_experiencia: '1' }, { anios_experiencia: 32768 },
  ])('rechaza tipos/rangos/longitudes inválidos %j', async change => {
    expect((await validate(plainToInstance(DriverDataDto, { ...valid, ...change }))).length).toBeGreaterThan(0);
  });
  it('rechaza campos ajenos con la política global existente', async () => {
    const dto = plainToInstance(DriverDataDto, { ...valid, disponibilidad_inicio: '08:00', password: 'fixture' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.map(error => error.property)).toEqual(expect.arrayContaining(['disponibilidad_inicio', 'password']));
  });
});
