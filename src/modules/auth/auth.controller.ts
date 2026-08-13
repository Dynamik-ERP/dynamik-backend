import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { CreateRegistrationCodeDto } from './dto/create-registration-code.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../entities/enums.js';
import { User } from '../../entities/user.entity.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @SkipCsrf()
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return { user: result.user, access_token: result.access_token, refresh_token: result.refresh_token };
  }

  @Post('login')
  @SkipCsrf()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return { user: result.user, access_token: result.access_token, refresh_token: result.refresh_token };
  }

  @Post('refresh')
  @SkipCsrf()
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token || dto.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const tokens = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens.access_token, tokens.refresh_token);
    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      full_name: user.full_name,
      role: user.role,
      email: user.email,
    };
  }

  @Post('registration-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createCode(@Body() dto: CreateRegistrationCodeDto, @CurrentUser() user: User) {
    return this.authService.createRegistrationCode(dto, user.id);
  }

  @Get('registration-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  listCodes() {
    return this.authService.listRegistrationCodes();
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const csrfToken = randomBytes(32).toString('hex');
    const common = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
    };
    res.cookie('access_token', accessToken, { ...common, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { ...common, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('csrf_token', csrfToken, {
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
