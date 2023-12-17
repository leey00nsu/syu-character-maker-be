import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  Session,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from 'src/user/users.service';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guard/sessionAuth.guard';

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

    if (!profile) {
      return {
        statusCode: 400,
        message: '구글 프로필을 가져올 수 없습니다.',
      };
    }

    const { providerId, email } = profile;

    let user = await this.usersService.findOne(providerId, email);

    if (!user) {
      console.log('유저가 존재하지 않습니다, 새로 만듭니다.');
      user = await this.usersService.create(profile);
    }

    session.user = user;

    console.log('googleLogin', new Date());

    return {
      statusCode: 200,
      message: '구글 로그인에 성공하였습니다.',
      data: user,
    };
  }

  @Get('logout')
  @UseGuards(SessionAuthGuard)
  logout(@Session() session) {
    console.log('logout', new Date());

    session.destroy();

    return {
      statusCode: 200,
      message: '로그아웃 되었습니다.',
    };
  }

  @Get('user')
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getUser(@Session() session) {
    console.log('user', new Date());

    const sessionUser = session.user;
    const { providerId, email } = sessionUser;

    const user = await this.usersService.findOne(providerId, email);

    return {
      statusCode: 200,
      message: '유저 정보를 정상적으로 가져왔습니다.',
      data: user,
    };
  }
}
