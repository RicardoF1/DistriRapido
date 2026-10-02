import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersDataModule } from '../users/users-data.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordService } from './password.service';
import { AdministratorGuard } from './administrator.guard';
import { RequestOriginGuard } from '../common/request-origin';

@Module({
  imports: [UsersDataModule, JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_SECRET') }) })],
  controllers: [AuthController], providers: [AuthService, PasswordService, JwtAuthGuard, AdministratorGuard, RequestOriginGuard],
  exports: [AuthService, JwtAuthGuard, AdministratorGuard, RequestOriginGuard],
})
export class AuthModule {}
