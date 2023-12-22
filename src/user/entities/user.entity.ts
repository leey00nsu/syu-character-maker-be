import { Exclude } from 'class-transformer';
import { Article } from 'src/article/entities/article.entity';
import { LikedBy } from 'src/article/entities/likedBy.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @Exclude({ toPlainOnly: true })
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude({ toPlainOnly: true })
  @Column()
  provider: string;

  @Exclude({ toPlainOnly: true })
  @Column()
  providerId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  photo: string;

  @OneToMany(() => Article, (article) => article.author, {
    cascade: true,
  })
  articles: Article[];

  @OneToMany(() => LikedBy, (likedBy) => likedBy.user, {
    cascade: true,
  })
  likedArticles: LikedBy[];
}
