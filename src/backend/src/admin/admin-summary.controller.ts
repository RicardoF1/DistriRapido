import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdministratorGuard } from '../auth/administrator.guard';
import { RequestOriginGuard } from '../common/request-origin';
import { AdminSummaryService } from './admin-summary.service';
import { AdminSummaryDto } from './admin-summary.dto';
@ApiTags('Resumen administrativo')
@ApiBearerAuth() @ApiCookieAuth('session')
@ApiUnauthorizedResponse() @ApiForbiddenResponse()
@UseGuards(JwtAuthGuard, AdministratorGuard, RequestOriginGuard)
@SkipThrottle()
@Controller('admin')
export class AdminSummaryController {
  constructor(private readonly summary: AdminSummaryService) {}
  @Get('summary') @Header('Cache-Control', 'no-store') @ApiOkResponse({ type: AdminSummaryDto })
  get() { return this.summary.get(); }
}
