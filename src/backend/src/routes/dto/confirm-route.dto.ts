import { Equals, IsIn } from 'class-validator';

export const CONFIRMABLE_ROUTE_STATE = 'GENERADA' as const;

export class ConfirmRouteDto {
  @IsIn([CONFIRMABLE_ROUTE_STATE])
  expected_estado!: typeof CONFIRMABLE_ROUTE_STATE;

  @Equals(true)
  confirmed!: true;
}
