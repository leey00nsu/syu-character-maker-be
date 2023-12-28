import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
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
import { UsersService } from 'src/user/users.service';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dtos/createArticle.dto';
import { ListArticleDto } from './dtos/listArticle.dto';

@Controller('article')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class ArticleController {
  constructor(
    private articleService: ArticleService,
    private usersService: UsersService,
  ) {}

  @Post('upload')
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadArticle(
    @Session() session,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateArticleDto,
  ) {
    const { id } = session.user;

    const user = await this.usersService.findOne(id);

    const imageUrl = await this.articleService.uploadImageToBucket(file);

    const newArticle = plainToInstance(CreateArticleDto, {
      canvasName: body.canvasName,
      imageUrl: imageUrl,
      author: user,
    });

    this.articleService.createArticle(newArticle);

    return { statusCode: 200, message: '게시글 업로드 성공!' };
  }

  @Get('')
  @UseInterceptors(SessionCheckInterceptor)
  async getArticleList(
    @Session() session,
    @Query('page') page: number,
    @Query('orderBy') orderBy: 'date' | 'like',
    @Query('order') order: 'ASC' | 'DESC',
  ) {
    const articleList =
      orderBy === 'date'
        ? await this.articleService.findPaginatedByDate(page, order)
        : await this.articleService.findPaginatedByLike(page, order);

    const isLogin = session.user ? true : false;

    // 게시글 리스트에 presignedUrl 붙여서 반환
    const articleListWithPresignedUrl = articleList.articles.map((article) => {
      const isLiked = isLogin
        ? article.likedBy.some((likedBy) => likedBy.userId === session.user.id)
        : false;
      const isOwner = isLogin ? article.author.id === session.user.id : false;
      const likeCount = article.likedBy.length;
      const presignedUrl = session.presignedUrl + article.imageUrl;

      const listArticle = plainToInstance(
        ListArticleDto,
        {
          ...article,
          isOwner,
          imageUrl: presignedUrl,
          isLiked,
          likeCount,
        },
        { excludeExtraneousValues: true, groups: ['masked'] },
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

  @Get(':articleId')
  @UseInterceptors(SessionCheckInterceptor)
  async getArticle(@Param('articleId') articleId: number, @Session() session) {
    const article = await this.articleService.findOne(articleId);

    if (!article) {
      throw new NotFoundException('존재하지 않는 게시글입니다.');
    }

    const isLogin = session.user ? true : false;

    // 게시글 리스트에 presignedUrl 붙여서 반환
    const isLiked = isLogin
      ? article.likedBy.some((likedBy) => likedBy.userId === session.user.id)
      : false;
    const isOwner = isLogin ? article.author.id === session.user.id : false;
    const likeCount = article.likedBy.length;
    const presignedUrl = session.presignedUrl + article.imageUrl;

    const listArticle = plainToInstance(
      ListArticleDto,
      {
        ...article,
        user: article.author,
        isOwner,
        imageUrl: presignedUrl,
        isLiked,
        likeCount,
      },
      { excludeExtraneousValues: true, groups: ['masked'] },
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

    const user = await this.usersService.findOne(id);
    const article = await this.articleService.findOne(articleId);
    const likedBy = await this.articleService.findLikedBy(id, articleId);

    if (likedBy) {
      this.articleService.removeLikedBy(likedBy);
      console.log(user.name + '님이 ' + article.id + ' 좋아요 취소!');
      return { statusCode: 200, message: '좋아요 취소!' };
    }

    const newLikedBy = {
      user: user,
      article: article,
    };

    this.articleService.createLikedBy(newLikedBy);
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

    this.articleService.removeArticle(article);

    return { statusCode: 200, message: '게시글 삭제 성공!' };
  }
}
