import { IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export const DELIVERY_FINAL_STATES = ['ENTREGADA', 'NO_ENTREGADA'] as const;
export type DeliveryFinalState = typeof DELIVERY_FINAL_STATES[number];

export class UpdateDeliveryStatusDto {
  @IsIn(DELIVERY_FINAL_STATES)
  estado!: DeliveryFinalState;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  causa?: string;

  @IsInt()
  @Min(0)
  expected_version!: number;
}