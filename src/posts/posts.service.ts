import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { common, objectstorage as os } from 'oci-sdk';
import { Posts } from './posts.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dtos/createPost.dto';
import * as crypto from 'crypto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Posts) private postsRepository: Repository<Posts>,
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

  async createPost(post: CreatePostDto) {
    const newPost = this.postsRepository.create(post);

    return this.postsRepository.save(newPost);
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
        timeExpires: new Date(Date.now() + 1000 * 60 * 60), // 유효 시간 1시간
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

      return presignedUrl;
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAllPosts() {
    return this.postsRepository.find();
  }
}
