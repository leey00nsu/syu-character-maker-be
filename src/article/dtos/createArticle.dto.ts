import { User } from 'src/user/entities/user.entity';

export class CreateArticleDto {
  title: string;

  content: string;

  imageUrl: string;

  author: User;
}
