import { PrismaService } from './prisma.service';
describe('Ciclo de conexión Prisma', () => {
  it('abre y cierra conexión', async () => {
    const service = new PrismaService();
    const connect = jest.spyOn(service, '$connect').mockResolvedValue(undefined); const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);
    await service.onModuleInit(); await service.onModuleDestroy(); expect(connect).toHaveBeenCalled(); expect(disconnect).toHaveBeenCalled();
  });
});
