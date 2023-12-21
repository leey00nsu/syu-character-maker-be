import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const redis = new Redis({
  //   host: '172.30.1.60',
  //   port: 6379,
  // });

  // const redisClinet = new RedisStore({
  //   client: redis,
  //   prefix: 'session:',
  // });

  app.enableCors({
    origin: ['http://localhost:5173', 'http://172.30.1.44:5173'],
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
      // store: redisClinet,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false },
    }),
  );

  await app.listen(3000);
}
bootstrap();
