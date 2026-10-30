import { BadRequestException, Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard, type AuthRequest } from '../auth/jwt-auth.guard';
import { DriverProfileService } from './driver-profile.service';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@ApiTags('Conductor — acceso preparatorio')
@ApiBearerAuth() @ApiCookieAuth('session')
@ApiUnauthorizedResponse() @ApiForbiddenResponse()
@UseGuards(JwtAuthGuard)
@Controller('driver')
export class DriverProfileController {
  constructor(private readonly profiles: DriverProfileService) {}

  @Patch('deliveries/:id/status') @Header('Cache-Control', 'no-store')
  updateDelivery(
    @Req() request: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.profiles.updateDelivery(request.user, id, dto);
  }
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
