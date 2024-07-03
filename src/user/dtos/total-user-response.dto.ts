import { ApiProperty } from '@nestjs/swagger';

export class TotalUserResponseDto {
  @ApiProperty({ type: Number, description: '유저 수' })
  total: number;
}
