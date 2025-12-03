import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/generated/prisma/client';
import { Response } from 'express';
import ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from './token-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: User, response: Response) {
    const expires = new Date();
    const expirationConfig = this.configService.getOrThrow<string>(
      'JWT_EXPIRATION',
    ) as ms.StringValue;
    const expirationInMs = ms(expirationConfig);

    if (typeof expirationInMs !== 'number') {
      throw new Error('Invalid JWT_EXPIRATION value');
    }

    expires.setMilliseconds(expires.getMilliseconds() + expirationInMs);

    const tokenPayload: TokenPayload = {
      userId: user.id,
    };

    const token = await this.jwtService.signAsync(tokenPayload);

    response.cookie('Authentication', token, {
      httpOnly: true,
      secure: true,
      expires,
    });

    return { tokenPayload };
  }

  async verifyUser(email: string, password: string) {
    try {
      const user = await this.usersService.getUser({ email });
      const authenticated = await bcrypt.compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (err) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}
