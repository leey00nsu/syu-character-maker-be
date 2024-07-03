import { ApiProperty } from '@nestjs/swagger';

export class ArticleCountResponseDto {
  @ApiProperty({ type: Number, description: '전체 글 수' })
  count: number;
}
