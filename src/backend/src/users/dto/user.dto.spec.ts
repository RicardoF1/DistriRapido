import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { CreateUserDto, UpdateUserDto } from './user.dto';
describe('US-003 DTOs', () => {
  it('normaliza email y permite estado predeterminado', async () => {
    const dto = plainToInstance(CreateUserDto, { email: ' TEST@EXAMPLE.COM ', password: 'test-password-123', rol_id: randomUUID() });
    expect(dto.email).toBe('test@example.com'); expect(await validate(dto)).toHaveLength(0);
  });
  it.each([{ email: null }, { email: 'bad' }, { rol_id: null }, { rol_id: 'bad' }, { estado: null }, { estado: 'INVALIDO' }])('rechaza update %j', async (data) => {
    expect((await validate(plainToInstance(UpdateUserDto, data))).length).toBeGreaterThan(0);
  });
  it('permite PATCH parcial válido', async () => {
    expect(await validate(plainToInstance(UpdateUserDto, { email: 'A@EXAMPLE.COM', rol_id: randomUUID(), estado: 'ACTIVO' }))).toHaveLength(0);
  });
});
