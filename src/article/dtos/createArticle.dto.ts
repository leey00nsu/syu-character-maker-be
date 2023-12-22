import { IsString, MaxLength } from 'class-validator';
import { User } from 'src/user/entities/user.entity';

export class CreateArticleDto {
  imageUrl: string;

  @MaxLength(15)
  @IsString()
  canvasName: string;

  author: User;
}
