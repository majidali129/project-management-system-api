import 'multer';
import {
  Controller,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/shared/decorators/user.decorator';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import type { AuthorizedUser } from 'src/shared/types/auth-user';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(AuthGuard)
  @Post('/upload-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @User() user: AuthorizedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const updatedUser = await this.userService.uploadAvatar(user, file);
    return {
      success: true,
      status: HttpStatus.CREATED,
      message: 'Avatar uploaded successfully',
      data: updatedUser,
    };
  }
}
