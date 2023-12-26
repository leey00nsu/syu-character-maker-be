import { User } from 'src/user/entities/user.entity';
import { Article } from '../entities/article.entity';

export class CreateLikedbyDto {
  user: User;

  article: Article;
}
