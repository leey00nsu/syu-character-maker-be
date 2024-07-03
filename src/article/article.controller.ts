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
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import { Prisma, User } from '@prisma/client';
import { ApiCommonResponse } from 'src/api-common-response.decorator';
import { SessionAuthGuard } from 'src/auth/guard/sessionAuth.guard';
import { SessionCheckInterceptor } from 'src/auth/interceptors/sessionCheck.interceptor';
import { HttpExceptionFilter } from 'src/filters/http-exception.filter';
import { ArticleLimitService } from './article-limit.service';
import { ArticleService } from './article.service';
import { ArticleCountResponseDto } from './dtos/article-count-response.dto';
import { ArticleListResponseDto } from './dtos/article-list-response.dto';
import { ArticleResponseDto } from './dtos/article-response.dto';
import { ArticleUploadLimitResponse } from './dtos/article-upload-limit-response.dts';
import { CreateArticleRequestDto } from './dtos/create-article-request.dto';

@Controller('article')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ClassSerializerInterceptor)
export class ArticleController {
  constructor(
    private articleService: ArticleService,
    @Inject(forwardRef(() => ArticleLimitService))
    private articleLimitService: ArticleLimitService,
  ) {}

  @Post('upload')
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '게시글 업로드',
    description: '세션 기반 인증 필요',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateArticleRequestDto })
  @ApiCommonResponse({
    description: '게시글 업로드 성공',
  })
  async uploadArticle(
    @Session() session,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateArticleRequestDto,
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
  @ApiOperation({
    summary: '게시글 목록',
    description: '세션 기반 인증에 따라 결과 필터링',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'orderBy',
    enum: ['date', 'likeCount'],
    required: true,
    description: '정렬 기준',
  })
  @ApiQuery({
    name: 'order',
    enum: ['ASC', 'DESC'],
    required: true,
    description: '정렬 순서',
  })
  @ApiQuery({
    name: 'author',
    type: Boolean,
    required: false,
    description: '작성자 게시글만 조회',
  })
  @ApiExtraModels(ArticleListResponseDto)
  @ApiCommonResponse({
    description: '게시글 목록',
    $ref: getSchemaPath(ArticleListResponseDto),
  })
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
  @ApiOperation({
    summary: '게시글 업로드 제한',
    description: '세션 기반 인증 필요',
  })
  @ApiExtraModels(ArticleUploadLimitResponse)
  @ApiCommonResponse({
    description: '게시글 제한 조회 성공',
    $ref: getSchemaPath(ArticleUploadLimitResponse),
  })
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
  @ApiOperation({
    summary: '전체 게시글 수',
    description: '전체 게시글 수',
  })
  @ApiExtraModels(ArticleCountResponseDto)
  @ApiCommonResponse({
    description: '전체 게시글 수 조회 성공',
    $ref: getSchemaPath(ArticleCountResponseDto),
  })
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
  @ApiOperation({
    summary: '게시글 정보',
    description: '세션 기반 인증에 따라 결과 필터링',
  })
  @ApiQuery({
    name: 'articleId',
    type: Number,
    required: true,
    description: '게시글 ID',
  })
  @ApiExtraModels(ArticleResponseDto)
  @ApiCommonResponse({
    description: '게시글 목록',
    $ref: getSchemaPath(ArticleResponseDto),
  })
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
  @ApiOperation({
    summary: '게시글 좋아요 토글',
    description: '세션 기반 인증 필요',
  })
  @ApiQuery({
    name: 'articleId',
    type: Number,
    required: true,
    description: '게시글 ID',
  })
  @ApiCommonResponse({
    description: '게시글 좋아요 토글 성공',
  })
  async toggleLikeArticle(
    @Session() session,
    @Param('articleId') articleId: number,
  ) {
    const { id: userId }: User = session.user;

    const { liked } = await this.articleService.toggleLike(userId, articleId);

    if (liked) {
      return { statusCode: 200, message: '좋아요!' };
    }

    return { statusCode: 200, message: '좋아요 취소!' };
  }

  @Delete(':articleId')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({
    summary: '게시글 삭제',
    description: '세션 기반 인증 필요',
  })
  @ApiQuery({
    name: 'articleId',
    type: Number,
    required: true,
    description: '게시글 ID',
  })
  @ApiCommonResponse({
    description: '게시글 삭제 성공',
  })
  async deleteArticle(
    @Session() session,
    @Param('articleId') articleId: number,
  ) {
    const { id: userId }: User = session.user;

    await this.articleService.removeArticle(userId, articleId);

    return { statusCode: 200, message: '게시글 삭제 성공!' };
  }
}
