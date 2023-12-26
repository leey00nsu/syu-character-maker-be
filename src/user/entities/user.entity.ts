import { Exclude, Expose } from 'class-transformer';
import { Article } from 'src/article/entities/article.entity';
import { LikedBy } from 'src/article/entities/likedBy.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @Exclude()
  @Column()
  provider: string;

  @Exclude()
  @Column()
  providerId: string;

  @Expose()
  @Column()
  name: string;

  @Expose({ groups: ['user'] })
  @Column()
  email: string;

  @Expose({ groups: ['user'] })
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
