import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import RedisStore from 'connect-redis';
import * as session from 'express-session';
import Redis from 'ioredis';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  });

  const redisClinet = new RedisStore({
    client: redis,
    prefix: 'session:',
  });

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

  app.use(
    session({
      store: redisClinet,
      secret: process.env.SESSION_SECRET,
      resave: false,
      proxy: true,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: true, sameSite: 'none' },
    }),
  );

  await app.listen(3000);
}
bootstrap();
