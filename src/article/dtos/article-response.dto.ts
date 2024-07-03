import { ApiProperty } from '@nestjs/swagger';

export class ArticleResponseDto {
  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: '이미지의 URL',
  })
  imageUrl: string;

  @ApiProperty({ example: 1, description: '게시글의 ID' })
  id: number;

  @ApiProperty({ example: '예시 캔버스', description: '캔버스 이름' })
  canvasName: string;

  @ApiProperty({ example: new Date(), description: '게시글 생성 일자' })
  createdAt: Date;

  @ApiProperty({
    description: '게시글 작성자 정보',
    type: () => ({
      email: {
        type: String,
        example: 'author@example.com',
        description: '작성자 이메일',
      },
      name: { type: String, example: '홍길동', description: '작성자 이름' },
      photo: {
        type: String,
        example: 'https://example.com/author.jpg',
        description: '작성자 프로필 사진',
      },
    }),
  })
  author: {
    email: string;
    name: string;
    photo: string;
  };

  @ApiProperty({
    example: true,
    description: '현재 사용자가 게시글의 작성자인지 여부',
  })
  isAuthor: boolean;

  @ApiProperty({
    example: false,
    description: '현재 사용자가 게시글을 좋아하는지 여부',
  })
  isLiked: boolean;

  @ApiProperty({ example: 10, description: '게시글의 좋아요 수' })
  likeCount: number;
}
