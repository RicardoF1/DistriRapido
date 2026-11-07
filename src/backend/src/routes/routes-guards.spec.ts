import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { PlanningGuard } from '../planning/planning.guard';
import { RoutesController } from './routes.controller';

it('RoutesController exige sesión, rol de planificación y origen confiable en todas sus rutas', () => {
  expect(Reflect.getMetadata(GUARDS_METADATA, RoutesController)).toEqual([JwtAuthGuard, PlanningGuard, RequestOriginGuard]);
  for (const handler of ['assign', 'candidates', 'get', 'list', 'version'] as const) {
    expect(Reflect.getMetadata(GUARDS_METADATA, RoutesController.prototype[handler])).toBeUndefined();
  }
});
