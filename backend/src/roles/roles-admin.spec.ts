import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_NAMES } from './roles';
it('solo enumera roles de la línea base para administración', async () => {
  const findMany = jest.fn().mockResolvedValue([]);
  const service = new RolesService({ rol: { findMany } } as unknown as PrismaService);
  expect(await new RolesController(service).list()).toEqual([]);
  expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { nombre: { in: Object.values(ROLE_NAMES) } } }));
});
