import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikedBy } from 'src/article/entities/likedBy.entity';
import { User } from 'src/user/entities/user.entity';
import { UsersService } from 'src/user/users.service';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Article } from './entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Article, LikedBy])],
  controllers: [ArticleController],
  providers: [ArticleService, UsersService],
})
export class ArticleModule {}
