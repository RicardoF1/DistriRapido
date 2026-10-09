import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminSummaryController } from './admin-summary.controller';
import { AdminSummaryService } from './admin-summary.service';
@Module({ imports: [AuthModule, PrismaModule], controllers: [AdminSummaryController], providers: [AdminSummaryService] })
export class AdminModule {}
