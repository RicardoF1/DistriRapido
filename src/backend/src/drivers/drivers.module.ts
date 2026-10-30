import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { DriversGuard } from './drivers.guard';
import { DriverProfileController } from './driver-profile.controller';
import { DriverProfileService } from './driver-profile.service';
import { UsersDataModule } from '../users/users-data.module';
import { DriverAccountsController } from './driver-accounts.controller';
import { DriverAccountsService } from './driver-accounts.service';
import { DriverCredentialsService } from './driver-credentials.service';
import { DriverCredentialsController, DriverOwnCredentialsController } from './driver-credentials.controller';
import { CredentialAttemptsGuard } from './credential-attempts.guard';
@Module({imports:[AuthModule,PrismaModule,UsersDataModule],controllers:[DriverCredentialsController,DriverOwnCredentialsController,DriverAccountsController,DriversController,DriverProfileController],providers:[DriversService,DriversGuard,DriverProfileService,DriverAccountsService,DriverCredentialsService,CredentialAttemptsGuard]})
export class DriversModule {}
