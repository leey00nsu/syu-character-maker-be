import {
  Controller,
  Get,
  Post,
  Session,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionAuthGuard } from 'src/auth/guard/sessionAuth.guard';
import { UsersService } from 'src/user/users.service';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private usersService: UsersService,
  ) {}

  @Post('upload')
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Session() session,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { provider, email } = session.user;

    const user = await this.usersService.findOne(provider, email);

    let imageUrl = '';

    try {
      imageUrl = await this.postsService.uploadImageToBucket(file);
    } catch (error) {
      console.log('버킷에 업로드 중 에러가 발생하였습니다. :' + error);
      return new Error('버킷에 업로드 중 에러가 발생하였습니다. :' + error);
    }

    const post = {
      title: '테스트 게시글',
      content: '테스트 게시글 내용',
      imageUrl: imageUrl,
      user,
    };

    this.postsService.createPost(post);
  }

  @Get('all')
  async getAllPosts(@Session() session) {
    const allPosts = await this.postsService.findAllPosts();

    if (!session.presignedUrl) {
      const presignedUrl = await this.postsService.getPresignedUrl();
      session.presignedUrl = presignedUrl;
    }

    const allPostsWithUrl = allPosts.map((post) => {
      return {
        ...post,
        imageUrl: session.presignedUrl + post.imageUrl,
      };
    });

    return allPostsWithUrl;
  }
}
