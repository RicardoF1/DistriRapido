import { Body, Controller, Get, Header, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCookieAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService, INVALID_CREDENTIALS } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, SessionIdentityDto } from './dto/auth-response.dto';
import { AuthRequest, JwtAuthGuard } from './jwt-auth.guard';
import { LEGACY_SESSION_COOKIE, SESSION_COOKIE, sessionCookieOptions } from './session-cookie';
import { assertRequestOrigin } from '../common/request-origin';

@ApiTags('Autenticación — US-001 / US-002')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  private checkOrigin(request: Request) {
    assertRequestOrigin(request, this.config.getOrThrow<string>('FRONTEND_ORIGIN'));
  }
  private cookieOptions() {
    return sessionCookieOptions(this.config.get<string>('NODE_ENV') === 'production' || this.config.getOrThrow<string>('FRONTEND_ORIGIN').startsWith('https://'));
  }
  private clearLegacy(response: Response) {
    response.clearCookie(LEGACY_SESSION_COOKIE, { ...this.cookieOptions(), path: '/auth' });
    response.clearCookie(LEGACY_SESSION_COOKIE, this.cookieOptions());
  }

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiOperation({ summary: 'Iniciar sesión; emite JWT y cookie HttpOnly con la misma caducidad.' })
  @ApiResponse({ status: 403, description: 'Origen no permitido.' })
  @ApiBadRequestResponse({ description: 'Correo/contraseña inválidos o propiedades no permitidas.' })
  @ApiUnauthorizedResponse({ description: INVALID_CREDENTIALS })
  @ApiResponse({ status: 429, description: 'Demasiados intentos. Espera antes de volver a intentarlo.' })
  @ApiResponse({ status: 500, description: 'Error interno; no expone datos sensibles.' })
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    this.checkOrigin(request);
    const result = await this.auth.login(dto);
    this.clearLegacy(response);
    response.cookie(SESSION_COOKIE, result.accessToken, { ...this.cookieOptions(), maxAge: result.expiresIn * 1000 });
    return result;
  }

  @Post('logout')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  @SkipThrottle()
  @ApiOperation({ summary: 'Cerrar sesión del navegador; elimina cookie, incluso si está ausente o expirada. No revoca copias de JWT Bearer.' })
  @ApiNoContentResponse({ description: 'Cookie de sesión eliminada. Operación idempotente.' })
  @ApiResponse({ status: 403, description: 'Origen no permitido.' })
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    this.checkOrigin(request);
    this.clearLegacy(response);
    response.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @ApiBearerAuth()
  @ApiCookieAuth('session')
  @ApiOkResponse({ type: SessionIdentityDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido, expirado o usuario no habilitado.' })
  me(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response) {
    if (request.legacySession) {
      this.clearLegacy(response);
      response.cookie(SESSION_COOKIE, request.authToken, { ...this.cookieOptions(), maxAge: Math.max(0, request.user.expiresAt - Date.now()) });
    }
    return request.user;
  }
}
