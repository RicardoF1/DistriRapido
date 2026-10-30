import { Body, Controller, Get, Headers, Header, Param, ParseUUIDPipe, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard, type AuthRequest } from '../auth/jwt-auth.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { PlanningGuard } from './planning.guard';
import { PlanningService } from './planning.service';
import { CalculatePlanningDto, PeriodDto, PreparePlanningDto, UpdatePlanningDto } from './dto/planning.dto';
@Controller('planning') @UseGuards(JwtAuthGuard, PlanningGuard, RequestOriginGuard)
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}
  @Get('candidates') @Header('Cache-Control', 'no-store') candidates(@Query() query: PeriodDto) { return this.planning.candidates(query); }
  @Post() @Header('Cache-Control', 'no-store') prepare(@Body() dto: PreparePlanningDto, @Req() req: AuthRequest) { return this.planning.prepare(dto, req.user.usuario_id); }
  @Get(':id') @Header('Cache-Control', 'no-store') get(@Param('id', ParseUUIDPipe) id: string) { return this.planning.get(id); }
  @Patch(':id') @Header('Cache-Control', 'no-store') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlanningDto) { return this.planning.update(id, dto); }
  @Post(':id/calculations') @Header('Cache-Control', 'no-store') async calculate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CalculatePlanningDto, @Req() req: AuthRequest, @Headers('idempotency-key') key: string, @Res({ passthrough: true }) res: Response) { const result = await this.planning.calculate(id, dto, req.user.usuario_id, key); res.status(result.replay ? result.estado === 'EN_CURSO' ? 202 : 200 : 201); return result; }
  @Get(':id/calculations/:executionId') @Header('Cache-Control', 'no-store') execution(@Param('id', ParseUUIDPipe) id: string, @Param('executionId', ParseUUIDPipe) executionId: string) { return this.planning.execution(id, executionId); }
}
