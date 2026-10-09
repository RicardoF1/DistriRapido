import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiBadRequestResponse, ApiConflictResponse, ApiNotFoundResponse, ApiServiceUnavailableResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { DriversGuard } from './drivers.guard';
import { DriversService } from './drivers.service';
import { CreateDriverDto, DriverQueryDto, UpdateDriverDto } from './dto/driver.dto';
@ApiTags('Conductores — RF-006 / US-008 / HGR-26') @ApiCookieAuth('session') @ApiBearerAuth()
@ApiUnauthorizedResponse() @ApiForbiddenResponse() @ApiBadRequestResponse() @ApiConflictResponse() @ApiNotFoundResponse()
@ApiServiceUnavailableResponse({description:'Migración pendiente de autorización/aplicación.'})
@UseGuards(JwtAuthGuard, DriversGuard, RequestOriginGuard) @Controller('drivers')
export class DriversController {
 constructor(private readonly drivers:DriversService){}
 @Get() @Header('Cache-Control','no-store') list(@Query() query:DriverQueryDto){return this.drivers.list(query);}
 @Get(':id') @Header('Cache-Control','no-store') get(@Param('id',ParseUUIDPipe) id:string){return this.drivers.get(id);}
 @Post() @Header('Cache-Control','no-store') create(@Body() dto:CreateDriverDto){return this.drivers.create(dto);}
 @Patch(':id') @Header('Cache-Control','no-store') @ApiOperation({summary:'Editar ficha o cambiar estado administrativo ACTIVO/INACTIVO'}) update(@Param('id',ParseUUIDPipe) id:string,@Body() dto:UpdateDriverDto){return this.drivers.update(id,dto);}
}
