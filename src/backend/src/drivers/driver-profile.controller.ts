import { BadRequestException, Controller, Get, Header, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard, type AuthRequest } from '../auth/jwt-auth.guard';
import { DriverProfileService } from './driver-profile.service';

@ApiTags('Conductor — acceso preparatorio')
@ApiBearerAuth() @ApiCookieAuth('session')
@ApiUnauthorizedResponse() @ApiForbiddenResponse()
@UseGuards(JwtAuthGuard)
@Controller('driver')
export class DriverProfileController {
  constructor(private readonly profiles: DriverProfileService) {}

  @Get('me') @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'Identidad mínima del conductor vinculado y activo, resuelta desde la sesión.' })
  own(@Req() request: AuthRequest, @Query() query: Record<string, unknown>) {
    if (Object.keys(query).length) throw new BadRequestException('El perfil propio no admite identificadores ni filtros.');
    return this.profiles.own(request.user);
  }
}
