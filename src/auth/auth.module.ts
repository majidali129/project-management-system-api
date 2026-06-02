import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { CloudinaryModule } from 'src/uploads/cloudinary/cloudinary.module';

@Module({
  controllers: [AuthController],
  imports: [
    JwtModule.register({
      global: true,
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CloudinaryModule,
  ],
  providers: [AuthService, UsersService],
})
export class AuthModule {}
