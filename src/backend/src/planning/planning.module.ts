import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CoverageService } from '../coverage/coverage.service';
import { OsrmAdapter } from '../routing/osrm.adapter';
import { readRoutingConfig } from '../routing/routing-config';
import { RoutesController } from '../routes/routes.controller';
import { RoutesService } from '../routes/routes.service';
import { PlanningController } from './planning.controller';
import { PlanningGuard } from './planning.guard';
import { PlanningService } from './planning.service';
@Module({ imports: [AuthModule, PrismaModule], controllers: [PlanningController, RoutesController], providers: [CoverageService, PlanningGuard, PlanningService, RoutesService, { provide: OsrmAdapter, useFactory: () => new OsrmAdapter(readRoutingConfig(process.env)) }] })
export class PlanningModule {}
