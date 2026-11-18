import { Body, Controller, Get, Header, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthRequest } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { PlanningGuard } from '../planning/planning.guard';
import { RouteQueryDto } from './dto/route-query.dto';
import { AssignRouteDto } from './dto/assign-route.dto';
import { ConfirmRouteDto } from './dto/confirm-route.dto';
import { RegisterSustainabilityDto } from './dto/register-sustainability.dto';
import { RouteSustainabilityService } from './route-sustainability.service';
import { RoutesService } from './routes.service';
@Controller('routes') @UseGuards(JwtAuthGuard, PlanningGuard, RequestOriginGuard)
export class RoutesController {
  constructor(private readonly routes: RoutesService, private readonly sustainability: RouteSustainabilityService) {}
  @Get() @Header('Cache-Control', 'no-store') list(@Query() query: RouteQueryDto) { return this.routes.list(query); }
  @Patch(':id/confirmation') @Header('Cache-Control', 'no-store')
  confirm(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ConfirmRouteDto, @Req() req: AuthRequest) { return this.routes.confirm(id, dto, req.user.usuario_id); }
  /** US-021: Administrador u Operador / Técnico registran la información de sostenibilidad de la ruta (201). */
  @Post(':id/sustainability') @Header('Cache-Control', 'no-store')
  registerSustainability(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RegisterSustainabilityDto, @Req() req: AuthRequest) { return this.sustainability.register(id, dto, req.user.usuario_id); }
  @Patch(':id/assignment') @Header('Cache-Control', 'no-store')
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignRouteDto) { return this.routes.assign(id, dto); }
  @Get(':id/assignment-candidates') @Header('Cache-Control', 'no-store')
  candidates(@Param('id', ParseUUIDPipe) id: string) { return this.routes.candidates(id); }
  @Get(':id') @Header('Cache-Control', 'no-store') get(@Param('id', ParseUUIDPipe) id: string) { return this.routes.get(id); }
  @Get(':id/versions/:version') @Header('Cache-Control', 'no-store') version(@Param('id', ParseUUIDPipe) id: string, @Param('version', ParseIntPipe) version: number) { return this.routes.get(id, version); }
}
