import { randomBytes } from 'node:crypto';
import { jwtLifetime, validateEnvironment } from './environment';
describe('Configuración', () => {
  const base = { JWT_SECRET: randomBytes(32).toString('hex'), DATABASE_URL: 'postgresql://localhost/example_test' };
  it('aplica defaults y convierte duración', () => {
    expect(validateEnvironment(base)).toMatchObject({ PORT: 3000, JWT_EXPIRES_SECONDS: 900, FRONTEND_ORIGIN: 'http://localhost:5173' });
    expect(jwtLifetime('60s')).toBe(60); expect(jwtLifetime('2h')).toBe(7200); expect(jwtLifetime('900')).toBe(900);
  });
  it.each(['0s', '1d', '25h', '-1', 'abc'])('rechaza duración %s', (value) => { expect(() => jwtLifetime(value)).toThrow(); });
  it.each([
    { JWT_SECRET: undefined }, { JWT_SECRET: 'short' }, { JWT_SECRET: 'REPLACE_WITH_RANDOM_SECRET_AT_LEAST_32_CHARACTERS' },
    { DATABASE_URL: undefined }, { DATABASE_URL: 'sqlite:test' }, { FRONTEND_ORIGIN: 'ftp://localhost' },
    { FRONTEND_ORIGIN: 'https://example.com/path' }, { PORT: 0 }, { PORT: 65536 }, { PORT: 1.5 },
  ])('rechaza configuración insegura o inválida', (override) => { expect(() => validateEnvironment({ ...base, ...override })).toThrow(); });
  it('acepta origen HTTPS y URL postgres', () => { expect(validateEnvironment({ ...base, DATABASE_URL: 'postgres://localhost/example_test', FRONTEND_ORIGIN: 'https://example.com', PORT: '4000', JWT_EXPIRES_IN: '1h' }).PORT).toBe(4000); });
});
