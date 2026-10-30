import { Body, Controller, ForbiddenException, Get, Header, HttpCode, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthRequest } from '../auth/jwt-auth.guard';
import { AdministratorGuard } from '../auth/administrator.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { ROLE_NAMES } from '../roles/roles';
import { DriverCredentialsService } from './driver-credentials.service';
import { ChangeDriverPasswordDto, ResetDriverPasswordDto } from './dto/driver-credentials.dto';
import { CredentialAttemptsGuard } from './credential-attempts.guard';

@Controller('drivers')
@UseGuards(JwtAuthGuard, AdministratorGuard, RequestOriginGuard)
export class DriverCredentialsController {
  constructor(private readonly credentials: DriverCredentialsService) {}
  @Get(':id/account/credentials') @Header('Cache-Control', 'no-store')
  metadata(@Param('id', ParseUUIDPipe) id: string) { return this.credentials.metadata(id); }
  @Post(':id/account/reset-password') @HttpCode(200) @Header('Cache-Control', 'no-store')
  @UseGuards(CredentialAttemptsGuard)
  reset(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResetDriverPasswordDto) { return this.credentials.reset(id, dto); }
}

@Controller('driver')
@UseGuards(JwtAuthGuard, RequestOriginGuard)
export class DriverOwnCredentialsController {
  constructor(private readonly credentials: DriverCredentialsService) {}
  @Post('account/password') @HttpCode(200) @Header('Cache-Control', 'no-store')
  @UseGuards(CredentialAttemptsGuard)
  own(@Req() request: AuthRequest, @Body() dto: ChangeDriverPasswordDto) {
    if (request.user.rol.nombre !== ROLE_NAMES.driver) throw new ForbiddenException('Solo el Conductor puede cambiar su contraseña en Mi cuenta.');
    return this.credentials.own(request.user.usuario_id, dto);
  }
}
