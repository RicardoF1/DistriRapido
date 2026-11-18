import { Equals, IsIn, IsUUID } from 'class-validator';

/** US-020: solo una ruta confirmada puede recibir conductor. */
export const ASSIGNABLE_ROUTE_STATE = 'CONFIRMADA' as const;

export class AssignRouteDto {
  @IsUUID()
  conductor_id!: string;

  @IsIn([ASSIGNABLE_ROUTE_STATE])
  expected_estado!: typeof ASSIGNABLE_ROUTE_STATE;

  @Equals(true)
  confirmed!: true;
}