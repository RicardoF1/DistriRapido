import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCookieAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdministratorGuard } from '../auth/administrator.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { UsersService } from './users.service';
import { CreateUserDto, PublicUserDto, UpdateUserDto } from './dto/user.dto';
@ApiTags('Usuarios — RF-002 / US-003')
@ApiBearerAuth() @ApiCookieAuth('session')
@ApiUnauthorizedResponse({ description: 'Sesión ausente, inválida o usuario no habilitado.' })
@ApiForbiddenResponse({ description: 'Requiere Administrador; origen ajeno no permitido.' })
@UseGuards(JwtAuthGuard, AdministratorGuard, RequestOriginGuard)
@SkipThrottle()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: PublicUserDto, isArray: true })
  list() { return this.users.list(); }
  @Get(':id') @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: PublicUserDto }) @ApiNotFoundResponse() @ApiBadRequestResponse()
  get(@Param('id', ParseUUIDPipe) id: string) { return this.users.get(id); }
  @Post() @Header('Cache-Control', 'no-store') @ApiCreatedResponse({ type: PublicUserDto }) @ApiBadRequestResponse() @ApiConflictResponse({ description: 'Correo duplicado.' })
  create(@Body() dto: CreateUserDto) { return this.users.create(dto); }
  @Patch(':id') @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: PublicUserDto }) @ApiNotFoundResponse() @ApiBadRequestResponse() @ApiConflictResponse({ description: 'Correo duplicado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) { return this.users.update(id, dto); }
}
