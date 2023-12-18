import { Expose } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';

export class ListArticle {
  @Expose()
  id: number;

  @Expose()
  author: User;

  @Expose()
  imageUrl: string;

  @Expose()
  isLiked: boolean;

  @Expose()
  likeCount: number;

  @Expose()
  createdAt: Date;

  constructor({ id, author, presignedUrl, isLiked, createdAt, likeCount }) {
    this.id = id;
    this.author = author;
    this.imageUrl = presignedUrl;
    this.isLiked = isLiked;
    this.likeCount = likeCount;
    this.createdAt = createdAt;
  }
}
