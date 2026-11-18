import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const SUSTAINABILITY_SOURCES = ['ESTIMADO', 'MEDIDO'] as const;
export type SustainabilitySource = typeof SUSTAINABILITY_SOURCES[number];
const finite = (maxDecimalPlaces: number) => ({ allowNaN: false, allowInfinity: false, maxDecimalPlaces });

/**
 * US-021: información para evaluar la sostenibilidad de una ruta.
 * Los cuatro primeros campos son obligatorios, pero aquí se declaran opcionales a propósito:
 * el servicio comprueba su presencia y responde con la lista completa de información faltante
 * en un solo 400 (escenario 2), en lugar de un mensaje por cada validador.
 */
export class RegisterSustainabilityDto {
  @IsOptional() @IsNumber(finite(3), { message: 'La distancia recorrida debe ser un número con hasta 3 decimales.' })
  @Min(0.001, { message: 'La distancia recorrida debe ser mayor que 0 km.' }) @Max(10000, { message: 'La distancia recorrida no puede superar 10 000 km.' })
  distancia_km?: number;

  @IsOptional() @IsNumber(finite(3), { message: 'El combustible consumido debe ser un número con hasta 3 decimales.' })
  @Min(0, { message: 'El combustible consumido no puede ser negativo.' }) @Max(100000, { message: 'El combustible consumido no puede superar 100 000 L.' })
  combustible_l?: number;

  @IsOptional() @IsNumber(finite(5), { message: 'El factor de emisión debe ser un número con hasta 5 decimales.' })
  @Min(0, { message: 'El factor de emisión no puede ser negativo.' }) @Max(100, { message: 'El factor de emisión no puede superar 100 kg CO₂/km.' })
  factor_emision_kg_co2_km?: number;

  @IsOptional() @IsIn(SUSTAINABILITY_SOURCES, { message: 'El origen de los datos debe ser ESTIMADO o MEDIDO.' })
  origen_datos?: SustainabilitySource;

  @IsOptional() @IsNumber(finite(2), { message: 'El costo de combustible debe ser un número con hasta 2 decimales.' })
  @Min(0, { message: 'El costo de combustible no puede ser negativo.' }) @Max(1000000, { message: 'El costo de combustible no puede superar 1 000 000.' })
  costo_combustible?: number;

  @IsOptional() @IsString({ message: 'Las observaciones deben ser texto.' }) @MaxLength(500, { message: 'Las observaciones admiten como máximo 500 caracteres.' })
  observaciones?: string;
}
