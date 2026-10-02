import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';
describe('LoginDto', () => {
  it('normaliza únicamente email y conserva la contraseña', async () => {
    const dto = plainToInstance(LoginDto, { email: ' TEST@EXAMPLE.COM ', password: ' with spaces ' });
    expect(dto.email).toBe('test@example.com'); expect(dto.password).toBe(' with spaces '); expect(await validate(dto)).toHaveLength(0);
  });
  it.each([{ email: 1, password: 1 }, { email: 'invalid', password: '' }, { email: 'a'.repeat(256), password: 'x'.repeat(129) }])('rechaza datos inválidos', async (input) => {
    expect((await validate(plainToInstance(LoginDto, input))).length).toBeGreaterThan(0);
  });
});
