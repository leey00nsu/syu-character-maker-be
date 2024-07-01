import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Session,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
  forwardRef,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Prisma, User } from '@prisma/client';
import { SessionAuthGuard } from 'src/auth/guard/sessionAuth.guard';
import { SessionCheckInterceptor } from 'src/auth/interceptors/sessionCheck.interceptor';
import { HttpExceptionFilter } from 'src/filters/http-exception.filter';
import { UserService } from 'src/user/user.service';
import { ArticleLimitService } from './article-limit.service';
import { ArticleService } from './article.service';

@Controller('article')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class ArticleController {
  constructor(
    private articleService: ArticleService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => ArticleLimitService))
    private articleLimitService: ArticleLimitService,
  ) {}

  @Post('upload')
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadArticle(
    @Session() session,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Prisma.ArticleCreateInput,
  ) {
    const { id: userId }: User = session.user;

    const isUploadAvailable =
      await this.articleLimitService.isAvailable(userId);

    if (!isUploadAvailable) {
      throw new HttpException(
        '하루 업로드 제한을 초과하였습니다.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const imageUrl = await this.articleService.uploadImageToBucket(file);

    const newArticle: Prisma.ArticleCreateInput = {
      canvasName: body.canvasName,
      imageUrl: imageUrl,
      user: {
        connect: {
          id: userId,
        },
      },
    };

    await this.articleService.createArticle(newArticle);
    await this.articleLimitService.increasaeLimitCount(userId);

    return { statusCode: 200, message: '게시글 업로드 성공!' };
  }

  @Get('')
  @UseInterceptors(SessionCheckInterceptor)
  async getArticleList(
    @Session() session,
    @Query('page') page: number,
    @Query('orderBy') orderBy: 'date' | 'likeCount',
    @Query('order') order: 'ASC' | 'DESC',
    @Query('author') author: boolean,
  ) {
    const isLogin = session.user ? true : false;

    const { id: userId }: User = session.user ?? {};

    if (author && !isLogin) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    const articleList = await this.articleService.findPaginatedByOrder(
      page,
      orderBy,
      order,
      author,
      userId,
    );

    const articleListWithPresignedUrl = articleList.articles.map((article) => {
      return {
        ...article,
        imageUrl: session.presignedUrl + article.imageUrl,
      };
    });

    return {
      statusCode: 200,
      message: '모든 게시글 조회 성공!',
      data: {
        articles: articleListWithPresignedUrl,
        meta: articleList.meta,
      },
    };
  }

  @Get('limit')
  @UseGuards(SessionAuthGuard)
  async getArticleLimit(@Session() session) {
    const { id } = session.user;

    const availableCount = await this.articleLimitService.getAvailableCount(id);
    const maxLimit = this.articleLimitService.getMaxLimit();
    const isAvailable = await this.articleLimitService.isAvailable(id);

    return {
      statusCode: 200,
      message: '게시글 업로드 제한 조회 성공!',
      data: { availableCount, maxLimit, isAvailable },
    };
  }

  @Get('total')
  async getTotalArticleCount() {
    const totalArticles = await this.articleService.findAll();

    const totalArticleCount = totalArticles.length;

    return {
      statusCode: 200,
      message: '전체 게시글 수 조회 성공!',
      data: { count: totalArticleCount },
    };
  }

  @Get(':articleId')
  @UseInterceptors(SessionCheckInterceptor)
  async getArticle(@Param('articleId') articleId: number, @Session() session) {
    if (Number.isNaN(articleId)) {
      throw new BadRequestException('잘못된 요청입니다.');
    }

    const { id: userId }: User = session.user ?? {};

    const article = await this.articleService.findOne(articleId, userId);

    const articleWithPresignedUrl = {
      ...article,
      imageUrl: session.presignedUrl + article.imageUrl,
    };

    return {
      statusCode: 200,
      message: '게시글 조회 성공!',
      data: articleWithPresignedUrl,
    };
  }

  @Post(':articleId/like')
  @UseGuards(SessionAuthGuard)
  async toggleLikeArticle(
    @Session() session,
    @Param('articleId') articleId: number,
  ) {
    const { id: userId }: User = session.user;

    const liked = await this.articleService.toggleLike(userId, articleId);

    if (liked) {
      return { statusCode: 200, message: '좋아요!' };
    }

    return { statusCode: 200, message: '좋아요 취소!' };
  }

  @Delete(':articleId')
  @UseGuards(SessionAuthGuard)
  async deleteArticle(
    @Session() session,
    @Param('articleId') articleId: number,
  ) {
    const { id: userId }: User = session.user;

    await this.articleService.removeArticle(userId, articleId);

    return { statusCode: 200, message: '게시글 삭제 성공!' };
  }
}
