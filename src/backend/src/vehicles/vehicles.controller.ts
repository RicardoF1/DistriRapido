import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicle.dto';
import { VehiclesGuard } from './vehicles.guard';
import { VehiclesService } from './vehicles.service';

@ApiTags('Vehículos — US-007') @ApiBearerAuth() @ApiCookieAuth('session')
@UseGuards(JwtAuthGuard, RequestOriginGuard, VehiclesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}
  @Get() @Header('Cache-Control', 'no-store') list() { return this.vehicles.list(); }
  @Get(':id') @Header('Cache-Control', 'no-store') get(@Param('id', ParseUUIDPipe) id: string) { return this.vehicles.get(id); }
  @Post() @Header('Cache-Control', 'no-store') create(@Body() dto: CreateVehicleDto) { return this.vehicles.create(dto); }
  @Patch(':id') @Header('Cache-Control', 'no-store') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) { return this.vehicles.update(id, dto); }
}
