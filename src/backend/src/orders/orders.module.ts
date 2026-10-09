import { Module } from '@nestjs/common';
import { CoverageService } from '../coverage/coverage.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderRegistrationGuard } from './order-registration.guard';
import { OrderConsultationGuard } from './order-consultation.guard';
@Module({ imports: [AuthModule, PrismaModule], controllers: [OrdersController], providers: [CoverageService, OrdersService, OrderRegistrationGuard, OrderConsultationGuard] })
export class OrdersModule {}
