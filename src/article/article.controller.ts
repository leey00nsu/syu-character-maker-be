import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Session,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionAuthGuard } from 'src/auth/guard/sessionAuth.guard';
import { HttpExceptionFilter } from 'src/filters/http-exception.filter';
import { UsersService } from 'src/user/users.service';
import { ArticleService } from './article.service';
import { ListArticle } from './dtos/listArticle.dto';

@Controller('article')
@UseFilters(HttpExceptionFilter)
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
  ) {
    const { id } = session.user;

    const user = await this.usersService.findOne(id);

    const imageUrl = await this.articleService.uploadImageToBucket(file);

    const newArticle = {
      title: '테스트 게시글',
      content: '테스트 게시글 내용',
      imageUrl: imageUrl,
      author: user,
    };

    this.articleService.createArticle(newArticle);

    return { statusCode: 200, message: '게시글 업로드 성공!' };
  }

  @Get('')
  async getArticleList(@Session() session) {
    const articleList = await this.articleService.findAll();

    const isLogin = session.user ? true : false;

    console.log('now', new Date().getTime());
    console.log('sessionExpired', session.presignedUrlExpireTime);
    console.log(
      'isExpired',
      new Date().getTime() > Number(session.presignedUrlExpireTime),
    );

    const isExpired =
      new Date().getTime() > Number(session.presignedUrlExpireTime);

    // presignedUrl이 없거나 만료되었을 경우 새로 생성
    if (!session.presignedUrl || isExpired) {
      const [presignedUrl, timeExpires] =
        await this.articleService.getPresignedUrl();
      session.presignedUrl = presignedUrl;
      session.presignedUrlExpireTime = timeExpires;
    }

    // 게시글 리스트에 presignedUrl 붙여서 반환
    const articleListWithPresignedUrl = articleList.map((article) => {
      const isLiked = isLogin
        ? article.likedBy.some((likedBy) => likedBy.userId === session.user.id)
        : false;
      const likeCount = article.likedBy.length;
      const presignedUrl = session.presignedUrl + article.imageUrl;

      const listArticle = new ListArticle({
        ...article,
        isLiked,
        likeCount,
        presignedUrl,
      });

      return listArticle;
    });

    return {
      statusCode: 200,
      message: '모든 게시글 조회 성공!',
      data: articleListWithPresignedUrl,
    };
  }

  @Get(':articleId')
  async getArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    return await this.articleService.findOne(articleId);
  }

  @Post(':articleId/like')
  @UseGuards(SessionAuthGuard)
  async toggleLikeArticle(
    @Session() session,
    @Param('articleId', ParseIntPipe) articleId: number,
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
}
