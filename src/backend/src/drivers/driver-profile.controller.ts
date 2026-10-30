import { BadRequestException, Controller, Get, Header, Param, ParseUUIDPipe, Query, Req, UseGuards } from '@nestjs/common';
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

  @Get('routes') @Header('Cache-Control', 'no-store')
  routes(@Req() request: AuthRequest, @Query() query: Record<string, unknown>) {
    if (Object.keys(query).length) throw new BadRequestException('Mis rutas no admite identificadores ni filtros.');
    return this.profiles.routes(request.user);
  }

  @Get('routes/:id') @Header('Cache-Control', 'no-store')
  route(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Query() query: Record<string, unknown>) {
    if (Object.keys(query).length) throw new BadRequestException('El detalle de ruta no admite filtros.');
    return this.profiles.route(request.user, id);
  }
  @Get('me') @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'Identidad mínima del conductor vinculado y activo, resuelta desde la sesión.' })
  own(@Req() request: AuthRequest, @Query() query: Record<string, unknown>) {
    if (Object.keys(query).length) throw new BadRequestException('El perfil propio no admite identificadores ni filtros.');
    return this.profiles.own(request.user);
  }
}
