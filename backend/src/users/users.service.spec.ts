import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
describe('Consulta de cuentas', () => {
  it('consulta email e ID junto al rol', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const service = new UsersService({ usuario: { findUnique } } as unknown as PrismaService);
    await service.findByEmail('test@example.com'); await service.findById('id');
    expect(findUnique).toHaveBeenNthCalledWith(1, { where: { email: 'test@example.com' }, include: { rol: true } });
    expect(findUnique).toHaveBeenNthCalledWith(2, { where: { usuario_id: 'id' }, include: { rol: true } });
  });
});
