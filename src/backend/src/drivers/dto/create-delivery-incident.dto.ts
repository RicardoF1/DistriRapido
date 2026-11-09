import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// US-018 / RF-015: catálogo cerrado de tipos de incidencia, alineado con chk_incidencias_tipo.
export const INCIDENT_TYPES = [
  'CLIENTE_AUSENTE',
  'DIRECCION_INCORRECTA',
  'ACCESO_RESTRINGIDO',
  'VIA_BLOQUEADA',
  'VEHICULO_AVERIADO',
  'CARGA_DANADA',
  'OTRO',
] as const;
export type IncidentType = typeof INCIDENT_TYPES[number];

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export class CreateDeliveryIncidentDto {
  @ApiProperty({ enum: INCIDENT_TYPES })
  @IsNotEmpty({ message: 'tipo: selecciona el tipo de incidencia.' })
  @IsIn(INCIDENT_TYPES, { message: 'tipo: el tipo de incidencia no es válido.' })
  tipo!: IncidentType;

  @ApiProperty({ minLength: 1, maxLength: 500 })
  @Transform(trim)
  @IsString({ message: 'descripcion: describe la incidencia.' })
  @IsNotEmpty({ message: 'descripcion: describe la incidencia.' })
  @MaxLength(500, { message: 'descripcion: admite como máximo 500 caracteres.' })
  descripcion!: string;

  @ApiPropertyOptional({ maxLength: 500, description: 'Información complementaria permitida (RF-015, ruta feliz).' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString({ message: 'detalle_complementario: debe ser texto.' })
  @MaxLength(500, { message: 'detalle_complementario: admite como máximo 500 caracteres.' })
  detalle_complementario?: string;
}
