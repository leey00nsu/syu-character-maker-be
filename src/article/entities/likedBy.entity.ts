import { Exclude } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Article } from './article.entity';

@Entity()
export class LikedBy {
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude()
  @Column()
  userId: number;

  @Exclude()
  @Column()
  articleId: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Article, {
    onDelete: 'CASCADE',
  })
  article: Article;
}
