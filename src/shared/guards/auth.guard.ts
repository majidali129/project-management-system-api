import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import type { Request } from 'express';
import { Role } from 'src/users/schemas/user.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    const token =
      (req.cookies['accessToken'] as string) ||
      (req.headers['authorization']?.replace('Bearer ', '') as string);

    if (!token) throw new UnauthorizedException('Authentication token missing');
    try {
      const decoded: { sub: string; role: Role; email: string } =
        await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        });

      req.user = {
        id: decoded.sub,
        role: decoded.role,
      };

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Authentication token has expired');
      }

      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException(
          'Invalid or malformed authentication token',
        );
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }
}
