import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleRequestDto {
  @ApiProperty({ type: String, description: '글 제목' })
  canvasName: string;

  @ApiProperty({ type: String, format: 'binary', description: '게시글 이미지' })
  file: Express.Multer.File;
}
