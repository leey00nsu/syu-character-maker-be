import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleModule } from './article/article.module';
import { Article } from './article/entities/article.entity';
import { LikedBy } from './article/entities/likedBy.entity';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { User } from './user/entities/user.entity';
import { UsersModule } from './user/user.module';
import { ArticleLimitService } from './article/article-limit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: 'syu-character-maker',
      entities: [User, Article, LikedBy],
      // synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ArticleModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, ArticleLimitService],
})
export class AppModule {}
