import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, User } from 'src/users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}
  async signUp(createUserDto: CreateUserDto) {
    const { name, email, password, role, avatar } = createUserDto;

    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email })
      .lean()
      .exec();

    if (existingUser)
      throw new BadRequestException('User with credentials already exists');

    const hashedPassword = await bcrypt.hash(password, 12);

    //TODO: 4. Call Upload Service Save avatar to file-system and url back for DB

    await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      avatar,
    });

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

  refreshToken() {
    // 1. If Client is Browser or any that support cookies, we'll get both ( access and refresh ) from cookies then based on that or req.user we'll get user from db for refreshToken from DB. Now if refreshToken still valid  => we'll renew both access+refresh and return new ones and save new ones. If refreshToken expired or compomised => this req will fails as unauthorized and user'll have to login again.
    // 2. If Client is API client PostMan or mobile => we'll use bearer/authorization headers for accessToken => we'll get accessToken from headers => renew the accessToken as per count limit. if exceeds, we'll aks for login.
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
