import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('total')
  async getTotalUserCount() {
    const totalUsers = await this.userService.findAll();

    const totalUserCount = totalUsers.length;

    return {
      statusCode: 200,
      message: '전체 유저 수 조회 성공!',
      data: { count: totalUserCount },
    };
  }
}
