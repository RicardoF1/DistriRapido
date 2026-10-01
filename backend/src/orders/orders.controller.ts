import { Body, Controller, Header, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCookieAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { OrderRegistrationGuard } from './order-registration.guard';
import { CreateOrderDto, RegisteredOrderDto } from './order.dto';
import { OrdersService } from './orders.service';
@ApiTags('Pedidos — RF-003 / US-004') @ApiBearerAuth() @ApiCookieAuth('session')
@ApiUnauthorizedResponse({ description: 'Sesión ausente, inválida o expirada.' })
@ApiForbiddenResponse({ description: 'Solo Administrador y Operador / Técnico; origen ajeno rechazado.' })
@UseGuards(JwtAuthGuard, OrderRegistrationGuard, RequestOriginGuard) @SkipThrottle()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post() @Header('Cache-Control', 'no-store') @ApiCreatedResponse({ type: RegisteredOrderDto })
  @ApiBadRequestResponse({ description: 'Campos obligatorios, formatos, precisión/rangos, enumeraciones o ventana de entrega inválidos; atributos no permitidos.' })
  create(@Body() dto: CreateOrderDto) { return this.orders.create(dto); }
}
