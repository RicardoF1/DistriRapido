import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VehiclesController } from './vehicles.controller';
import { VehiclesGuard } from './vehicles.guard';
import { VehiclesService } from './vehicles.service';
@Module({ imports: [AuthModule, PrismaModule], controllers: [VehiclesController], providers: [VehiclesService, VehiclesGuard] })
export class VehiclesModule {}
