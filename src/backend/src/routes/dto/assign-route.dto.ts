import { Equals, IsIn, IsUUID } from 'class-validator';

export const ASSIGNABLE_ROUTE_STATE = 'GENERADA' as const;

export class AssignRouteDto {
  @IsUUID()
  conductor_id!: string;

  @IsIn([ASSIGNABLE_ROUTE_STATE])
  expected_estado!: typeof ASSIGNABLE_ROUTE_STATE;

  @Equals(true)
  confirmed!: true;
}