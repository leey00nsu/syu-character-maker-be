import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '서버 상태 확인', description: '서버 상태 확인' })
  @ApiOkResponse({ description: '서버가 정상 작동 중', example: 'healthy' })
  checkHealthy() {
    return this.appService.check();
  }
}
