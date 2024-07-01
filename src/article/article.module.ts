import { Module } from '@nestjs/common';
import { SessionCheckInterceptor } from 'src/auth/interceptors/sessionCheck.interceptor';
import { UserService } from 'src/user/user.service';
import { ArticleLimitService } from './article-limit.service';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';

@Module({
  controllers: [ArticleController],
  providers: [
    ArticleService,
    ArticleLimitService,
    UserService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: SessionCheckInterceptor,
    },
  ],
})
export class ArticleModule {}
