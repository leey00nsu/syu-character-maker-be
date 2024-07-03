import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Session,
  UseFilters,
  UseGuards,
  UseInterceptors,
  forwardRef,
} from '@nestjs/common';
import { ApiExtraModels, ApiOperation, getSchemaPath } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ApiCommonResponse } from 'src/api-common-response.decorator';
import { HttpExceptionFilter } from 'src/filters/http-exception.filter';
import { UserResponseDto } from 'src/user/dtos/user-response.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guard/sessionAuth.guard';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Post('google')
  @ApiOperation({
    summary: '구글 로그인',
  })
  @ApiExtraModels(UserResponseDto)
  @ApiCommonResponse({
    description: '유저 정보',
    $ref: getSchemaPath(UserResponseDto),
  })
  async googleAuth(@Query() query, @Session() session) {
    const { code } = query;

    const token = await this.authService.getGoogleToken(code);
    const profile = await this.authService.getGoogleProfile(token);

    const { providerId } = profile;

    let user = await this.userService.findOneByProviderId(providerId);

    if (!user) {
      console.log('유저가 존재하지 않습니다, 새로 만듭니다.');
      user = await this.userService.create(profile);
    }

    session.user = user;

    console.log('googleLogin', new Date());

    const excludedUser = {
      name: user.name,
      email: user.email,
      photo: user.photo,
    };

    return {
      statusCode: 200,
      message: '구글 로그인에 성공하였습니다.',
      data: excludedUser,
    };
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    summary: '로그아웃',
    description: '세션 기반 인증 필요',
  })
  @ApiCommonResponse({
    description: '로그아웃',
  })
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
  @ApiOperation({
    summary: '현재 유저 정보',
    description: '세션 기반 인증 필요',
  })
  @ApiExtraModels(UserResponseDto)
  @ApiCommonResponse({
    description: '유저 정보',
    $ref: getSchemaPath(UserResponseDto),
  })
  async getUser(@Session() session) {
    console.log('user', new Date());

    const { id: userId }: User = session.user;

    const user = await this.userService.findOne(userId);

    const excludedUser = {
      name: user.name,
      email: user.email,
      photo: user.photo,
    };

    return {
      statusCode: 200,
      message: '유저 정보를 정상적으로 가져왔습니다.',
      data: excludedUser,
    };
  }
}
