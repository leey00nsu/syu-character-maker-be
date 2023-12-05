import { GoogleUserDto } from './../auth/dtos/googleUser.dto';
import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  // @Get()
  // async findOrCreate(profile: GoogleUserDto) {
  //   const { provider, providerId, name, email } = profile;

  //   let user = await this.usersService.findOne(provider, providerId);

  //   if (!user) {
  //     console.log('유저가 존재하지 않습니다, 새로 만듭니다.');
  //     user = await this.usersService.create(profile);
  //   }

  //   return user;
  // }

  @Get('all')
  async findAll() {
    return this.usersService.findAll();
  }
}
