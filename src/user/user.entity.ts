import { Posts } from 'src/posts/posts.entity';
import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @Exclude({ toPlainOnly: true })
  @PrimaryGeneratedColumn()
  id: number;

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

  @OneToMany(() => Posts, (posts) => posts.user)
  posts: Posts[];
}
