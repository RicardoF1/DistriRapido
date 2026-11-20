import { trustProxySetting } from './trust-proxy';

describe('trustProxySetting', () => {
  it('no confía en proxys si la variable está vacía o es "false"', () => {
    expect(trustProxySetting(undefined)).toBeUndefined();
    expect(trustProxySetting('  ')).toBeUndefined();
    expect(trustProxySetting('false')).toBeUndefined();
  });
  it('acepta "true", un número de saltos y listas de IP/CIDR', () => {
    expect(trustProxySetting('true')).toBe(true);
    expect(trustProxySetting(' 3 ')).toBe(3);
    expect(trustProxySetting('10.0.0.0/8, 127.0.0.1')).toBe('10.0.0.0/8, 127.0.0.1');
  });
  it('rechaza saltos fuera de rango y valores no reconocidos', () => {
    expect(() => trustProxySetting('0')).toThrow('TRUST_PROXY');
    expect(() => trustProxySetting('11')).toThrow('TRUST_PROXY');
    expect(() => trustProxySetting('loopback; rm')).toThrow('TRUST_PROXY');
  });
});
