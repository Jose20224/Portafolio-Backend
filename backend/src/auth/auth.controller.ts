import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Header,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator.js';
import type { AuthenticatedRequest } from '../common/guards/supabase-auth.guard.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedAdmin } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshSessionDto } from './dto/refresh-session.dto.js';

@Controller('auth')
@Header('Cache-Control', 'no-store')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshSessionDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getCurrentAdmin(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return { user: admin };
  }

  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: AuthenticatedRequest) {
    const accessToken = request.accessToken;
    if (!accessToken) {
      return { message: 'La sesión ya no está activa.' };
    }

    await this.authService.logout(accessToken);
    return { message: 'Sesión cerrada correctamente.' };
  }
}
