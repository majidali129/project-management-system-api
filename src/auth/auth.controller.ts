import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import type { Request, Response } from 'express';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { User } from 'src/shared/decorators/user.decorator';
import type { AuthorizedUser } from 'src/shared/types/auth-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() body: CreateUserDto) {
    return this.authService.signUp(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(
    @Body() body: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(body);
    res.cookie('accessToken', accessToken);
    res.cookie('refreshToken', refreshToken);
    res.set('Authorization', `Bearer ${accessToken}`);

    return {
      success: true,
      message: 'Login successfull',
      accessToken,
      refreshToken,
    };
  }

  @UseGuards(AuthGuard)
  @Patch('/logout')
  async logout(@User() user: AuthorizedUser, @Res() res: Response) {
    await this.authService.logout(user.id);
    res.cookie('accessToken', '');
    res.cookie('refreshToken', '');
    res.removeHeader('Authorization');
    res.send();
  }
}
