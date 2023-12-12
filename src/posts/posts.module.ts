import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { User } from 'src/user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Posts } from './posts.entity';
import { UsersService } from 'src/user/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Posts])],
  controllers: [PostsController],
  providers: [PostsService, UsersService],
})
export class PostsModule {}
