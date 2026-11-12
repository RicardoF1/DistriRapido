import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OperationsController } from './operations.controller';
import { OperationsGuard } from './operations.guard';
import { OperationsService } from './operations.service';

@Module({ imports: [AuthModule, PrismaModule], controllers: [OperationsController], providers: [OperationsGuard, OperationsService] })
export class OperationsModule {}
