import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikedBy } from 'src/article/entities/likedBy.entity';
import { SessionCheckInterceptor } from 'src/auth/interceptors/sessionCheck.interceptor';
import { RedisService } from 'src/redis/redis.service';
import { User } from 'src/user/entities/user.entity';
import { UsersService } from 'src/user/users.service';
import { ArticleLimitService } from './article-limit.service';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { Article } from './entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Article, LikedBy])],
  controllers: [ArticleController],
  providers: [
    RedisService,
    ArticleService,
    ArticleLimitService,
    UsersService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: SessionCheckInterceptor,
    },
  ],
})
export class ArticleModule {}
