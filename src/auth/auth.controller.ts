import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Req,
  Res,
  Session,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from 'src/user/users.service';
import { GoogleUserDto } from './dtos/googleUser.dto';
import { GoogleAuthGuard } from './guards/google.guard';
import { User } from 'src/user/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private usersService: UsersService) {}
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    return 'google';
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async googleAuthCallback(@Req() req) {
    const profile: GoogleUserDto = req.user;
    const { provider, email } = profile;

    let user = await this.usersService.findOne(provider, email);

    if (!user) {
      console.log('유저가 존재하지 않습니다, 새로 만듭니다.');
      user = await this.usersService.create(profile);
    }

    return {
      statusCode: 200,
      user,
    };
  }

  @Get('logout')
  logout(@Req() req, @Res() res) {
    req.session.destroy();

    return res.redirect('/');
  }

  @Get('isLogin')
  @UseInterceptors(ClassSerializerInterceptor)
  async isLogin(@Session() session) {
    const sessionUser = session?.passport?.user;

    if (!sessionUser) {
      return {
        statusCode: 401,
        message: '로그인이 필요합니다.',
      };
    }

    const { provider, email } = sessionUser;

    const user = await this.usersService.findOne(provider, email);

    return { statusCode: 200, user };
  }
}
