import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { TotalUserResponseDto } from './dtos/total-user-response.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('total')
  @ApiOperation({
    summary: '전체 유저 수 확인',
    description: '전체 유저 수 확인',
  })
  @ApiOkResponse({ description: '전체 유저 수', type: TotalUserResponseDto })
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
