import { User } from 'src/user/entities/user.entity';

export class CreateArticleDto {
  imageUrl: string;

  author: User;
}
