import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { common, objectstorage as os } from 'oci-sdk';
import { Repository } from 'typeorm';
import { CreateArticleDto } from './dtos/createArticle.dto';
import { CreateLikedbyDto } from './dtos/createLikedby.dto';
import { Article } from './entities/article.entity';
import { LikedBy } from './entities/likedBy.entity';

@Injectable()
export class ArticleService {
  private readonly ociProvider: common.ConfigFileAuthenticationDetailsProvider;
  constructor(
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    @InjectRepository(LikedBy) private likedByRepository: Repository<LikedBy>,
  ) {
    // 오라클 클라우드 api config 파일 읽어오기
    const configurationFilePath = process.env.OCI_CONFIG_FILE_PATH;
    // const configurationFilePath = '~/.oci/config';
    const configProfile = 'DEFAULT';
    const provider: common.ConfigFileAuthenticationDetailsProvider =
      new common.ConfigFileAuthenticationDetailsProvider(
        configurationFilePath,
        configProfile,
      );

    this.ociProvider = provider;
  }

  async uploadImageToBucket(file: Express.Multer.File) {
    const bucket: string = 'syucharactermaker-bucket';
    const objectUUID: string = crypto.randomUUID();
    const client = new os.ObjectStorageClient({
      authenticationDetailsProvider: this.ociProvider,
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

  async createArticle(article: CreateArticleDto) {
    const newArticle = this.articleRepository.create(article);

    return this.articleRepository.save(newArticle);
  }

  async getPresignedUrl() {
    const bucket: string = 'syucharactermaker-bucket';
    const timeExpires = new Date(Date.now() + 1000 * 60 * 60); // 유효 시간 1시간

    const client = new os.ObjectStorageClient({
      authenticationDetailsProvider: this.ociProvider,
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

  async findPaginatedByDate(page: number = 1, order: 'ASC' | 'DESC' = 'DESC') {
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    const [articles, total] = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.likedBy', 'likedBy')
      .leftJoinAndSelect('likedBy.user', 'user')
      .select(['article', 'author', 'likedBy'])
      .groupBy('article.id')
      .addGroupBy('author.id')
      .addGroupBy('likedBy.id')
      .orderBy('article.createdAt', order)
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      articles: articles,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / pageSize),
      },
    };
  }

  async findPaginatedByLike(page: number = 1, order: 'ASC' | 'DESC' = 'DESC') {
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    const [articles, total] = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.likedBy', 'likedBy')
      .leftJoinAndSelect('likedBy.user', 'user')
      .select(['article', 'author', 'likedBy'])
      .addSelect('COUNT(likedBy.id)', 'like_count')
      .groupBy('article.id')
      .addGroupBy('author.id')
      .addGroupBy('likedBy.id')
      .orderBy('like_count', order)
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      articles: articles,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(articleId: number) {
    return await this.articleRepository
      .createQueryBuilder('article')
      .where('article.id = :articleId', { articleId })
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.likedBy', 'likedBy')
      .leftJoinAndSelect('likedBy.user', 'user')
      .select(['article', 'author', 'likedBy'])
      .addSelect('COUNT(likedBy.id)', 'like_count')
      .groupBy('article.id')
      .addGroupBy('author.id')
      .addGroupBy('likedBy.id')
      .getOne();
  }

  async findLikedUser(articleId: number) {
    return this.likedByRepository
      .createQueryBuilder('likedBy')
      .select('likedBy.userId')
      .where('likedBy.articleId = :articleId', { articleId })
      .getRawMany();
  }

  async createLikedBy(likedBy: CreateLikedbyDto) {
    const newLikedBy = this.likedByRepository.create(likedBy);

    return this.likedByRepository.save(newLikedBy);
  }

  async findLikedBy(userId: number, articleId: number) {
    return this.likedByRepository.findOne({
      where: { user: { id: userId }, article: { id: articleId } },
    });
  }

  async removeLikedBy(likedBy: LikedBy) {
    return this.likedByRepository.remove(likedBy);
  }

  async removeArticle(article: Article) {
    return this.articleRepository.remove(article);
  }
}
