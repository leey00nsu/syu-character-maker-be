import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LikedBy, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { objectstorage as os } from 'oci-sdk';
import { OciService } from 'src/oci/oci.service';
import { PrismaService } from 'src/prisma/prisma.service';
import maskString from 'src/utils/mask-string';

@Injectable()
export class ArticleService {
  constructor(
    private prisma: PrismaService,
    private ociService: OciService,
  ) {}

  async uploadImageToBucket(file: Express.Multer.File) {
    const bucket: string = 'syucharactermaker-bucket';
    const objectUUID: string = crypto.randomUUID();
    const client = new os.ObjectStorageClient({
      authenticationDetailsProvider: this.ociService.getProvider(),
    });

    try {
      console.log('버킷 Namespace 가져오는 중...');
      const request: os.requests.GetNamespaceRequest = {};
      const response = await client.getNamespace(request);
      const namespace = response.value;

      console.log('버킷에 파일 추가 중...');
      const putObjectRequest: os.requests.PutObjectRequest = {
        namespaceName: namespace,
        bucketName: bucket,
        putObjectBody: file.buffer,
        objectName: objectUUID,
        contentLength: file.size,
        contentType: 'image/png',
      };

      await client.putObject(putObjectRequest);
      console.log('버킷에 파일 추가 완료!');
    } catch (error) {
      throw new HttpException(
        '파일 업로드 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return objectUUID;
  }

  createArticle(article: Prisma.ArticleCreateInput) {
    return this.prisma.article.create({
      data: article,
    });
  }

  async getPresignedUrl() {
    const bucket: string = 'syucharactermaker-bucket';
    const timeExpires = new Date(Date.now() + 1000 * 60 * 60); // 유효 시간 1시간

    const client = new os.ObjectStorageClient({
      authenticationDetailsProvider: this.ociService.getProvider(),
    });

    try {
      console.log('버킷 Namespace 가져오는 중...');
      const namespaceRequest: os.requests.GetNamespaceRequest = {};
      const nameSpaceResponse = await client.getNamespace(namespaceRequest);
      const namespace = nameSpaceResponse.value;

      const parUniqueId = Date.now();
      const createPreauthenticatedRequestDetails = {
        name: parUniqueId.toString(),
        accessType:
          os.models.CreatePreauthenticatedRequestDetails.AccessType
            .AnyObjectRead,
        timeExpires: timeExpires,
      };

      console.log('버킷에 사전 인증 요청 ...');

      const putObjectRequest: os.requests.CreatePreauthenticatedRequestRequest =
        {
          namespaceName: namespace,
          bucketName: bucket,
          createPreauthenticatedRequestDetails:
            createPreauthenticatedRequestDetails,
        };

      console.log('presigned url 생성 중 ...');

      const presignResponse =
        await client.createPreauthenticatedRequest(putObjectRequest);

      const presignedUrl = presignResponse.preauthenticatedRequest.fullPath;

      return [presignedUrl, timeExpires.getTime()];
    } catch (error) {
      throw new HttpException(
        'presigned Url 생성 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findPaginatedByOrder(
    page: number = 1,
    orderBy: 'date' | 'likeCount',
    order: 'ASC' | 'DESC' = 'DESC',
    author: boolean,
    userId: number,
  ) {
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    const query = {
      where: author ? { authorId: userId } : {},
      orderBy:
        orderBy === 'date'
          ? {
              createdAt: order.toLowerCase() as Prisma.SortOrder,
            }
          : {
              likedBy: {
                _count: order.toLowerCase() as Prisma.SortOrder,
              },
            },
      skip,
      take: pageSize,
    };

    const [total, articles] = await this.prisma.$transaction([
      this.prisma.article.count(query),
      this.prisma.article.findMany({
        ...query,
        include: {
          user: true,
          likedBy: {
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likedBy: true,
            },
          },
        },
      }),
    ]);

    const articlesWithExtraInfo = articles.map((article) => {
      return {
        id: article.id,
        canvasName: article.canvasName,
        imageUrl: article.imageUrl,
        createdAt: article.createdAt,
        author: {
          email:
            article.authorId === userId
              ? article.user.email
              : maskString(article.user.email),
          name:
            article.authorId === userId
              ? article.user.name
              : maskString(article.user.name),
          photo: article.user.photo,
        },
        isAuthor: article.authorId === userId,
        isLiked: article.likedBy.some((likedBy) => likedBy.userId === userId),
        likeCount: article._count.likedBy,
      };
    });

    return {
      articles: articlesWithExtraInfo,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(articleId: number, userId: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        user: true,
        likedBy: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likedBy: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('존재하지 않는 게시글입니다.');
    }

    const articleWithExtraInfo = {
      id: article.id,
      canvasName: article.canvasName,
      imageUrl: article.imageUrl,
      createdAt: article.createdAt,
      author: {
        email:
          article.authorId === userId
            ? article.user.email
            : maskString(article.user.email),
        name:
          article.authorId === userId
            ? article.user.name
            : maskString(article.user.name),
        photo: article.user.photo,
      },
      isAuthor: article.authorId === userId,
      isLiked: article.likedBy.some((likedBy) => likedBy.userId === userId),
      likeCount: article._count.likedBy,
    };

    return articleWithExtraInfo;
  }

  async createLikedBy(userId: number, articleId: number) {
    return await this.prisma.likedBy.create({
      data: {
        userId,
        articleId,
      },
    });
  }

  async findLikedBy(userId: number, articleId: number) {
    const likedBy = await this.prisma.likedBy.findFirst({
      where: { userId, articleId },
    });

    return likedBy;
  }

  async removeLikedBy(likedBy: LikedBy) {
    return await this.prisma.likedBy.delete({
      where: {
        id: likedBy.id,
      },
    });
  }

  async toggleLike(userId: number, articleId: number) {
    const likedBy = await this.findLikedBy(userId, articleId);

    if (likedBy) {
      await this.removeLikedBy(likedBy);

      return { liked: false };
    }

    await this.createLikedBy(userId, articleId);

    return { liked: true };
  }

  async removeArticle(userId: number, articleId: number) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId, authorId: userId },
    });

    if (!article) {
      throw new NotFoundException('권한이 없습니다.');
    }

    return await this.prisma.article.delete({
      where: { id: articleId },
    });
  }

  async findAll() {
    return await this.prisma.article.findMany();
  }
}
