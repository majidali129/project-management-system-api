import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { CloudinaryService } from 'src/uploads/cloudinary/cloudinary.service';
import type { AuthorizedUser } from 'src/shared/types/auth-user';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async uploadAvatar(user: AuthorizedUser, file: Express.Multer.File) {
    const existingUser = await this.userModel.findById(user.id).exec();
    if (!existingUser) throw new UnauthorizedException('Unauthorized Access');

    if (existingUser.avatar && existingUser.avatar.publicId) {
      await this.cloudinaryService.destroyFile(existingUser.avatar.publicId);
    }
    const result = await this.cloudinaryService.uploadAvatar(file);

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        user.id,
        {
          $set: {
            'avatar.url': result.secure_url,
            'avatar.publicId': result.public_id,
          },
        },
        { returnDocument: 'after' },
      )
      .select('-password -refreshToken -__v -createdAt -updatedAt');

    return updatedUser;
  }
}
