import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { User } from '../../common/decorators/user.decorator';
import type { AuthUser } from '../../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@User() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }
}
