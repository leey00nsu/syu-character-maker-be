import { ApiProperty } from '@nestjs/swagger';

export class ArticleUploadLimitResponse {
  @ApiProperty({ type: Number, description: '업로드 가능한 글 수' })
  availableCount: number;

  @ApiProperty({ type: Number, description: '업로드 가능한 글 수의 최대값' })
  maxLimit: number;

  @ApiProperty({ type: Boolean, description: '업로드 가능 여부' })
  isAvailable: boolean;
}
