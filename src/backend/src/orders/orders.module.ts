import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderRegistrationGuard } from './order-registration.guard';
import { OrderConsultationGuard } from './order-consultation.guard';
@Module({ imports: [AuthModule, PrismaModule], controllers: [OrdersController], providers: [OrdersService, OrderRegistrationGuard, OrderConsultationGuard] })
export class OrdersModule {}
