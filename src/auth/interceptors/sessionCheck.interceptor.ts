import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ArticleService } from 'src/article/article.service';

@Injectable()
export class SessionCheckInterceptor implements NestInterceptor {
  constructor(private articleService: ArticleService) {}
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();

    const isExpired =
      new Date().getTime() > Number(request.session.presignedUrlExpireTime);

    // presignedUrl이 없거나 만료되었을 경우 새로 생성
    if (!request.session.presignedUrl || isExpired) {
      const [presignedUrl, timeExpires] =
        await this.articleService.getPresignedUrl();
      request.session.presignedUrl = presignedUrl;
      request.session.presignedUrlExpireTime = timeExpires;
    }

    return next.handle();
  }
}
