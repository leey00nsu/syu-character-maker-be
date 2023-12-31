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
  Param,
  Post,
  Query,
  Session,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { SessionAuthGuard } from 'src/auth/guard/sessionAuth.guard';
import { SessionCheckInterceptor } from 'src/auth/interceptors/sessionCheck.interceptor';
import { HttpExceptionFilter } from 'src/filters/http-exception.filter';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { ArticleLimitService } from './article-limit.service';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dtos/createArticle.dto';
import { ListArticleDto } from './dtos/listArticle.dto';

@Controller('article')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class ArticleController {
  constructor(
    private articleService: ArticleService,
    private userService: UserService,
    private articleLimitService: ArticleLimitService,
  ) {}

  @Post('upload')
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadArticle(
    @Session() session,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateArticleDto,
  ) {
    const { id }: User = session.user;

    const isUploadAvailable = await this.articleLimitService.isAvailable(id);

    if (!isUploadAvailable) {
      throw new HttpException(
        '하루 업로드 제한을 초과하였습니다.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.userService.findOne(id);

    const imageUrl = await this.articleService.uploadImageToBucket(file);

    const newArticle: CreateArticleDto = {
      canvasName: body.canvasName,
      imageUrl: imageUrl,
      author: user,
    };

    await this.articleService.createArticle(newArticle);
    await this.articleLimitService.increasaeLimitCount(id);

    return { statusCode: 200, message: '게시글 업로드 성공!' };
  }

  @Get('')
  @UseInterceptors(SessionCheckInterceptor)
  async getArticleList(
    @Session() session,
    @Query('page') page: number,
    @Query('orderBy') orderBy: 'date' | 'like',
    @Query('order') order: 'ASC' | 'DESC',
    @Query('author') author: boolean,
  ) {
    const isLogin = session.user ? true : false;

    const { id: userId }: User = session.user ?? {};

    if (author && !isLogin) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    const articleList =
      orderBy === 'date'
        ? await this.articleService.findPaginatedByDate(
            page,
            order,
            author,
            userId,
          )
        : await this.articleService.findPaginatedByLike(
            page,
            order,
            author,
            userId,
          );

    // 게시글 리스트에 presignedUrl 붙여서 반환
    const articleListWithPresignedUrl = articleList.articles.map((article) => {
      const isLiked = isLogin
        ? article.likedBy.some((likedBy) => likedBy.userId === userId)
        : false;
      const isAuthor = isLogin ? article.author.id === userId : false;
      const likeCount = article.likedBy.length;
      const presignedUrl = session.presignedUrl + article.imageUrl;

      const listArticle = plainToInstance(
        ListArticleDto,
        {
          ...article,
          isAuthor,
          imageUrl: presignedUrl,
          isLiked,
          likeCount,
        },
        { excludeExtraneousValues: true, groups: isAuthor ? [] : ['masked'] },
      );

      return listArticle;
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

    const article = await this.articleService.findOne(articleId);

    const isLogin = session.user ? true : false;

    // 게시글 리스트에 presignedUrl 붙여서 반환
    const isLiked = isLogin
      ? article.likedBy.some((likedBy) => likedBy.userId === session.user.id)
      : false;
    const isAuthor = isLogin ? article.author.id === session.user.id : false;
    const likeCount = article.likedBy.length;
    const presignedUrl = session.presignedUrl + article.imageUrl;

    const listArticle = plainToInstance(
      ListArticleDto,
      {
        ...article,
        user: article.author,
        isAuthor,
        imageUrl: presignedUrl,
        isLiked,
        likeCount,
      },
      { excludeExtraneousValues: true, groups: isAuthor ? [] : ['masked'] },
    );

    return {
      statusCode: 200,
      message: '게시글 조회 성공!',
      data: listArticle,
    };
  }

  @Post(':articleId/like')
  @UseGuards(SessionAuthGuard)
  async toggleLikeArticle(
    @Session() session,
    @Param('articleId') articleId: number,
  ) {
    const { id } = session.user;

    const user = await this.userService.findOne(id);
    const article = await this.articleService.findOne(articleId);
    const likedBy = await this.articleService.findLikedBy(id, articleId);

    if (likedBy) {
      await this.articleService.removeLikedBy(likedBy);
      console.log(user.name + '님이 ' + article.id + ' 좋아요 취소!');
      return { statusCode: 200, message: '좋아요 취소!' };
    }

    const newLikedBy = {
      user: user,
      article: article,
    };

    await this.articleService.createLikedBy(newLikedBy);
    console.log(user.name + '님이 ' + article.id + ' 좋아요!');

    return { statusCode: 200, message: '좋아요!' };
  }

  @Delete(':articleId')
  @UseGuards(SessionAuthGuard)
  async deleteArticle(
    @Session() session,
    @Param('articleId') articleId: number,
  ) {
    const { id } = session.user;

    const article = await this.articleService.findOne(articleId);

    if (article.author.id !== id) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    await this.articleService.removeArticle(article);

    return { statusCode: 200, message: '게시글 삭제 성공!' };
  }
}
