import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PasswordService } from './password.service';
describe('Hash seguro', () => {
  const password = randomBytes(24).toString('hex');
  const service = new PasswordService();
  it('verifica Argon2id y rechaza una contraseña diferente', async () => {
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await service.verify(hash, password)).toBe(true);
    expect(await service.verify(hash, 'different')).toBe(false);
  });
  it('rechaza usuarios sin hash e información corrupta', async () => {
    expect(await service.verify(null, password)).toBe(false);
    expect(await service.verify('corrupt', password)).toBe(false);
  });
});
