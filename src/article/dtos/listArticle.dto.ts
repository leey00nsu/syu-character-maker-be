import { Expose, Type } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';

export class ListArticleDto {
  @Expose()
  id: number;

  @Expose()
  canvasName: string;

  @Expose()
  @Type(() => User)
  author: User;

  @Expose()
  imageUrl: string;

  @Expose()
  isLiked: boolean;

  @Expose()
  likeCount: number;

  @Expose()
  isAuthor: boolean;

  @Expose()
  createdAt: Date;
}
