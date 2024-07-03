import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import RedisStore from 'connect-redis';
import * as session from 'express-session';
import { AppModule } from './app.module';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = new DocumentBuilder()
    .setTitle('character-maker API')
    .setDescription('character-maker API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const redisService = app.select(RedisModule).get(RedisService);

  const redisClient = new RedisStore({
    client: await redisService.getClient(),
    prefix: 'session:',
  });

  app.use(
    session({
      store: redisClient,
      secret: process.env.SESSION_SECRET,
      resave: false,
      proxy: process.env.NODE_ENV === 'dev' ? false : true,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 1일 ,
        secure: process.env.NODE_ENV === 'dev' ? false : true,
        sameSite: process.env.NODE_ENV === 'dev' ? false : 'strict',
      },
    }),
  );

  await app.listen(3000);
}

bootstrap();
