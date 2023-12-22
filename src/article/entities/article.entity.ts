import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LikedBy } from './likedBy.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  canvasName: string;

  @ManyToOne(() => User, (user) => user.articles, {
    onDelete: 'CASCADE',
  })
  author: User;

  @Column()
  imageUrl: string;

  @OneToMany(() => LikedBy, (likedBy) => likedBy.article, {
    cascade: true,
  })
  likedBy: LikedBy[];

  @CreateDateColumn({
    type: 'timestamptz' /* timestamp with time zone */,
  })
  createdAt: Date;
}
