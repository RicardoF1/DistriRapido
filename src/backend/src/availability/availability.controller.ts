import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { AvailabilityGuard } from './availability.guard';
import { AvailabilityService } from './availability.service';
import {
  AvailabilityQueryDto,
  CreateAvailabilityDto,
  UpdateAvailabilityDto,
} from './dto/availability.dto';

@ApiTags('Disponibilidad operativa - RF-007 / US-009 / HGR-27')
@ApiCookieAuth('session')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@ApiBadRequestResponse()
@ApiConflictResponse()
@ApiNotFoundResponse()
@ApiServiceUnavailableResponse({
  description: 'La migración de disponibilidad operativa no está aplicada.',
})
@UseGuards(JwtAuthGuard, AvailabilityGuard, RequestOriginGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availability: AvailabilityService,
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Consultar disponibilidad operativa de conductores',
  })
  list(@Query() query: AvailabilityQueryDto) {
    return this.availability.list(query);
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Consultar un registro de disponibilidad',
  })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.availability.get(id);
  }

  @Post()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Registrar disponibilidad de un conductor',
  })
  create(@Body() dto: CreateAvailabilityDto) {
    return this.availability.create(dto);
  }

  @Patch(':id')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Modificar una disponibilidad previamente registrada',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.availability.update(id, dto);
  }
}
