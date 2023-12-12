import { User } from 'src/user/user.entity';

export class CreatePostDto {
  title: string;

  content: string;

  imageUrl: string;

  user: User;
}
