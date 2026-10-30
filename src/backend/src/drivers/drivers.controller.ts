import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiBadRequestResponse, ApiConflictResponse, ApiNotFoundResponse, ApiServiceUnavailableResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, type AuthRequest } from '../auth/jwt-auth.guard';
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
 @Get() @Header('Cache-Control','no-store') list(@Query() query:DriverQueryDto,@Req() req:AuthRequest){return this.drivers.list(query,req.user.rol.nombre);}
 @Get(':id') @Header('Cache-Control','no-store') get(@Param('id',ParseUUIDPipe) id:string,@Req() req:AuthRequest){return this.drivers.get(id,req.user.rol.nombre);}
 @Post() @Header('Cache-Control','no-store') create(@Body() dto:CreateDriverDto,@Req() req:AuthRequest){return this.drivers.create(dto,req.user.rol.nombre);}
 @Patch(':id') @Header('Cache-Control','no-store') @ApiOperation({summary:'Editar ficha o cambiar estado administrativo ACTIVO/INACTIVO'}) update(@Param('id',ParseUUIDPipe) id:string,@Body() dto:UpdateDriverDto,@Req() req:AuthRequest){return this.drivers.update(id,dto,req.user.rol.nombre);}
}
