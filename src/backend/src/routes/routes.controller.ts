import { Body, Controller, Get, Header, Param, ParseIntPipe, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { PlanningGuard } from '../planning/planning.guard';
import { RouteQueryDto } from './dto/route-query.dto';
import { AssignRouteDto } from './dto/assign-route.dto';
import { RoutesService } from './routes.service';
@Controller('routes') @UseGuards(JwtAuthGuard, PlanningGuard, RequestOriginGuard)
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}
  @Get() @Header('Cache-Control', 'no-store') list(@Query() query: RouteQueryDto) { return this.routes.list(query); }
  @Patch(':id/assignment') @Header('Cache-Control', 'no-store')
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignRouteDto) { return this.routes.assign(id, dto); }
  @Get(':id/assignment-candidates') @Header('Cache-Control', 'no-store')
  candidates(@Param('id', ParseUUIDPipe) id: string) { return this.routes.candidates(id); }
  @Get(':id') @Header('Cache-Control', 'no-store') get(@Param('id', ParseUUIDPipe) id: string) { return this.routes.get(id); }
  @Get(':id/versions/:version') @Header('Cache-Control', 'no-store') version(@Param('id', ParseUUIDPipe) id: string, @Param('version', ParseIntPipe) version: number) { return this.routes.get(id, version); }
}
