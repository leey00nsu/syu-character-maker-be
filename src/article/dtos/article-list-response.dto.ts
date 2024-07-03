import { ApiProperty } from '@nestjs/swagger';
import { ArticleResponseDto } from './article-response.dto';

export class ArticleListResponseDto {
  @ApiProperty({ type: [ArticleResponseDto], description: '글 리스트' })
  articles: ArticleResponseDto[];

  @ApiProperty({
    description: '게시글 목록 메타데이터',
    type: () => ({
      total: { type: Number, example: 0, description: '총 페이지 수' },
      page: { type: Number, example: 0, description: '현재 페이지' },
      lastPage: { type: Number, example: 0, description: '마지막 페이지' },
    }),
  })
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}
