import { GoogleUserDto } from './dtos/googleUser.dto';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from 'src/user/users.service';

@Controller('auth')
export class AuthController {
  constructor(private usersService: UsersService) {}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    return 'google';
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req) {
    const profile: GoogleUserDto = req.user;
    const { provider, email } = profile;

    let user = await this.usersService.findOne(provider, email);

    if (!user) {
      console.log('유저가 존재하지 않습니다, 새로 만듭니다.');
      user = await this.usersService.create(profile);
    }

    return user;
  }
}
