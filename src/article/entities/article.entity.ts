import { Exclude, Expose, Type } from 'class-transformer';
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
  @Expose()
  @PrimaryGeneratedColumn()
  id: number;

  @Expose()
  @Column()
  canvasName: string;

  @Expose()
  @Type(() => User)
  @ManyToOne(() => User, (user) => user.articles, {
    onDelete: 'CASCADE',
  })
  author: User;

  @Expose()
  @Column()
  imageUrl: string;

  @Exclude()
  @OneToMany(() => LikedBy, (likedBy) => likedBy.article, {
    cascade: true,
  })
  likedBy: LikedBy[];

  @Expose()
  @CreateDateColumn({
    type: 'timestamptz' /* timestamp with time zone */,
  })
  createdAt: Date;
}
