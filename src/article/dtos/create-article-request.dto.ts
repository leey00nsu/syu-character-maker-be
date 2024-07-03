import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleRequestDto {
  @ApiProperty({ type: String, description: '글 제목' })
  canvasName: string;
}
