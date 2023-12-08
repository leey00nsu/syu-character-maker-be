import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  Session,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from 'src/user/users.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Get('google')
  @UseInterceptors(ClassSerializerInterceptor)
  async googleAuth(@Query() query, @Session() session) {
    const { code } = query;

    const token = await this.authService.getGoogleToken(code);

    const profile = await this.authService.getGoogleProfile(token);

    const { email } = profile;

    let user = await this.usersService.findOne('google', email);

    if (!user) {
      console.log('유저가 존재하지 않습니다, 새로 만듭니다.');
      user = await this.usersService.create(profile);
    }

    session.user = user;

    return {
      statusCode: 200,
      user,
    };
  }

  @Get('logout')
  logout(@Session() session) {
    const sessionUser = session.user;

    if (!sessionUser) {
      return new UnauthorizedException('로그인이 필요합니다.');
    }

    console.log(sessionUser, '로그아웃');

    session.destroy();

    return {
      statusCode: 200,
      message: '로그아웃 되었습니다.',
    };
  }

  @Get('user')
  @UseInterceptors(ClassSerializerInterceptor)
  async getUser(@Session() session) {
    const sessionUser = session.user;

    if (!sessionUser) {
      return new UnauthorizedException('로그인이 필요합니다.');
    }

    const { provider, email } = sessionUser;

    const user = await this.usersService.findOne(provider, email);

    return { statusCode: 200, user };
  }
}
