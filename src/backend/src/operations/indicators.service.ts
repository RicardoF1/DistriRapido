import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { INCIDENT_TYPES, type IncidentType } from '../drivers/dto/create-delivery-incident.dto';
import { IndicatorsQueryDto } from './dto/indicators-query.dto';
import { DAY_MS, LIMA_OFFSET_MS, limaDay } from './operations.service';

// US-022 / RF-020: indicadores de los resultados de la operación.
// Universo: rutas COMPLETADA cuyo fin (finalizado_en) cae en el periodo, con su versión vigente,
// sus entregas, sus incidencias y su registro de sostenibilidad (US-021).
// Un indicador sin datos suficientes se devuelve como null, nunca como 0.
export const DEFAULT_PERIOD_DAYS = 30;
export const MAX_PERIOD_DAYS = 366;

const limaDate = (instant: Date) => new Date(+instant - LIMA_OFFSET_MS).toISOString().slice(0, 10);
const ratio = (part: number, total: number) => total ? Math.round(part * 10000 / total) / 100 : null;
const fixed = (value: Prisma.Decimal, places: number) => value.toDecimalPlaces(places).toNumber();

/** Periodo [desde, hasta] en días de Lima, con valores por defecto y límites. */
export function indicatorsPeriod(query: IndicatorsQueryDto, now = new Date()) {
  const hasta = query.hasta ?? limaDate(now);
  const to = new Date(+limaDay(hasta, 'hasta') + DAY_MS);
  const desde = query.desde ?? limaDate(new Date(+to - DEFAULT_PERIOD_DAYS * DAY_MS + LIMA_OFFSET_MS));
  const from = limaDay(desde, 'desde');
  if (+to <= +from) throw new BadRequestException('El periodo no es válido: «desde» es posterior a «hasta».');
  if ((+to - +from) / DAY_MS > MAX_PERIOD_DAYS) throw new BadRequestException(`El periodo no puede superar ${MAX_PERIOD_DAYS} días.`);
  return { desde, hasta, from, to };
}

const INDICATOR_ROUTES = {
  ruta_id: true, iniciado_en: true, finalizado_en: true,
  versiones: { orderBy: { numero: 'desc' }, take: 1, select: { paradas: { select: { estado_entrega: true, incidencias: { select: { tipo: true } } } } } },
  sostenibilidad: { select: { distancia_km: true, combustible_l: true, emisiones_co2_kg: true, costo_combustible: true, origen_datos: true } },
} satisfies Prisma.RutaSelect;
type IndicatorRoute = Prisma.RutaGetPayload<{ select: typeof INDICATOR_ROUTES }>;

/** Cálculo puro de los indicadores a partir de las rutas completadas del periodo. */
export function computeIndicators(routes: IndicatorRoute[]) {
  const deliveries = { realizadas: 0, no_realizadas: 0, pendientes: 0 };
  const incidents = Object.fromEntries(INCIDENT_TYPES.map(type => [type, 0])) as Record<IncidentType, number>;
  let durationMs = 0; let timed = 0;
  const zero = new Prisma.Decimal(0);
  const sustainability = { routes: 0, delivered: 0, km: zero, liters: zero, co2: zero, cost: zero, withCost: 0, ESTIMADO: 0, MEDIDO: 0 };

  for (const route of routes) {
    const stops = route.versiones[0]?.paradas ?? [];
    let delivered = 0;
    for (const stop of stops) {
      if (stop.estado_entrega === 'ENTREGADA') { deliveries.realizadas++; delivered++; }
      else if (stop.estado_entrega === 'NO_ENTREGADA') deliveries.no_realizadas++;
      else deliveries.pendientes++;
      for (const incident of stop.incidencias) if (incident.tipo in incidents) incidents[incident.tipo as IncidentType]++;
    }
    if (route.iniciado_en && route.finalizado_en && +route.finalizado_en >= +route.iniciado_en) { durationMs += +route.finalizado_en - +route.iniciado_en; timed++; }
    const record = route.sostenibilidad;
    if (record) {
      sustainability.routes++;
      sustainability.delivered += delivered;
      sustainability.km = sustainability.km.plus(record.distancia_km);
      sustainability.liters = sustainability.liters.plus(record.combustible_l);
      sustainability.co2 = sustainability.co2.plus(record.emisiones_co2_kg);
      if (record.costo_combustible !== null) { sustainability.cost = sustainability.cost.plus(record.costo_combustible); sustainability.withCost++; }
      if (record.origen_datos === 'ESTIMADO' || record.origen_datos === 'MEDIDO') sustainability[record.origen_datos]++;
    }
  }

  const attended = deliveries.realizadas + deliveries.no_realizadas;
  const hasRecords = sustainability.routes > 0;
  return {
    datos_suficientes: routes.length > 0,
    operacion: {
      rutas_completadas: routes.length,
      entregas: { ...deliveries, tasa_exito: ratio(deliveries.realizadas, attended) },
      incidencias: { total: Object.values(incidents).reduce((sum, value) => sum + value, 0), por_tipo: incidents },
      duracion_media_min: timed ? Math.round(durationMs / timed / 600) / 100 : null,
    },
    sostenibilidad: {
      rutas_con_registro: sustainability.routes,
      cobertura: ratio(sustainability.routes, routes.length),
      distancia_km: hasRecords ? fixed(sustainability.km, 3) : null,
      combustible_l: hasRecords ? fixed(sustainability.liters, 3) : null,
      co2_kg: hasRecords ? fixed(sustainability.co2, 4) : null,
      co2_por_entrega_kg: hasRecords && sustainability.delivered ? fixed(sustainability.co2.dividedBy(sustainability.delivered), 4) : null,
      costo_combustible: sustainability.withCost ? fixed(sustainability.cost, 2) : null,
      registros_con_costo: sustainability.withCost,
      origen: { ESTIMADO: sustainability.ESTIMADO, MEDIDO: sustainability.MEDIDO },
    },
  };
}

@Injectable()
export class IndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async indicators(query: IndicatorsQueryDto) {
    const { desde, hasta, from, to } = indicatorsPeriod(query);
    const routes = await this.prisma.ruta.findMany({
      where: { estado: 'COMPLETADA', finalizado_en: { gte: from, lt: to } },
      select: INDICATOR_ROUTES,
    });
    return { periodo: { desde, hasta }, ...computeIndicators(routes) };
  }
}
