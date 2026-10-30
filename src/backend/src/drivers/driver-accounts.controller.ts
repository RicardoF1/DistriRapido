import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdministratorGuard } from '../auth/administrator.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { DriverAccountsService } from './driver-accounts.service';
import { CreateDriverAccountDto, DriverAccountOptionsDto, LinkDriverAccountDto } from './dto/driver-account.dto';

@ApiTags('Cuentas de conductores — Administración') @ApiBearerAuth() @ApiCookieAuth('session')
@UseGuards(JwtAuthGuard, AdministratorGuard, RequestOriginGuard)
@Controller('drivers')
export class DriverAccountsController {
  constructor(private readonly accounts: DriverAccountsService) {}
  @Get('account-options') @Header('Cache-Control', 'no-store')
  options(@Query() query: DriverAccountOptionsDto) { return this.accounts.options(query); }
  @Put(':id/account') @Header('Cache-Control', 'no-store')
  link(@Param('id', ParseUUIDPipe) id: string, @Body() dto: LinkDriverAccountDto) { return this.accounts.link(id, dto); }
  @Post(':id/account') @Header('Cache-Control', 'no-store')
  create(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateDriverAccountDto) { return this.accounts.create(id, dto); }
}
