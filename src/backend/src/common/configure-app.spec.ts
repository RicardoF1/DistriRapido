import { INestApplication } from '@nestjs/common';
import { configureApp } from './configure-app';
describe('Configuración HTTP', () => {
  it('configura origen explícito y validación global', () => {
    const app = { use: jest.fn(), enableCors: jest.fn(), useGlobalPipes: jest.fn(), useGlobalFilters: jest.fn() };
    configureApp(app as unknown as INestApplication, 'http://localhost:5173');
    expect(app.enableCors).toHaveBeenCalledWith(expect.objectContaining({ origin: 'http://localhost:5173' }));
    expect(app.use).toHaveBeenCalled(); expect(app.useGlobalPipes).toHaveBeenCalled(); expect(app.useGlobalFilters).toHaveBeenCalled();
  });
});
