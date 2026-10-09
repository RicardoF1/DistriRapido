import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { DriversGuard } from './drivers.guard';
@Module({imports:[AuthModule,PrismaModule],controllers:[DriversController],providers:[DriversService,DriversGuard]})
export class DriversModule {}
