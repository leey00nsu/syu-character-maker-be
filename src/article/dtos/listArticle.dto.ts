import { Expose } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { LikedBy } from '../entities/likedBy.entity';

export class ListArticle {
  @Expose()
  id: number;

  @Expose()
  author: User;

  @Expose()
  imageUrl: string;

  @Expose()
  likedBy: LikedBy[];

  @Expose()
  createdAt: Date;

  constructor({ id, author, imageUrl, likedBy, createdAt }) {
    this.id = id;
    this.author = author;
    this.imageUrl = imageUrl;
    this.likedBy = likedBy;
    this.createdAt = createdAt;
  }
}
