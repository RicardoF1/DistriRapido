import { Controller, Get, Header, Param, ParseIntPipe, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanningGuard } from '../planning/planning.guard';
import { RouteQueryDto } from './dto/route-query.dto';
import { RoutesService } from './routes.service';
@Controller('routes') @UseGuards(JwtAuthGuard, PlanningGuard)
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}
  @Get() @Header('Cache-Control', 'no-store') list(@Query() query: RouteQueryDto) { return this.routes.list(query); }
  @Get(':id') @Header('Cache-Control', 'no-store') get(@Param('id', ParseUUIDPipe) id: string) { return this.routes.get(id); }
  @Get(':id/versions/:version') @Header('Cache-Control', 'no-store') version(@Param('id', ParseUUIDPipe) id: string, @Param('version', ParseIntPipe) version: number) { return this.routes.get(id, version); }
}
