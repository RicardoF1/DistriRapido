import { ApiProperty } from '@nestjs/swagger';
export class OrderStateCountDto {
  @ApiProperty({ description: 'Estado realmente almacenado; no crea nuevos estados.' }) state!: string;
  @ApiProperty({ minimum: 0 }) count!: number;
}
export class AdminSummaryDto {
  @ApiProperty({ minimum: 0 }) totalOrders!: number;
  @ApiProperty({ minimum: 0 }) pendingOrders!: number;
  @ApiProperty({ minimum: 0, description: 'Todas las cuentas registradas, activas e inactivas.' }) totalUsers!: number;
  @ApiProperty({ type: [OrderStateCountDto] }) ordersByState!: OrderStateCountDto[];
}
