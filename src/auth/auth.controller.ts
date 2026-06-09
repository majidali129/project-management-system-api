import {
  Body,
  Controller,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import type { Request, Response } from 'express';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { User } from 'src/shared/decorators/user.decorator';
import type { AuthorizedUser } from 'src/shared/types/auth-user';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @UseInterceptors(FileInterceptor('avatar'))
  async signUp(
    @Body() body: CreateUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 2,
            errorMessage: 'Avatar file size cannot exceed 2MB',
          }),
          new FileTypeValidator({ fileType: 'image/(png|jpeg|jpg)' }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ) {
    await this.authService.signUp(body, file);
    return {
      message: 'User registered successfully',
      status: HttpStatus.CREATED,
    };
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
      message: 'Login successfull',
      data: {accessToken,
      refreshToken,}
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

  @Patch('/refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // We're checking headers for mobile clients that might not support cookies
    const refreshToken =
      (req.cookies?.['refreshToken'] as string) ||
      (req.headers['authorization']?.replace('Bearer ', '') as string);
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.processRefreshToken(refreshToken);
    res.cookie('accessToken', accessToken);
    res.cookie('refreshToken', newRefreshToken);
    res.set('Authorization', `Bearer ${accessToken}`);

    return {
      message: 'Token refreshed successfully',
      data: {accessToken,
      refreshToken: newRefreshToken,}
    };
  }
}
