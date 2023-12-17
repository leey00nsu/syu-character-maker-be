import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Session,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionAuthGuard } from 'src/auth/guard/sessionAuth.guard';
import { UsersService } from 'src/user/users.service';
import { ArticleService } from './article.service';
import { ListArticle } from './dtos/listArticle.dto';

@Controller('article')
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
    const { providerId, email } = session.user;

    const user = await this.usersService.findOne(providerId, email);

    let imageUrl = '';

    try {
      imageUrl = await this.articleService.uploadImageToBucket(file);
    } catch (error) {
      console.log('버킷에 업로드 중 에러가 발생하였습니다. :' + error);
      return new Error('버킷에 업로드 중 에러가 발생하였습니다. :' + error);
    }

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
  async getAllArticles(@Session() session) {
    const allArticle = await this.articleService.findAll();

    if (!session.presignedUrl || new Date() > session.presignedUrlExpireTime) {
      const [presignedUrl, timeExpires] =
        await this.articleService.getPresignedUrl();
      session.presignedUrl = presignedUrl;
      session.presignedUrlExpireTime = timeExpires;
    }

    const allArticleWithUrl = allArticle.map((article) => {
      const listArticle = new ListArticle(article);

      return {
        ...listArticle,
        imageUrl: session.presignedUrl + listArticle.imageUrl,
      };
    });

    return {
      statusCode: 200,
      message: '모든 게시글 조회 성공!',
      data: allArticleWithUrl,
    };
  }

  @Get(':articleId')
  async getArticle(@Param('articleId', ParseIntPipe) articleId: number) {
    return await this.articleService.findLikedUser(articleId);
  }

  @Get(':articleId/like')
  @UseGuards(SessionAuthGuard)
  async toggleLikeArticle(
    @Session() session,
    @Param('articleId', ParseIntPipe) articleId: number,
  ) {
    const { userId, providerId, email } = session.user;

    const user = await this.usersService.findOne(providerId, email);

    const article = await this.articleService.findOne(articleId);

    const likedBy = await this.articleService.findLikedBy(userId, articleId);

    if (likedBy) {
      this.articleService.removeLikedBy(likedBy);
      return { statusCode: 200, message: '좋아요 취소!' };
    }

    const newLikedBy = {
      user: user,
      article: article,
    };

    this.articleService.createLikedBy(newLikedBy);

    return { statusCode: 200, message: '좋아요!' };
  }
}
