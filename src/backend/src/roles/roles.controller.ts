import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiForbiddenResponse, ApiOkResponse, ApiProperty, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { RoleDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdministratorGuard } from '../auth/administrator.guard';
import { RolesService } from './roles.service';
import { PRIVATE_REVALIDATE } from '../common/cache-policy';
class PublicRoleDto extends RoleDto { @ApiProperty() descripcion!: string; }
@ApiTags('Roles — RF-002 / US-003') @ApiBearerAuth() @ApiCookieAuth('session')
@ApiUnauthorizedResponse() @ApiForbiddenResponse()
@UseGuards(JwtAuthGuard, AdministratorGuard) @SkipThrottle()
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}
  @Get() @Header('Cache-Control', PRIVATE_REVALIDATE) @ApiOkResponse({ type: PublicRoleDto, isArray: true })
  list() { return this.roles.list(); }
}
