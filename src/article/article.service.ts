import { Injectable } from '@nestjs/common';
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
  constructor(
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    @InjectRepository(LikedBy) private likedByRepository: Repository<LikedBy>,
  ) {}

  async uploadImageToBucket(file: Express.Multer.File) {
    // 오라클 클라우드 api config 파일 읽어오기
    const configurationFilePath = '~/.oci/config';
    const configProfile = 'DEFAULT';
    const provider: common.ConfigFileAuthenticationDetailsProvider =
      new common.ConfigFileAuthenticationDetailsProvider(
        configurationFilePath,
        configProfile,
      );

    const bucket: string = 'syucharactermaker-bucket';
    const objectUUID: string = crypto.randomUUID();
    const client = new os.ObjectStorageClient({
      authenticationDetailsProvider: provider,
    });

    try {
      console.log('버킷 Namespace 가져오는 중...');
      const request: os.requests.GetNamespaceRequest = {};
      const response = await client.getNamespace(request);
      const namespace = response.value;

      // Create read stream to file
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
      throw new Error(error);
    }

    return objectUUID;
  }

  async createArticle(article: CreateArticleDto) {
    const newArticle = this.articleRepository.create(article);

    return this.articleRepository.save(newArticle);
  }

  async getPresignedUrl() {
    // 오라클 클라우드 api config 파일 읽어오기
    const configurationFilePath = '~/.oci/config';
    const configProfile = 'DEFAULT';
    const provider: common.ConfigFileAuthenticationDetailsProvider =
      new common.ConfigFileAuthenticationDetailsProvider(
        configurationFilePath,
        configProfile,
      );

    const bucket: string = 'syucharactermaker-bucket';
    const timeExpires = new Date(Date.now() + 1000 * 60 * 60); // 유효 시간 1시간

    const client = new os.ObjectStorageClient({
      authenticationDetailsProvider: provider,
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

      return [presignedUrl, timeExpires];
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAll() {
    return this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.likedBy', 'likedBy')
      .leftJoinAndSelect('likedBy.user', 'user')
      .select([
        'article.id',
        'article.title',
        'article.content',
        'article.imageUrl',
        'author.name',
        'likedBy.userId',
      ])
      .getMany();
  }

  async findOne(articleId: number) {
    return this.articleRepository.findOne({ where: { id: articleId } });
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
}
