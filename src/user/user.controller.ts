import { Controller, Get } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, getSchemaPath } from '@nestjs/swagger';
import { ApiCommonResponse } from 'src/api-common-response.decorator';
import { TotalUserResponseDto } from './dtos/total-user-response.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('total')
  @ApiOperation({
    summary: '전체 유저 수 확인',
  })
  @ApiExtraModels(TotalUserResponseDto)
  @ApiCommonResponse({
    description: '전체 유저 수',
    $ref: getSchemaPath(TotalUserResponseDto),
  })
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
