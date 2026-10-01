import { Module } from '@nestjs/common';
import { UsersDataModule } from './users-data.module';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
@Module({ imports: [UsersDataModule, AuthModule], controllers: [UsersController] })
export class UsersModule {}
