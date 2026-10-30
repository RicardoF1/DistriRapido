import { describe, expect, it } from 'vitest';
import { routeMethod, routeMethodDescription } from './route-method';
import { warningLabel } from './route-warnings';

describe('route and warning labels', () => {
  it('translates known methods and preserves an unknown code', () => {
    expect(routeMethod('SECUENCIAL_VENTANA')).toBe('Ventana m\u00e1s pr\u00f3xima');
    expect(routeMethodDescription('SECUENCIAL_VENTANA')).toContain('l\u00edmite de ventana');
    expect(routeMethod('METODO_DESCONOCIDO')).toBe('METODO_DESCONOCIDO');
    expect(routeMethodDescription('METODO_DESCONOCIDO')).toBe('');
  });

  it('translates known warnings and preserves unknown codes', () => {
    expect(warningLabel('VOLUMEN_NO_EVALUABLE')).toBe('Volumen no evaluable');
    expect(warningLabel('ADVERTENCIA_DESCONOCIDA')).toBe('ADVERTENCIA_DESCONOCIDA');
  });
});