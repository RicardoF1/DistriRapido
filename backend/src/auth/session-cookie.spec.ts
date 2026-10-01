import { readSessionCookie, sessionCookieOptions } from './session-cookie';
describe('Cookie de sesión', () => {
  it.each([undefined, '', 'unrelated=value', 'distrirapido_session=%ZZ'])('tolera ausencia o formato inválido: %s', (header) => {
    expect(readSessionCookie(header)).toBeUndefined();
  });
  it('lee solo la cookie del proyecto y decodifica su valor', () => {
    expect(readSessionCookie('another=yes; distrirapido_session=abc%2Edef; last=no')).toBe('abc.def');
    expect(sessionCookieOptions(false)).toEqual({ path: '/', httpOnly: true, sameSite: 'lax', secure: false });
  });
  it('prioriza cookie nueva y no recurre a la antigua si la nueva está corrupta', () => {
    expect(readSessionCookie('distrirapido_session=old; distrirapido_session_v2=new')).toBe('new');
    expect(readSessionCookie('distrirapido_session=old; distrirapido_session_v2=%ZZ')).toBeUndefined();
  });
});
