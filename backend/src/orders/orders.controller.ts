import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCookieAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { OrderConsultationGuard } from './order-consultation.guard';
import { OrderQueryDto, OrderReadDto, OrderPageDto } from './order-query.dto';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { OrderRegistrationGuard } from './order-registration.guard';
import { CreateOrderDto, RegisteredOrderDto } from './order.dto';
import { OrdersService } from './orders.service';
@ApiTags('Pedidos — US-004 / US-005') @ApiBearerAuth() @ApiCookieAuth('session')
@ApiUnauthorizedResponse({ description: 'Sesión ausente, inválida o expirada.' })
@ApiForbiddenResponse({ description: 'Solo Administrador y Operador / Técnico; origen ajeno rechazado.' })
@UseGuards(JwtAuthGuard, RequestOriginGuard) @SkipThrottle()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get() @UseGuards(OrderConsultationGuard) @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: OrderPageDto }) @ApiBadRequestResponse()
  list(@Query() query: OrderQueryDto) { return this.orders.list(query); }
  @Get(':id') @UseGuards(OrderConsultationGuard) @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: OrderReadDto }) @ApiBadRequestResponse() @ApiNotFoundResponse()
  get(@Param('id', ParseUUIDPipe) id: string) { return this.orders.get(id); }
  @Post() @UseGuards(OrderRegistrationGuard) @Header('Cache-Control', 'no-store') @ApiCreatedResponse({ type: RegisteredOrderDto })
  @ApiBadRequestResponse({ description: 'Campos obligatorios, formatos, precisión/rangos, enumeraciones o ventana de entrega inválidos; atributos no permitidos.' })
  create(@Body() dto: CreateOrderDto) { return this.orders.create(dto); }
}
