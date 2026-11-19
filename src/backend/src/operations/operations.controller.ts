import { Controller, Get, Header, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCookieAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { IndicatorsQueryDto } from './dto/indicators-query.dto';
import { OperationsQueryDto } from './dto/operations-query.dto';
import { IndicatorsService } from './indicators.service';
import { OperationsGuard } from './operations.guard';
import { OperationsService } from './operations.service';

@ApiTags('Seguimiento operativo (US-019) e indicadores (US-022)')
@ApiBearerAuth() @ApiCookieAuth('session')
@ApiUnauthorizedResponse() @ApiForbiddenResponse()
@UseGuards(JwtAuthGuard, OperationsGuard, RequestOriginGuard)
@SkipThrottle()
@Controller('operations')
export class OperationsController {
  constructor(private readonly operations: OperationsService, private readonly indicatorsService: IndicatorsService) {}

  @Get('summary') @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'Totales de rutas en operación, entregas por estado e incidencias.' })
  summary() { return this.operations.summary(); }

  @Get('indicators') @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'US-022: indicadores de las rutas completadas en el periodo (entregas, incidencias, duración y sostenibilidad).' })
  @ApiBadRequestResponse({ description: 'Fecha con formato inválido o inexistente, periodo invertido o superior a 366 días.' })
  indicators(@Query() query: IndicatorsQueryDto) { return this.indicatorsService.indicators(query); }

  @Get('routes') @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'Rutas en operación con progreso de entregas, filtradas y paginadas.' })
  @ApiBadRequestResponse({ description: 'Filtro no permitido o con formato inválido.' })
  list(@Query() query: OperationsQueryDto) { return this.operations.list(query); }

  @Get('routes/:id') @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'Entregas de la ruta con su estado, causa e incidencias.' })
  @ApiNotFoundResponse({ description: 'La ruta no existe o todavía no está en operación.' })
  detail(@Param('id', ParseUUIDPipe) id: string) { return this.operations.detail(id); }
}
