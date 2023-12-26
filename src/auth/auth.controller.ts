import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  Session,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { HttpExceptionFilter } from 'src/filters/http-exception.filter';
import { UsersService } from 'src/user/users.service';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guard/sessionAuth.guard';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('google')
  async googleAuth(@Query() query, @Session() session) {
    const { code } = query;

    const token = await this.authService.getGoogleToken(code);
    const profile = await this.authService.getGoogleProfile(token);

    const { providerId } = profile;

    let user = await this.usersService.findOneByProviderId(providerId);

    if (!user) {
      console.log('유저가 존재하지 않습니다, 새로 만듭니다.');
      user = await this.usersService.create(profile);
    }

    session.user = user;

    console.log('googleLogin', new Date());

    return {
      statusCode: 200,
      message: '구글 로그인에 성공하였습니다.',
      data: instanceToPlain(user, { groups: ['user'] }),
    };
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  logout(@Session() session) {
    console.log('logout', new Date());

    session.user = null;

    return {
      statusCode: 200,
      message: '로그아웃 되었습니다.',
    };
  }

  @Get('user')
  @UseGuards(SessionAuthGuard)
  async getUser(@Session() session) {
    console.log('user', new Date());

    const { id } = session.user;

    const user = await this.usersService.findOne(id);

    return {
      statusCode: 200,
      message: '유저 정보를 정상적으로 가져왔습니다.',
      data: instanceToPlain(user, { groups: ['user'] }),
    };
  }
}
