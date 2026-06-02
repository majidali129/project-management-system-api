import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import bcrypt from 'bcrypt';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from 'src/shared/types/role';
import { CloudinaryService } from 'src/uploads/cloudinary/cloudinary.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}
  async signUp(createUserDto: CreateUserDto, file: Express.Multer.File) {
    const { name, email, password, role } = createUserDto;

    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email })
      .lean()
      .exec();

    if (existingUser)
      throw new BadRequestException('User with credentials already exists');

    const hashedPassword = await bcrypt.hash(password, 12);

    const createdUser = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const result = await this.cloudinaryService.uploadAvatar(file);

    createdUser.avatar = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await createdUser.save({ validateBeforeSave: false });

    //TODO: 5. Call Email Sercice to Send email for verification ( Optional )
    return {
      success: true,
      message: 'User registered successfully',
      status: HttpStatus.CREATED,
    };
  }
  async login({ email, password }: LoginUserDto) {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid email or password');

    const accessToken = await this.generateAccessToken({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    const refreshToken = await this.generateRefreshToken({
      sub: user._id.toString(),
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    user.refreshToken = hashedRefreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  }

  async logout(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new UnauthorizedException();
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
  }

  async processRefreshToken(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');
    try {
      const decoded: { sub: string } = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        },
      );

      const user = await this.userModel
        .findOne({
          _id: new Types.ObjectId(decoded.sub),
          refreshToken: { $ne: null },
        })
        .exec();

      if (!user)
        throw new UnauthorizedException('User account is inactive or missing');

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken || '',
      );

      if (!isRefreshTokenValid)
        throw new UnauthorizedException(
          'Invalid refresh token or refresh token has been revoked',
        );

      const accessToken = await this.generateAccessToken({
        sub: user._id.toString(),
        role: user.role,
        email: user.email,
      });

      const newRefreshToken = await this.generateRefreshToken({
        sub: user._id.toString(),
      });

      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 12);
      user.refreshToken = hashedRefreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof TokenExpiredError)
        throw new UnauthorizedException(
          'Refresh token expired. Please login again',
        );

      if (error instanceof JsonWebTokenError)
        throw new UnauthorizedException(
          'Invalid or malformed authentication token',
        );

      throw new UnauthorizedException('Could not refresh authentication token');
    }
  }

  async generateAccessToken(payload: {
    sub: string;
    role: Role;
    email: string;
  }) {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRY') as '2d',
    });
  }
  async generateRefreshToken(payload: { sub: string }) {
    return await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRY') as '7d',
    });
  }
}
